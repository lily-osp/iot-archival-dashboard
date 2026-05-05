import mqtt from "mqtt";
import redis from "./redis";
import prisma from "./prisma";

const clients = new Map<string, mqtt.MqttClient>();

export async function getMqttClient() {
  // Backwards compatibility/trigger for boot
  await initializeMqttManager();
  // Return the first client if needed, or null since we use manager pattern now
  return Array.from(clients.values())[0] || null;
}

export async function initializeMqttManager() {
  const accounts = await prisma.aioAccount.findMany();
  
  if (accounts.length === 0) {
    console.warn("System Archive: No AioAccounts found. MQTT listener disabled.");
    return;
  }

  for (const account of accounts) {
    if (!clients.has(account.id)) {
      connectAccountMqtt(account.id, account.username, account.key);
    }
  }
}

export function disconnectAccountMqtt(accountId: string) {
  const client = clients.get(accountId);
  if (client) {
    client.end(true);
    clients.delete(accountId);
    console.log(`System Archive: Disconnected MQTT for account ID ${accountId}`);
  }
}

export function connectAccountMqtt(accountId: string, username: string, key: string) {
  if (clients.has(accountId)) {
    return; // Already connected
  }

  const HOST = "tls://io.adafruit.com";
  const PORT = 8883;

  try {
    const client = mqtt.connect(HOST, {
      port: PORT,
      username: username,
      password: key,
      protocol: "mqtts",
      reconnectPeriod: 30000,
    });

    clients.set(accountId, client);

    client.on("connect", () => {
      console.log(`System Archive: Connected to Adafruit IO MQTT for user: ${username}`);
      client.subscribe(`${username}/feeds/+`);
    });

    client.on("message", async (topic, message) => {
      const feedKey = topic.split("/").pop();
      const value = message.toString();

      if (feedKey) {
        redis.publish(`feed:${feedKey}`, value);
        redis.set(`last:${feedKey}`, value);
        const { recordDataPoint } = await import("./dataRetention");
        recordDataPoint(feedKey, value);

        try {
          const automations = await prisma.automation.findMany({
            where: { 
              isActive: true,
              conditions: { some: { feedKey: feedKey } }
            },
            include: { 
              conditions: true,
              actions: { orderBy: { order: 'asc' } }
            }
          });
          
          for (const rule of automations) {
            const ifConditions = rule.conditions.filter((c: any) => !c.isElse);
            const elseConditions = rule.conditions.filter((c: any) => c.isElse);

            const evaluateConditions = async (conditions: any[], matchType: string) => {
              if (conditions.length === 0) return true;
              let met = 0;
              for (const cond of conditions) {
                const currentValStr = cond.feedKey === feedKey ? value : await redis.get(`last:${cond.feedKey}`);
                if (currentValStr === null) continue;
                
                let triggered = false;
                const msgVal = parseFloat(currentValStr);
                const condVal = parseFloat(cond.value);
                
                if (!isNaN(msgVal) && !isNaN(condVal)) {
                  switch (cond.operator) {
                    case '>': triggered = msgVal > condVal; break;
                    case '<': triggered = msgVal < condVal; break;
                    case '>=': triggered = msgVal >= condVal; break;
                    case '<=': triggered = msgVal <= condVal; break;
                    case '==': triggered = msgVal === condVal; break;
                    case '!=': triggered = msgVal !== condVal; break;
                  }
                } else {
                  switch (cond.operator) {
                    case '==': triggered = currentValStr === cond.value; break;
                    case '!=': triggered = currentValStr !== cond.value; break;
                  }
                }
                if (triggered) met++;
              }
              return matchType === "ANY" ? met > 0 : met === conditions.length;
            };

            const isIfTriggered = ifConditions.length === 0 ? false : await evaluateConditions(ifConditions, rule.conditionMatch);
            
            let actionsToRun: any[] = [];
            let evaluationLog = "";

            if (isIfTriggered) {
              actionsToRun = rule.actions.filter((a: any) => !a.isElse);
              evaluationLog = "IF Block -> TRUE";
            } else {
              const isElseTriggered = elseConditions.length === 0 ? true : await evaluateConditions(elseConditions, rule.elseConditionMatch);
              if (isElseTriggered && (rule.actions.filter((a: any) => a.isElse).length > 0 || elseConditions.length > 0)) {
                actionsToRun = rule.actions.filter((a: any) => a.isElse);
                evaluationLog = elseConditions.length > 0 ? "ELSE IF Block -> TRUE" : "ELSE Block -> TRUE";
              }
            }

            if (actionsToRun.length > 0) {
              console.log(`System Archive: Rule [${rule.name}] evaluated (${evaluationLog}). Executing ${actionsToRun.length} actions.`);
              const { executeActions } = await import("./actionEngine");
              await executeActions(actionsToRun, 0, feedKey);
            }
          }
      } catch(err) {
        console.error("System Archive: Rule Evaluation Error:", err);
      }
    }
  });

    client.on("error", (err) => {
      if (err.message.includes("Connection refused")) {
        console.error(`System Archive: MQTT Connection Refused for user ${username}. Verify Credentials.`);
      } else {
        console.error(`System Archive: MQTT Error for user ${username}:`, err.message);
      }
    });

  } catch (err) {
    console.error(`System Archive: Failed to connect to MQTT for user ${username}.`);
  }
}

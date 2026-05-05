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
            let conditionsMet = 0;
            for (const cond of rule.conditions) {
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
              if (triggered) conditionsMet++;
            }

            const isTriggered = rule.conditionMatch === "ANY" 
              ? conditionsMet > 0 
              : conditionsMet === rule.conditions.length;

            if (rule.conditions.length > 0) {
              const actionsToRun = isTriggered ? rule.actions.filter((a: any) => !a.isElse) : rule.actions.filter((a: any) => a.isElse);

              if (actionsToRun.length > 0) {
                console.log(`System Archive: Rule [${rule.name}] evaluated (${isTriggered ? 'TRUE' : 'FALSE'}). Executing ${actionsToRun.length} actions.`);
                
                for (const action of actionsToRun) {
                if (action.type === "delay") {
                  console.log(`System Archive: Delaying for ${action.delayMs}ms`);
                  await new Promise(resolve => setTimeout(resolve, action.delayMs || 0));
                } else if (action.type === "publish" && action.feedKey) {
                  if (action.feedKey !== feedKey) {
                    const { sendFeedData } = await import("./adafruit");
                    console.log(`System Archive: Action Execution: ${action.feedKey} -> ${action.value}`);
                    await sendFeedData(action.feedKey, action.value!).catch(e => {
                      console.error(`System Archive: Automation Action [${action.feedKey}] Failed:`, e.message);
                    });
                  }
                } else if (action.type === "webhook" && action.targetUrl) {
                  try {
                    let parsedPayload = action.payload || "";
                    const matches = parsedPayload.match(/\{\{([^}]+)\}\}/g);
                    if (matches) {
                      for (const match of matches) {
                        const key = match.replace(/\{\{|\}\}/g, "");
                        const val = await redis.get(`last:${key}`);
                        parsedPayload = parsedPayload.replace(match, val || "");
                      }
                    }
                    console.log(`System Archive: Triggering Webhook: ${action.targetUrl}`);
                    await fetch(action.targetUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: parsedPayload
                    });
                  } catch (e: any) {
                    console.error(`System Archive: Webhook Failed:`, e.message);
                  }
                }
              }
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

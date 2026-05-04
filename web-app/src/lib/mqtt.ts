import mqtt from "mqtt";
import redis from "./redis";
import prisma from "./prisma";

async function getMqttCredentials() {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: ["ADAFRUIT_IO_USERNAME", "ADAFRUIT_IO_KEY"] },
    },
  });

  const username = configs.find(c => c.key === "ADAFRUIT_IO_USERNAME")?.value || process.env.ADAFRUIT_IO_USERNAME;
  const key = configs.find(c => c.key === "ADAFRUIT_IO_KEY")?.value || process.env.ADAFRUIT_IO_KEY;

  return { username, key };
}

let client: mqtt.MqttClient | null = null;

export async function getMqttClient() {
  if (client) return client;

  const { username, key } = await getMqttCredentials();
  
  if (!username || !key) {
    console.warn("System Archive: Adafruit IO credentials missing. MQTT listener disabled.");
    return null;
  }

  const HOST = "tls://io.adafruit.com";
  const PORT = 8883;

  try {
    client = mqtt.connect(HOST, {
      port: PORT,
      username: username,
      password: key,
      protocol: "mqtts",
      reconnectPeriod: 30000, // Wait 30s between retries
    });

    client.on("connect", () => {
      console.log(`System Archive: Connected to Adafruit IO MQTT for user: ${username}`);
      client?.subscribe(`${username}/feeds/+`);
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

            if (isTriggered && rule.conditions.length > 0) {
              console.log(`System Archive: Rule [${rule.name}] triggered. Executing ${rule.actions.length} actions.`);
              
              for (const action of rule.actions) {
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
      // Quiet logging for common connection issues
      if (err.message.includes("Connection refused")) {
        console.error("System Archive: MQTT Connection Refused. Verify Adafruit IO Credentials.");
      } else {
        console.error("System Archive: MQTT Error:", err.message);
      }
    });

    client.on("close", () => {
      // No-op to prevent spam
    });
  } catch (err) {
    console.error("System Archive: Failed to connect to MQTT.");
  }

  return client;
}

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

    client.on("message", (topic, message) => {
      const feedKey = topic.split("/").pop();
      const value = message.toString();

      if (feedKey) {
        redis.publish(`feed:${feedKey}`, value);
        redis.set(`last:${feedKey}`, value);
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

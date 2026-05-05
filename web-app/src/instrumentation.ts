export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getMqttClient } = await import("./lib/mqtt");
    const { syncAllTimeBasedAutomations, syncOpenDataJobs } = await import("./lib/bullmq");
    const prisma = (await import("./lib/prisma")).default;

    // Data Migration for Multi-Account
    try {
      const usernameConfig = await prisma.systemConfig.findUnique({ where: { key: "ADAFRUIT_IO_USERNAME" } });
      const keyConfig = await prisma.systemConfig.findUnique({ where: { key: "ADAFRUIT_IO_KEY" } });

      const envUsername = usernameConfig?.value || process.env.ADAFRUIT_IO_USERNAME;
      const envKey = keyConfig?.value || process.env.ADAFRUIT_IO_KEY;

      if (envUsername && envKey) {
        const existing = await prisma.aioAccount.findUnique({ where: { username: envUsername } });
        if (!existing) {
          const account = await prisma.aioAccount.create({
            data: {
              name: "Primary Account",
              username: envUsername,
              key: envKey
            }
          });
          
          await prisma.feedConfig.updateMany({
            where: { accountId: null },
            data: { accountId: account.id }
          });
          console.log(`System Archive: Migrated existing credentials for ${envUsername} to AioAccount.`);
        }
      }
    } catch (e) {
      console.log("System Archive: Migration skip or error", e);
    }
    
    try {
      await getMqttClient();
      console.log("System Archive: MQTT Listener Initialized.");
      await syncAllTimeBasedAutomations();
      await syncOpenDataJobs();
      console.log("System Archive: BullMQ Worker Initialized.");
    } catch (err) {
      console.error("System Archive: Failed to initialize background services:", err);
    }
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getMqttClient } = await import("./lib/mqtt");
    const { syncAllTimeBasedAutomations } = await import("./lib/bullmq");
    
    try {
      await getMqttClient();
      console.log("System Archive: MQTT Listener Initialized.");
      await syncAllTimeBasedAutomations();
      console.log("System Archive: BullMQ Worker Initialized.");
    } catch (err) {
      console.error("System Archive: Failed to initialize background services:", err);
    }
  }
}

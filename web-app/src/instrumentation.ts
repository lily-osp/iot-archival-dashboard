export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getMqttClient } = await import("./lib/mqtt");
    try {
      await getMqttClient();
      console.log("System Archive: MQTT Listener Initialized.");
    } catch (err) {
      console.error("System Archive: Failed to initialize MQTT Listener:", err);
    }
  }
}

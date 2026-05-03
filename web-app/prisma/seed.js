const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const demoPassword = await bcrypt.hash("demo123", 10);
  await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      password: demoPassword,
      role: "demo",
    },
  });

  const configs = [
    { key: "ADAFRUIT_IO_USERNAME", value: process.env.ADAFRUIT_IO_USERNAME || "demo", description: "Adafruit IO Username" },
    { key: "ADAFRUIT_IO_KEY", value: process.env.ADAFRUIT_IO_KEY || "demo", description: "Adafruit IO API Key" },
    { key: "DASHBOARD_TITLE", value: "IoT Archival Dashboard", description: "Main title of the application" },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  // 3. Create Demo Feeds
  const demoFeeds = [
    { key: "demo_temperature", name: "Ambient Temperature", lastValue: "24.5" },
    { key: "demo_humidity", name: "Relative Humidity", lastValue: "42.0" },
    { key: "demo_power", name: "System Power Consumption", lastValue: "128" },
    { key: "demo_light", name: "Main Gallery Lights", lastValue: "0" },
  ];

  for (const feed of demoFeeds) {
    await prisma.feedConfig.upsert({
      where: { key: feed.key },
      update: {},
      create: feed,
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

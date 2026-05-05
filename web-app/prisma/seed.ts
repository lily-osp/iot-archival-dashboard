import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Create Initial System Configs
  const configs = [
    { key: "ADAFRUIT_IO_USERNAME", value: process.env.ADAFRUIT_IO_USERNAME || "", description: "Adafruit IO Username" },
    { key: "ADAFRUIT_IO_KEY", value: process.env.ADAFRUIT_IO_KEY || "", description: "Adafruit IO API Key" },
    { key: "DASHBOARD_TITLE", value: "IoT Archival Dashboard", description: "Main title of the application" },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  // 2. Create Example Open Data Sources (Virtual Feeds)
  const openSources = [
    {
      name: "Lamongan Temperature (Open-Meteo)",
      url: "https://api.open-meteo.com/v1/forecast?latitude=-7.1189&longitude=112.4153&current=temperature_2m",
      jsonPath: "current.temperature_2m",
      scheduleCron: "*/15 * * * *",
    },
    {
      name: "Current Time (Asia/Jakarta)",
      url: "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Jakarta",
      jsonPath: "time",
      scheduleCron: "* * * * *",
    },
    {
      name: "Bitcoin USD Price (CoinGecko)",
      url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      jsonPath: "bitcoin.usd",
      scheduleCron: "*/5 * * * *",
    },
    {
      name: "ISS Current Latitude",
      url: "http://api.open-notify.org/iss-now.json",
      jsonPath: "iss_position.latitude",
      scheduleCron: "* * * * *",
    }
  ];

  for (const source of openSources) {
    const existing = await prisma.openDataSource.findFirst({ where: { name: source.name } });
    if (!existing) {
      await prisma.openDataSource.create({ data: source });
    } else {
      await prisma.openDataSource.update({ where: { id: existing.id }, data: source });
    }
  }

  // Cleanup any old problematic/duplicate ones from earlier test
  await prisma.openDataSource.deleteMany({
    where: { name: "Current Time (Jakarta/Lamongan)" }
  });
  
  // Cleanup duplicates of the others (keep the most recently updated if duplicated)
  for (const source of openSources) {
    const records = await prisma.openDataSource.findMany({ where: { name: source.name }, orderBy: { createdAt: 'asc' } });
    if (records.length > 1) {
      // delete all but the last one
      const toDelete = records.slice(0, records.length - 1).map(r => r.id);
      await prisma.openDataSource.deleteMany({ where: { id: { in: toDelete } } });
    }
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

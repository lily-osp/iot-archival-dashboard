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

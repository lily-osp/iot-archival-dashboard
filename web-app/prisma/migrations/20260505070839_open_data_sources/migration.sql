-- AlterTable
ALTER TABLE "AutomationAction" ADD COLUMN "payload" TEXT;
ALTER TABLE "AutomationAction" ADD COLUMN "targetUrl" TEXT;

-- CreateTable
CREATE TABLE "OpenDataSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "jsonPath" TEXT NOT NULL,
    "scheduleCron" TEXT NOT NULL,
    "targetFeedKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

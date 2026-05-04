/*
  Warnings:

  - You are about to drop the column `conditionFeedKey` on the `Automation` table. All the data in the column will be lost.
  - You are about to drop the column `conditionOperator` on the `Automation` table. All the data in the column will be lost.
  - You are about to drop the column `conditionValue` on the `Automation` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "AutomationCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedKey" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    CONSTRAINT "AutomationCondition_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "conditionMatch" TEXT NOT NULL DEFAULT 'ALL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Automation" ("createdAt", "id", "isActive", "name", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "updatedAt" FROM "Automation";
DROP TABLE "Automation";
ALTER TABLE "new_Automation" RENAME TO "Automation";
CREATE TABLE "new_AutomationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'publish',
    "feedKey" TEXT,
    "value" TEXT,
    "delayMs" INTEGER DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "automationId" TEXT NOT NULL,
    CONSTRAINT "AutomationAction_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AutomationAction" ("automationId", "feedKey", "id", "value") SELECT "automationId", "feedKey", "id", "value" FROM "AutomationAction";
DROP TABLE "AutomationAction";
ALTER TABLE "new_AutomationAction" RENAME TO "AutomationAction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

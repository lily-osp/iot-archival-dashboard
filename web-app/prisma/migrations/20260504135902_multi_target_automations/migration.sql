/*
  Warnings:

  - You are about to drop the column `actionFeedKey` on the `Automation` table. All the data in the column will be lost.
  - You are about to drop the column `actionValue` on the `Automation` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "AutomationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    CONSTRAINT "AutomationAction_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "conditionFeedKey" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Automation" ("conditionFeedKey", "conditionOperator", "conditionValue", "createdAt", "id", "isActive", "name", "updatedAt") SELECT "conditionFeedKey", "conditionOperator", "conditionValue", "createdAt", "id", "isActive", "name", "updatedAt" FROM "Automation";
DROP TABLE "Automation";
ALTER TABLE "new_Automation" RENAME TO "Automation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

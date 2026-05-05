-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EVENT',
    "scheduleCron" TEXT,
    "timezone" TEXT,
    "conditionMatch" TEXT NOT NULL DEFAULT 'ALL',
    "elseConditionMatch" TEXT NOT NULL DEFAULT 'ALL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Automation" ("conditionMatch", "createdAt", "id", "isActive", "name", "scheduleCron", "timezone", "type", "updatedAt") SELECT "conditionMatch", "createdAt", "id", "isActive", "name", "scheduleCron", "timezone", "type", "updatedAt" FROM "Automation";
DROP TABLE "Automation";
ALTER TABLE "new_Automation" RENAME TO "Automation";
CREATE TABLE "new_AutomationCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedKey" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isElse" BOOLEAN NOT NULL DEFAULT false,
    "automationId" TEXT NOT NULL,
    CONSTRAINT "AutomationCondition_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AutomationCondition" ("automationId", "feedKey", "id", "operator", "value") SELECT "automationId", "feedKey", "id", "operator", "value" FROM "AutomationCondition";
DROP TABLE "AutomationCondition";
ALTER TABLE "new_AutomationCondition" RENAME TO "AutomationCondition";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

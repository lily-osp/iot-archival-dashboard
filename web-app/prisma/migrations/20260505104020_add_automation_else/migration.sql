-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutomationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'publish',
    "feedKey" TEXT,
    "value" TEXT,
    "delayMs" INTEGER DEFAULT 0,
    "targetUrl" TEXT,
    "payload" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isElse" BOOLEAN NOT NULL DEFAULT false,
    "automationId" TEXT NOT NULL,
    CONSTRAINT "AutomationAction_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AutomationAction" ("automationId", "delayMs", "feedKey", "id", "order", "payload", "targetUrl", "type", "value") SELECT "automationId", "delayMs", "feedKey", "id", "order", "payload", "targetUrl", "type", "value" FROM "AutomationAction";
DROP TABLE "AutomationAction";
ALTER TABLE "new_AutomationAction" RENAME TO "AutomationAction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

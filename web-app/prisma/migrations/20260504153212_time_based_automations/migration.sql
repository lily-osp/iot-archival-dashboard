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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Automation" ("conditionMatch", "createdAt", "id", "isActive", "name", "updatedAt") SELECT "conditionMatch", "createdAt", "id", "isActive", "name", "updatedAt" FROM "Automation";
DROP TABLE "Automation";
ALTER TABLE "new_Automation" RENAME TO "Automation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

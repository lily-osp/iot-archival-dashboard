-- CreateTable
CREATE TABLE "AioAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeedConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastValue" TEXT,
    "accountId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeedConfig_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AioAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FeedConfig" ("id", "key", "lastValue", "name", "updatedAt") SELECT "id", "key", "lastValue", "name", "updatedAt" FROM "FeedConfig";
DROP TABLE "FeedConfig";
ALTER TABLE "new_FeedConfig" RENAME TO "FeedConfig";
CREATE UNIQUE INDEX "FeedConfig_key_key" ON "FeedConfig"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AioAccount_username_key" ON "AioAccount"("username");

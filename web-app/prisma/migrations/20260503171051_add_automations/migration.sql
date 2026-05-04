-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "conditionFeedKey" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "actionFeedKey" TEXT NOT NULL,
    "actionValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

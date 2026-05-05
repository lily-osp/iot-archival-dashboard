-- CreateTable
CREATE TABLE "DataPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "DataPoint_feedKey_createdAt_idx" ON "DataPoint"("feedKey", "createdAt");

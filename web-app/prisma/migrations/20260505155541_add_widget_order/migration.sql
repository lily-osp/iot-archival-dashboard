-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Widget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "feedKey" TEXT NOT NULL,
    "feedName" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "w" INTEGER NOT NULL,
    "h" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dashboardId" TEXT NOT NULL,
    CONSTRAINT "Widget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Widget" ("dashboardId", "feedKey", "feedName", "h", "id", "label", "settings", "type", "w", "x", "y") SELECT "dashboardId", "feedKey", "feedName", "h", "id", "label", "settings", "type", "w", "x", "y" FROM "Widget";
DROP TABLE "Widget";
ALTER TABLE "new_Widget" RENAME TO "Widget";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

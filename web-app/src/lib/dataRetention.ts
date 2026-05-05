import prisma from "./prisma";

// Configurable retention (e.g. 7 days)
const RETENTION_DAYS = 7;

export async function recordDataPoint(feedKey: string, value: string) {
  try {
    await prisma.dataPoint.create({
      data: {
        feedKey,
        value,
      },
    });

    // Fire and forget cleanup (runs roughly 1% of the time to avoid DB locking)
    if (Math.random() < 0.01) {
      purgeOldDataPoints().catch(console.error);
    }
  } catch (error) {
    console.error(`System Archive: Failed to record data point for ${feedKey}:`, error);
  }
}

export async function purgeOldDataPoints() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  try {
    const result = await prisma.dataPoint.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
    if (result.count > 0) {
      console.log(`System Archive: Purged ${result.count} old data points.`);
    }
  } catch (error) {
    console.error("System Archive: Failed to purge old data points:", error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchFeedData } from "@/lib/adafruit";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedKey: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feedKey } = await params;
  try {
    // If it's a demo feed, we generate some fake history
    if (feedKey.startsWith("demo_")) {
      const data = Array.from({ length: 20 }, (_, i) => {
        let value = 0;
        if (feedKey === "demo_temperature") value = 20 + Math.random() * 10;
        else if (feedKey === "demo_humidity") value = 40 + Math.random() * 20;
        else if (feedKey === "demo_power") value = 100 + Math.random() * 100;
        else value = Math.random() * 100;

        return {
          id: `sim_${i}`,
          value: value.toFixed(1),
          created_at: new Date(Date.now() - (20 - i) * 60000).toISOString()
        };
      });
      return NextResponse.json(data);
    }

    // Try fetching local data points first (this covers Virtual Feeds and hardware feeds since retention was added)
    const localPoints = await prisma.dataPoint.findMany({
      where: { feedKey },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100 points for charts to prevent massive payloads
    });

    if (feedKey.startsWith("open_")) {
      // For virtual feeds, only rely on local retention
      if (localPoints.length > 0) {
        return NextResponse.json(
          localPoints.map(p => ({
            id: p.id,
            value: p.value,
            created_at: p.createdAt.toISOString()
          }))
        );
      }
      
      // Fallback if no history yet to prevent empty chart error
      const { default: redis } = await import("@/lib/redis");
      const lastVal = await redis.get(`last:${feedKey}`);
      if (lastVal) {
        return NextResponse.json([{
          id: `virt_${Date.now()}`,
          value: lastVal,
          created_at: new Date().toISOString()
        }]);
      }
      return NextResponse.json([]);
    }

    // For Adafruit feeds, if we don't have enough local points (e.g. freshly booted), fallback to Adafruit IO API
    if (localPoints.length < 5) {
      const data = await fetchFeedData(feedKey);
      return NextResponse.json(data);
    }

    // Return the locally retained data points for Adafruit feeds
    return NextResponse.json(
      localPoints.map(p => ({
        id: p.id,
        value: p.value,
        created_at: p.createdAt.toISOString()
      }))
    );

  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

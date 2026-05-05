import { NextRequest, NextResponse } from "next/server";
import { fetchFeedData } from "@/lib/adafruit";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedKey: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feedKey } = await params;
  try {
    // If it's a virtual feed, we don't have Adafruit IO history. We could fetch from a DB if we stored it,
    // but for now, just return empty or a single point from Redis to avoid 404 errors on charts
    if (feedKey.startsWith("open_")) {
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

    const data = await fetchFeedData(feedKey);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

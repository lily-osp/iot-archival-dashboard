import { NextRequest, NextResponse } from "next/server";
import { sendFeedData } from "@/lib/adafruit";
import { getSession } from "@/lib/auth";
import redis from "@/lib/redis";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feedKey: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feedKey } = await params;
  try {
    const { value } = await request.json();

    if (feedKey.startsWith("open_")) {
      // It's a virtual feed, just publish to Redis and don't send to Adafruit IO
      await redis.publish(`feed:${feedKey}`, value);
      await redis.set(`last:${feedKey}`, value);
      return NextResponse.json({ id: `virt_${Date.now()}`, value, created_at: new Date().toISOString() });
    }

    // Send to Adafruit IO
    const result = await sendFeedData(feedKey, value);
    
    // Also publish to redis locally so UI updates instantly
    await redis.publish(`feed:${feedKey}`, value);
    await redis.set(`last:${feedKey}`, value);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending data:", error);
    return NextResponse.json({ error: "Failed to send data" }, { status: 500 });
  }
}

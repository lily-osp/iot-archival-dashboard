import { NextResponse } from "next/server";
import { fetchFeeds } from "@/lib/adafruit";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let feeds: any[] = [];
    try {
      feeds = await fetchFeeds();
      
      // Sync with SQLite
      for (const feed of feeds) {
        await prisma.feedConfig.upsert({
          where: { key: feed.key },
          update: {
            name: feed.name,
            lastValue: feed.last_value,
          },
          create: {
            key: feed.key,
            name: feed.name,
            lastValue: feed.last_value,
          },
        });
      }
    } catch (e) {
      console.warn("Adafruit IO fetch failed, using local feeds only");
    }

    // Always include local demo/configured feeds
    const localFeeds = await prisma.feedConfig.findMany();
    
    // Combine and remove duplicates based on key
    const allFeeds = [...feeds.map(f => ({ ...f, key: f.key, name: f.name, last_value: f.last_value })), ...localFeeds.map(f => ({ ...f, last_value: f.lastValue }))];
    const uniqueFeeds = Array.from(new Map(allFeeds.map(item => [item.key, item])).values())
      .filter(f => !f.key.startsWith("demo_"));

    return NextResponse.json(uniqueFeeds);
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return NextResponse.json({ error: "Failed to fetch feeds" }, { status: 500 });
  }
}

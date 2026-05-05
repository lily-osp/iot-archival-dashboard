import { NextResponse } from "next/server";
import { fetchFeeds, AioFeed } from "@/lib/adafruit";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let feeds: AioFeed[] = [];
    try {
      const accounts = await prisma.aioAccount.findMany();
      if (accounts.length === 0) {
        // Fallback to fetch from environment if no accounts in DB but env has them
        const defaultFeeds = await fetchFeeds();
        feeds = [...defaultFeeds];
        
        const remoteKeys = defaultFeeds.map(f => f.key);
        await prisma.feedConfig.deleteMany({
          where: {
            accountId: null,
            key: { notIn: remoteKeys },
            NOT: { key: { startsWith: "demo_" } }
          }
        });
      } else {
        for (const account of accounts) {
          try {
            const accFeeds = await fetchFeeds(account.id);
            feeds = [...feeds, ...accFeeds];

            // Prune local SQLite feeds for THIS account that no longer exist on Adafruit IO
            const remoteKeysForAcc = accFeeds.map(f => f.key);
            await prisma.feedConfig.deleteMany({
              where: {
                accountId: account.id,
                key: { notIn: remoteKeysForAcc },
                NOT: { key: { startsWith: "demo_" } }
              }
            });
          } catch (err) {
            console.error(`Failed to fetch feeds for account ${account.name}`, err);
          }
        }
      }
      
      // Sync with SQLite
      for (const feed of feeds) {
        await prisma.feedConfig.upsert({
          where: { key: feed.key },
          update: {
            name: feed.name,
            lastValue: feed.last_value,
            accountId: feed.accountId,
          },
          create: {
            key: feed.key,
            name: feed.name,
            lastValue: feed.last_value,
            accountId: feed.accountId,
          },
        });
      }
    } catch (e) {
      console.warn("Adafruit IO fetch failed, using local feeds only", e);
    }

    // Always include local demo/configured feeds
    const localFeeds = await prisma.feedConfig.findMany({ include: { account: true } });
    
    // Combine and remove duplicates based on key
    const allFeeds = [
      ...feeds.map(f => ({ ...f, key: f.key, name: f.name, last_value: f.last_value, accountName: f.accountId ? localFeeds.find(lf => lf.accountId === f.accountId)?.account?.name : null })), 
      ...localFeeds.map(f => ({ ...f, last_value: f.lastValue, accountName: f.account?.name }))
    ];
    
    const uniqueFeeds = Array.from(new Map(allFeeds.map(item => [item.key, item])).values())
      .filter(f => !f.key.startsWith("demo_"));

    // Add Open Data Virtual Feeds
    const openDataSources = await prisma.openDataSource.findMany({
      where: { targetFeedKey: null } // Only unlinked sources act as virtual feeds
    });
    
    const virtualFeeds = openDataSources.map(s => ({
      key: `open_${s.id}`,
      name: s.name,
      last_value: "Pending",
      accountName: "OPEN DATA SOURCE",
    }));

    return NextResponse.json([...uniqueFeeds, ...virtualFeeds]);
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return NextResponse.json({ error: "Failed to fetch feeds" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const rule = await prisma.automation.findUnique({
      where: { id },
      include: { actions: { orderBy: { order: "asc" } } },
    });

    if (!rule) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    console.log(`System Archive: Force Manual Run for Rule [${rule.name}]. Executing ${rule.actions.length} actions.`);

    // Execute actions sequentially
    for (const action of rule.actions) {
      if (action.type === "delay") {
        console.log(`System Archive: Delaying for ${action.delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, action.delayMs || 0));
      } else if (action.type === "publish" && action.feedKey) {
        const { sendFeedData } = await import("@/lib/adafruit");
        console.log(`System Archive: Action Execution: ${action.feedKey} -> ${action.value}`);
        await sendFeedData(action.feedKey, action.value!).catch((e) => {
          console.error(`System Archive: Automation Action [${action.feedKey}] Failed:`, e.message);
        });
      } else if (action.type === "webhook" && action.targetUrl) {
        try {
          let parsedPayload = action.payload || "";
          const matches = parsedPayload.match(/\{\{([^}]+)\}\}/g);
          if (matches) {
            for (const match of matches) {
              const key = match.replace(/\{\{|\}\}/g, "");
              const val = await redis.get(`last:${key}`);
              parsedPayload = parsedPayload.replace(match, val || "");
            }
          }
          console.log(`System Archive: Triggering Webhook: ${action.targetUrl}`);
          await fetch(action.targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: parsedPayload
          });
        } catch (e: any) {
          console.error(`System Archive: Webhook Failed:`, e.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Automation triggered successfully." });
  } catch (error: any) {
    console.error("Trigger automation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

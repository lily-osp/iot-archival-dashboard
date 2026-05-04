import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureFeed } from "@/lib/adafruit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(automations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();

    // Ensure condition and action feeds exist on Adafruit IO
    if (data.conditionFeedKey) {
      try { await ensureFeed(data.conditionFeedKey); } catch (e) {}
    }
    if (data.actionFeedKey) {
      try { await ensureFeed(data.actionFeedKey); } catch (e) {}
    }

    const automation = await prisma.automation.create({
      data: {
        name: data.name,
        conditionFeedKey: data.conditionFeedKey,
        conditionOperator: data.conditionOperator,
        conditionValue: data.conditionValue,
        actionFeedKey: data.actionFeedKey,
        actionValue: data.actionValue,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
    return NextResponse.json(automation);
  } catch (error) {
    console.error("Automation creation error:", error);
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureFeed } from "@/lib/adafruit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const automations = await prisma.automation.findMany({
      include: { 
        conditions: true,
        actions: { orderBy: { order: 'asc' } }
      },
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

    // Ensure condition feeds exist
    if (data.conditions) {
      for (const cond of data.conditions) {
        if (cond.feedKey) {
          try { await ensureFeed(cond.feedKey); } catch (e) {}
        }
      }
    }

    const automation = await prisma.automation.create({
      data: {
        name: data.name,
        conditionMatch: data.conditionMatch || "ALL",
        isActive: data.isActive !== undefined ? data.isActive : true,
        conditions: {
          create: (data.conditions || []).map((c: any) => ({
            feedKey: c.feedKey,
            operator: c.operator,
            value: c.value
          }))
        },
        actions: {
          create: (data.actions || []).map((a: any, index: number) => ({
            type: a.type || "publish",
            feedKey: a.feedKey || null,
            value: a.value || null,
            delayMs: a.delayMs ? parseInt(a.delayMs) : 0,
            order: index
          }))
        }
      },
      include: { 
        conditions: true,
        actions: { orderBy: { order: 'asc' } }
      }
    });
    return NextResponse.json(automation);
  } catch (error) {
    console.error("Automation creation error:", error);
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
}

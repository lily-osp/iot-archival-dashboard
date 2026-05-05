import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureFeed } from "@/lib/adafruit";
import { upsertRepeatableJob, removeRepeatableJob } from "@/lib/bullmq";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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

    // Use a transaction to update the automation and its actions/conditions
    const automation = await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const updated = await tx.automation.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type || "EVENT",
          scheduleCron: data.scheduleCron || null,
          timezone: data.timezone || null,
          conditionMatch: data.conditionMatch || "ALL",
          isActive: data.isActive
        }
      });

      // 2. Delete existing conditions and actions
      if (data.conditions) {
        await tx.automationCondition.deleteMany({
          where: { automationId: id }
        });
        if (data.conditions.length > 0) {
          await tx.automationCondition.createMany({
            data: data.conditions.map((c: any) => ({
              automationId: id,
              feedKey: c.feedKey,
              operator: c.operator,
              value: c.value
            }))
          });
        }
      }

      if (data.actions) {
        await tx.automationAction.deleteMany({
          where: { automationId: id }
        });
        if (data.actions.length > 0) {
          await tx.automationAction.createMany({
            data: data.actions.map((a: any, index: number) => ({
              automationId: id,
              type: a.type || "publish",
              feedKey: a.feedKey || null,
              value: a.value || null,
              delayMs: a.delayMs ? parseInt(a.delayMs) : 0,
              targetUrl: a.targetUrl || null,
              payload: a.payload || null,
              isElse: a.isElse || false,
              order: index
            }))
          });
        }
      }

      return tx.automation.findUnique({
        where: { id },
        include: { 
          conditions: true,
          actions: { orderBy: { order: 'asc' } }
        }
      });
    });

    if (automation) {
      if (automation.type === "TIME") {
        await upsertRepeatableJob(automation);
      } else {
        await removeRepeatableJob(automation.id);
      }
    }

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Automation update error:", error);
    return NextResponse.json({ error: "Failed to update automation" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.automation.delete({
      where: { id }
    });
    
    await removeRepeatableJob(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Automation delete error:", error);
    return NextResponse.json({ error: "Failed to delete automation" }, { status: 500 });
  }
}

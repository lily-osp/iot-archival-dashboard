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

    // Execute primary actions sequentially
    const { executeActions } = await import("@/lib/actionEngine");
    const primaryActions = rule.actions.filter((a: any) => !a.isElse);
    await executeActions(primaryActions, 0);

    return NextResponse.json({ success: true, message: "Automation triggered successfully." });
  } catch (error: any) {
    console.error("Trigger automation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

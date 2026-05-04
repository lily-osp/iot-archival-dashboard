import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureFeed } from "@/lib/adafruit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const data = await request.json();

    // Ensure condition and action feeds exist on Adafruit IO
    if (data.conditionFeedKey) {
      try { await ensureFeed(data.conditionFeedKey); } catch (e) {}
    }
    if (data.actionFeedKey) {
      try { await ensureFeed(data.actionFeedKey); } catch (e) {}
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: {
        name: data.name,
        conditionFeedKey: data.conditionFeedKey,
        conditionOperator: data.conditionOperator,
        conditionValue: data.conditionValue,
        actionFeedKey: data.actionFeedKey,
        actionValue: data.actionValue,
        isActive: data.isActive
      }
    });
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Automation delete error:", error);
    return NextResponse.json({ error: "Failed to delete automation" }, { status: 500 });
  }
}

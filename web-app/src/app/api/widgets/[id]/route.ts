import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "demo") {
    return NextResponse.json({ error: "Insufficient permissions. Demo users cannot modify archival specimens." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const data = await request.json();
    const widget = await prisma.widget.update({
      where: { id },
      data: {
        type: data.type,
        label: data.label,
        feedKey: data.feedKey,
        feedName: data.feedName,
        settings: data.settings ? JSON.stringify(data.settings) : undefined,
        x: data.x,
        y: data.y,
        w: data.w,
        h: data.h,
      }
    });
    return NextResponse.json(widget);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update widget" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "demo") {
    return NextResponse.json({ error: "Insufficient permissions. Demo users cannot expunge archival records." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.widget.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete widget" }, { status: 500 });
  }
}

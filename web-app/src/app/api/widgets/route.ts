import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureFeed } from "@/lib/adafruit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const widgets = await prisma.widget.findMany();
    return NextResponse.json(widgets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch widgets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();

    // Ensure feed exists on Adafruit IO
    if (data.feedKey) {
      try {
        await ensureFeed(data.feedKey, data.label);
      } catch (e) {
        console.error("System Archive: Failed to provision feed:", e);
      }
    }
    
    // For now, we assume a single dashboard exists or create a default one
    let dashboard = await prisma.dashboard.findFirst();
    if (!dashboard) {
      dashboard = await prisma.dashboard.create({
        data: { name: "Primary Archive" }
      });
    }

    const widget = await prisma.widget.create({
      data: {
        type: data.type,
        label: data.label,
        feedKey: data.feedKey,
        feedName: data.feedName,
        settings: JSON.stringify(data.settings || {}),
        x: data.x || 0,
        y: data.y || 0,
        w: data.w || 1,
        h: data.h || 1,
        dashboardId: dashboard.id
      }
    });
    return NextResponse.json(widget);
  } catch (error) {
    console.error("Widget creation error:", error);
    return NextResponse.json({ error: "Failed to create widget" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncOpenDataJobs, removeOpenDataJob } from "@/lib/bullmq"; // We'll implement these later

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.openDataSource.delete({
      where: { id }
    });

    if (typeof removeOpenDataJob === 'function') {
      try { await removeOpenDataJob(id); } catch(e) { console.error(e); }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete open data source" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const data = await request.json();
    const source = await prisma.openDataSource.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        jsonPath: data.jsonPath,
        scheduleCron: data.scheduleCron,
        targetFeedKey: data.targetFeedKey || null,
      }
    });

    if (typeof syncOpenDataJobs === 'function') {
      try { await syncOpenDataJobs(); } catch(e) { console.error(e); }
    }

    return NextResponse.json(source);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update open data source" }, { status: 500 });
  }
}
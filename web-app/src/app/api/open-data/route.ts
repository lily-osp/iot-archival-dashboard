import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncOpenDataJobs } from "@/lib/bullmq"; // We'll implement this later

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sources = await prisma.openDataSource.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(sources);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch open data sources" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const source = await prisma.openDataSource.create({
      data: {
        name: data.name,
        url: data.url,
        jsonPath: data.jsonPath,
        scheduleCron: data.scheduleCron,
        targetFeedKey: data.targetFeedKey || null,
      }
    });

    // We'll call syncOpenDataJobs() here later when we build it
    if (typeof syncOpenDataJobs === 'function') {
      try { await syncOpenDataJobs(); } catch(e) { console.error(e); }
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error("OpenDataSource creation error:", error);
    return NextResponse.json({ error: "Failed to create open data source" }, { status: 500 });
  }
}
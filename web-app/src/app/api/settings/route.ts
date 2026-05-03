import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configs = await prisma.systemConfig.findMany();
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Security: Block demo users from modifying system parameters
  if (session.role === "demo") {
    return NextResponse.json({ error: "Insufficient permissions. Demo users cannot modify core system parameters." }, { status: 403 });
  }

  try {
    const { key, value } = await request.json();
    const trimmedValue = typeof value === "string" ? value.trim() : value;
    
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value: trimmedValue },
      create: { key, value: trimmedValue },
    });
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const accounts = await prisma.aioAccount.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const account = await prisma.aioAccount.create({
      data: {
        name: data.name,
        username: data.username,
        key: data.key,
      }
    });
    return NextResponse.json({
      id: account.id,
      name: account.name,
      username: account.username
    });
  } catch (error) {
    console.error("Account creation error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

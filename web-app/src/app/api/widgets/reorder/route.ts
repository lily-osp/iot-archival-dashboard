import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { orders } = await request.json(); // Array of { id: string, order: number }

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Update all widgets in a transaction
    await prisma.$transaction(
      orders.map((item: { id: string; order: number }) =>
        prisma.widget.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Widget reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder widgets" }, { status: 500 });
  }
}

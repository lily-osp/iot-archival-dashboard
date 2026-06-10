import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "ADMIN_ONLY" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { emailVerified } = await request.json();

    const user = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { emailVerified: !!emailVerified },
    });

    return NextResponse.json({
      success: true,
      message: emailVerified ? "USER_VERIFIED" : "USER_UNVERIFIED",
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "ARCHIVE_COMMIT_FAILURE" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "ADMIN_ONLY" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.userId) {
    return NextResponse.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "USER_EXPUNGED" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "ARCHIVE_COMMIT_FAILURE" }, { status: 500 });
  }
}

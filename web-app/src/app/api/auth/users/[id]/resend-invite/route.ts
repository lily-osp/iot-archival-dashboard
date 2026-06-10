import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";
import { sendInviteEmail } from "@/lib/email";

export async function POST(
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
    const user = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "ALREADY_VERIFIED" }, { status: 400 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "NO_EMAIL_ON_FILE" }, { status: 400 });
    }

    // Invalidate existing tokens
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Create fresh invite token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        token,
        type: "invite",
        expiresAt,
        userId: user.id,
      },
    });

    const { error: emailError } = await sendInviteEmail(
      user.email,
      token,
      session.tenantName,
      session.username
    );

    if (emailError) {
      console.error("Failed to resend invite email:", emailError);
      return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "INVITE_RESENT" });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json({ error: "ARCHIVE_COMMIT_FAILURE" }, { status: 500 });
  }
}

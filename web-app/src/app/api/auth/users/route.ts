import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";
import { sendInviteEmail } from "@/lib/email";

const MAX_USERS_PER_TENANT = 5;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "ADMIN_ONLY" }, { status: 403 });
  }

  try {
    const { username, email, role } = await request.json();

    if (!username || !email) {
      return NextResponse.json({ error: "ALL_FIELDS_REQUIRED" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // Check user limit
    const userCount = await prisma.user.count({
      where: { tenantId: session.tenantId },
    });

    if (userCount >= MAX_USERS_PER_TENANT) {
      return NextResponse.json(
        { error: `USER_LIMIT_REACHED (${MAX_USERS_PER_TENANT} max)` },
        { status: 400 }
      );
    }

    // Check if email already exists in this tenant
    const existingEmail = await prisma.user.findFirst({
      where: { email, tenantId: session.tenantId },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "EMAIL_TAKEN_IN_ORG" }, { status: 400 });
    }

    // Check if username already exists in this tenant
    const existingUsername = await prisma.user.findFirst({
      where: { username, tenantId: session.tenantId },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "USERNAME_TAKEN_IN_ORG" }, { status: 400 });
    }

    // Create temp password (user will set real password via invite link)
    const tempPassword = randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role === "admin" ? "admin" : "user",
        tenantId: session.tenantId,
        emailVerified: false,
      },
    });

    // Create invite token
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

    // Send invite email
    const { error: emailError } = await sendInviteEmail(
      email,
      token,
      session.tenantName,
      session.username
    );
    if (emailError) {
      console.error("Failed to send invite email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "USER_INVITED",
      userId: user.id,
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "ARCHIVE_COMMIT_FAILURE" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "ADMIN_ONLY" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { tenantId: session.tenantId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json({ error: "ARCHIVE_QUERY_FAILURE" }, { status: 500 });
  }
}

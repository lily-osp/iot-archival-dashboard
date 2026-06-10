import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { orgName, username, email, password, confirmPassword } = await request.json();

    if (!orgName || !username || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "ALL_FIELDS_REQUIRED" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "PASSWORD_MISMATCH" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 400 });
    }

    // Generate slug from orgName
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      return NextResponse.json({ error: "ORG_NAME_TAKEN" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant + admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: orgName, slug },
      });

      const user = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: "admin",
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    // Create verification token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token,
        type: "verification",
        expiresAt,
        userId: result.user.id,
      },
    });

    // Send verification email
    const { error: emailError } = await sendVerificationEmail(email, token, orgName);
    if (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails - user can retry verification
    }

    return NextResponse.json({
      success: true,
      message: "ORGANIZATION_CREATED_CHECK_EMAIL",
      tenantSlug: result.tenant.slug,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "ARCHIVE_COMMIT_FAILURE" }, { status: 500 });
  }
}

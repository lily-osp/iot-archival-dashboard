import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, password, confirmPassword } = await request.json();

    if (!username || !password || !confirmPassword) {
      return NextResponse.json({ error: "ALL_FIELDS_REQUIRED" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "PASSWORD_MISMATCH" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "user" // Default to user for public registrations
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "USER_RECORD_CREATED",
      userId: user.id 
    });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "ARCHIVE_COMMIT_FAILURE" }, { status: 500 });
  }
}

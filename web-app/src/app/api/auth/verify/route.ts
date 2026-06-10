import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/verify?error=missing_token`);
  }

  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });

    if (!verificationToken) {
      return NextResponse.redirect(`${BASE_URL}/verify?error=invalid_token`);
    }

    if (verificationToken.used) {
      return NextResponse.redirect(`${BASE_URL}/verify?error=token_used`);
    }

    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.redirect(`${BASE_URL}/verify?error=token_expired`);
    }

    // Verify the user's email (token marked as used in set-password)
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    return NextResponse.redirect(`${BASE_URL}/set-password?token=${token}`);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(`${BASE_URL}/verify?error=internal_error`);
  }
}

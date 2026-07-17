import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification OTP code, and new password are required fields." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Find the verification token in DB
    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        email,
        token: otp,
      },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "Invalid email or verification OTP code." },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationRecord.expiresAt < new Date()) {
      // Clean up the expired token
      await prisma.verificationToken.delete({
        where: { id: verificationRecord.id },
      });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password and update user record
    const passwordHash = hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Delete the token so it cannot be used again
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset.",
    });
  } catch (error: any) {
    console.error("Reset Password Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting password." },
      { status: 500 }
    );
  }
}

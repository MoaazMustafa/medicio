import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = result.data;

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

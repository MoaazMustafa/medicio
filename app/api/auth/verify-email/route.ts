import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { z } from "zod";

const verifyEmailSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6).regex(/^\d+$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Email and a 6-digit numeric verification code are required." },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;

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
      await prisma.verificationToken.delete({
        where: { id: verificationRecord.id },
      });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Activate the user
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    // Delete verification token
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });

    // Automatically sign them in
    const token = signJwt({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("medicio_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error("Email Verification Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during email verification." },
      { status: 500 }
    );
  }
}

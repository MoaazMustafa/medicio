import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Generate a secure 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

      // Delete any existing tokens for this email to prevent spam
      await prisma.verificationToken.deleteMany({
        where: { email },
      });

      // Save token to database
      await prisma.verificationToken.create({
        data: {
          email,
          token: otp,
          expiresAt,
        },
      });

      // Send the email with the OTP code
      await sendOtpEmail(email, otp, "Password Reset Request");
    }

    // Always return success to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a verification OTP code has been dispatched.",
    });
  } catch (error: any) {
    console.error("Forgot Password OTP Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while requesting OTP." },
      { status: 500 }
    );
  }
}

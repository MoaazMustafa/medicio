import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { createOtp } from "@/lib/crypto";
import { sendOtpEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAuthEvent } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Enforce Rate Limiting (3 requests per 10 minutes per IP or email)
    const ip = getClientIp(request);
    const ipKey = `rate_forgot_ip_${ip}`;
    const emailKey = `rate_forgot_email_${body.email || ""}`;

    if (rateLimit(ipKey, { limit: 5, windowMs: 10 * 60 * 1000 }) || 
        (body.email && rateLimit(emailKey, { limit: 3, windowMs: 10 * 60 * 1000 }))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 10 minutes before requesting a new code." },
        { status: 429 }
      );
    }

    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      logAuthEvent("PASSWORD_RESET_REQUESTED_USER_FOUND", { email });
      // Generate a secure 6-digit numeric OTP
      const { otp, expiresAt } = createOtp();

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
    } else {
      logAuthEvent("PASSWORD_RESET_REQUESTED_USER_NOT_FOUND", { email });
    }

    // Always return success to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a verification OTP code has been dispatched.",
    });
  } catch (error: any) {
    logAuthEvent("PASSWORD_RESET_REQUEST_EXCEPTION", { error: error.message || error });
    console.error("Forgot Password OTP Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while requesting OTP." },
      { status: 500 }
    );
  }
}

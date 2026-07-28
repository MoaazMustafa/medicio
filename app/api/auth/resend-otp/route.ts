import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { createOtp } from "@/lib/crypto";
import { sendOtpEmail } from "@/lib/email";
import { logAuthEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/resend-otp
 *
 * Resends a 6-digit email verification OTP to a registered but unverified user.
 * Rate limited to prevent abuse. Always returns a success-shaped response
 * to avoid leaking whether the email is registered (anti-enumeration).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Enforce Rate Limiting (3 requests per 10 minutes per IP or email)
    const ip = getClientIp(request);
    const ipKey = `rate_resend_otp_ip_${ip}`;
    const emailKey = `rate_resend_otp_email_${body.email || ""}`;

    if (rateLimit(ipKey, { limit: 5, windowMs: 10 * 60 * 1000 }) || 
        (body.email && rateLimit(emailKey, { limit: 3, windowMs: 10 * 60 * 1000 }))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before requesting a new code." },
        { status: 429 }
      );
    }

    // Reuse the email-only schema from forgot-password (same shape)
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

    if (user && !user.isVerified) {
      const { otp, expiresAt } = createOtp();

      // Delete any existing tokens for this email first
      await prisma.verificationToken.deleteMany({
        where: { email },
      });

      await prisma.verificationToken.create({
        data: {
          email,
          token: otp,
          expiresAt,
        },
      });

      const emailSent = await sendOtpEmail(email, otp, "Email Verification");

      if (!emailSent) {
        logAuthEvent("RESEND_OTP_EMAIL_DISPATCH_FAILURE", { email });

        return NextResponse.json(
          { error: "Failed to send verification email. Please try again shortly." },
          { status: 502 }
        );
      }

      logAuthEvent("RESEND_OTP_SUCCESS", { email });
    } else {
      // Log silently but return same response shape to prevent enumeration
      logAuthEvent("RESEND_OTP_NO_ACTION", { email, reason: user ? "Already verified" : "Not found" });
    }

    return NextResponse.json({
      success: true,
      message: "If the email is registered and unverified, a new verification code has been sent.",
    });
  } catch (error: any) {
    logAuthEvent("RESEND_OTP_EXCEPTION", { error: error.message || error });
    console.error("Resend OTP Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resending the verification code." },
      { status: 500 }
    );
  }
}

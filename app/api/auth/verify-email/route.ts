import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { signSessionToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { logAuthEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-cookie";

const verifyEmailSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6).regex(/^\d+$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Enforce Rate Limiting (5 requests per 5 minutes per IP or email)
    const ip = getClientIp(request);
    const ipKey = `rate_verify_ip_${ip}`;
    const emailKey = `rate_verify_email_${body.email || ""}`;

    if (rateLimit(ipKey, { limit: 10, windowMs: 5 * 60 * 1000 }) || 
        (body.email && rateLimit(emailKey, { limit: 5, windowMs: 5 * 60 * 1000 }))) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 5 minutes before trying again." },
        { status: 429 }
      );
    }

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
      logAuthEvent("USER_EMAIL_VERIFICATION_FAILURE", { email, reason: "Invalid token or email" });
      return NextResponse.json(
        { error: "Invalid email or verification OTP code." },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationRecord.expiresAt < new Date()) {
      logAuthEvent("USER_EMAIL_VERIFICATION_FAILURE", { email, reason: "Expired token" });
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

    // Send Welcome Email asynchronously
    sendWelcomeEmail(updatedUser.email, updatedUser.name, updatedUser.role).catch((err) =>
      console.error("[email] Error sending welcome email:", err)
    );

    // Sign a JWT and set it explicitly on the response object.
    // Using cookies().set() inside Route Handlers does not reliably propagate
    // the Set-Cookie header to the final response on Vercel's serverless runtime.
    const token = await signSessionToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    logAuthEvent(
      "USER_EMAIL_VERIFICATION_SUCCESS",
      { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, reason: "OTP_VERIFIED" },
      { actorId: updatedUser.id, actorRole: updatedUser.role, entityId: updatedUser.id, ip }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    logAuthEvent("USER_EMAIL_VERIFICATION_EXCEPTION", { error: error.message || error });
    console.error("Email Verification Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during email verification." },
      { status: 500 }
    );
  }
}


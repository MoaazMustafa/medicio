import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { signSessionToken } from "@/lib/auth";
import { createOtp, verifyPassword } from "@/lib/crypto";
import { sendLoginDetectedEmail, sendOtpEmail } from "@/lib/email";
import { logAuthEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-cookie";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Enforce Rate Limiting (10 requests/min per IP, 5 requests/min per email)
    const ip = getClientIp(request);
    const ipKey = `rate_login_ip_${ip}`;
    const emailKey = `rate_login_email_${body.email || ""}`;

    if (rateLimit(ipKey, { limit: 10, windowMs: 60 * 1000 }) || 
        (body.email && rateLimit(emailKey, { limit: 5, windowMs: 60 * 1000 }))) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again after 60 seconds." },
        { status: 429 }
      );
    }

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await writeAudit({
        action: "USER_LOGIN_FAILURE",
        ip,
        metadata: { email, reason: "Email not found" },
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      await writeAudit({
        action: "USER_LOGIN_FAILURE",
        actorId: user.id,
        actorRole: user.role,
        entityType: "USER",
        entityId: user.id,
        ip,
        metadata: { email: user.email, reason: "Incorrect password" },
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      await writeAudit({
        action: "USER_LOGIN_BLOCKED_DEACTIVATED",
        actorId: user.id,
        actorRole: user.role,
        entityType: "USER",
        entityId: user.id,
        ip,
        metadata: { name: user.name, email: user.email, role: user.role, reason: "ACCOUNT_DEACTIVATED" },
      });
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      const { otp, expiresAt } = createOtp();

      await prisma.verificationToken.deleteMany({
        where: { email: user.email },
      });

      await prisma.verificationToken.create({
        data: {
          email: user.email,
          token: otp,
          expiresAt,
        },
      });

      await sendOtpEmail(user.email, otp, "Email Verification");

      await writeAudit({
        action: "USER_LOGIN_BLOCKED_UNVERIFIED",
        actorId: user.id,
        actorRole: user.role,
        entityType: "USER",
        entityId: user.id,
        ip,
        metadata: { name: user.name, email: user.email, role: user.role, reason: "UNVERIFIED_EMAIL" },
      });

      return NextResponse.json(
        { 
          error: "Please verify your email address. A fresh verification code has been sent.", 
          requiresVerification: true, 
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Sign a JWT and set it explicitly on the response object.
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await writeAudit({
      action: "USER_LOGIN_SUCCESS",
      actorId: user.id,
      actorRole: user.role,
      entityType: "USER",
      entityId: user.id,
      ip,
      metadata: { name: user.name, email: user.email, role: user.role, reason: "DIRECT_LOGIN" },
    });

    const userAgent = request.headers.get("user-agent") || undefined;
    const loginEmailSent = await sendLoginDetectedEmail(
      user.email,
      user.name,
      {
        time: new Date().toLocaleString(),
        ip,
        userAgent,
      },
      user.role
    );

    await writeAudit({
      action: "USER_LOGIN_EMAIL_SENT",
      actorId: user.id,
      actorRole: user.role,
      entityType: "USER",
      entityId: user.id,
      ip,
      metadata: { name: user.name, email: user.email, role: user.role, emailSent: loginEmailSent },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    logAuthEvent("USER_LOGIN_EXCEPTION", { error: error.message || error });
    console.error("Login Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}


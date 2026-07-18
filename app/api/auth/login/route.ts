import { cookies } from "next/headers";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/crypto";
import { sendOtpEmail } from "@/lib/email";
import { signJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAuthEvent } from "@/lib/logger";

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
      logAuthEvent("USER_LOGIN_FAILURE", { email, reason: "Email not found" });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      logAuthEvent("USER_LOGIN_FAILURE", { email, reason: "Incorrect password" });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

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

      logAuthEvent("USER_LOGIN_BLOCKED_UNVERIFIED", { email: user.email });

      return NextResponse.json(
        { 
          error: "Please verify your email address. A fresh verification code has been sent.", 
          requiresVerification: true, 
          email: user.email 
        },
        { status: 403 }
      );
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("medicio_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    logAuthEvent("USER_LOGIN_SUCCESS", { email: user.email, role: user.role });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    logAuthEvent("USER_LOGIN_EXCEPTION", { error: error.message || error });
    console.error("Login Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

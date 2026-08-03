import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/crypto";
import { sendPasswordChangedEmail } from "@/lib/email";
import { logAuthEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Enforce Rate Limiting (5 requests per 10 minutes per IP or email)
    const ip = getClientIp(request);
    const ipKey = `rate_reset_ip_${ip}`;
    const emailKey = `rate_reset_email_${body.email || ""}`;

    if (rateLimit(ipKey, { limit: 10, windowMs: 10 * 60 * 1000 }) || 
        (body.email && rateLimit(emailKey, { limit: 5, windowMs: 10 * 60 * 1000 }))) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again after 10 minutes." },
        { status: 429 }
      );
    }

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
      logAuthEvent("PASSWORD_RESET_FAILURE", { email, reason: "Invalid token or email" });
      return NextResponse.json(
        { error: "Invalid email or verification OTP code." },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationRecord.expiresAt < new Date()) {
      logAuthEvent("PASSWORD_RESET_FAILURE", { email, reason: "Expired token" });
      // Clean up the expired token
      await prisma.verificationToken.delete({
        where: { id: verificationRecord.id },
      });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password and update user record.
    // Also mark the account as verified — proving ownership of the email via
    // the OTP is equivalent to email verification. Without this, users who
    // trigger forgot-password before completing signup verification would be
    // permanently locked out of login.
    const passwordHash = hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { passwordHash, isVerified: true },
      select: { id: true, name: true, role: true, email: true },
    });

    // Delete the token so it cannot be used again
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });

    const emailSent = await sendPasswordChangedEmail(updatedUser.email, updatedUser.name || "User");

    await writeAudit({
      action: "USER_PASSWORD_CHANGED_EMAIL_SENT",
      actorId: updatedUser.id,
      actorRole: updatedUser.role,
      entityType: "USER",
      entityId: updatedUser.id,
      ip,
      metadata: { email: updatedUser.email, reason: "PASSWORD_RESET_OTP", emailSent },
    });

    logAuthEvent("PASSWORD_RESET_SUCCESS", { email });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset.",
    });
  } catch (error: any) {
    logAuthEvent("PASSWORD_RESET_EXCEPTION", { error: error.message || error });
    console.error("Reset Password Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting password." },
      { status: 500 }
    );
  }
}

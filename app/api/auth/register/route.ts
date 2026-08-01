import { UserRole } from "@prisma/client";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { getSession, hasRole } from "@/lib/auth";
import { createOtp, hashPassword, randomToken } from "@/lib/crypto";
import { sendOtpEmail } from "@/lib/email";
import { logAuthEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

// Roles that may only be provisioned by an existing administrator.
const RESTRICTED_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.PHARMACY_ADMIN,
  UserRole.LAB_ADMIN,
  UserRole.HOSPITAL_ADMIN,
];

const ADMIN_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Enforce Rate Limiting (10 registrations per 10 minutes per IP)
    const ip = getClientIp(request);
    const ipKey = `rate_register_ip_${ip}`;

    if (rateLimit(ipKey, { limit: 10, windowMs: 10 * 60 * 1000 })) {
      return NextResponse.json(
        { error: "Too many registration attempts from this IP. Please try again later." },
        { status: 429 }
      );
    }

    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, role } = result.data;

    // Resolve the caller's session once; an administrator may provision
    // privileged roles and those accounts skip email verification.
    const session = await getSession();
    const isAdminActor = hasRole(session, ADMIN_ROLES);

    if (RESTRICTED_ROLES.includes(role as UserRole) && !isAdminActor) {
      logAuthEvent("USER_REGISTER_FORBIDDEN_ROLE", { email, role });

      return NextResponse.json(
        { error: "Access denied. Only administrators can register manager or administrative account roles." },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const isVerified = isAdminActor;

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as UserRole,
        isVerified,
      },
    });

    if (!isVerified) {
      const { otp, expiresAt } = createOtp();

      await prisma.verificationToken.deleteMany({
        where: { email: newUser.email },
      });

      await prisma.verificationToken.create({
        data: {
          email: newUser.email,
          token: otp,
          expiresAt,
        },
      });

      const emailSent = await sendOtpEmail(newUser.email, otp, "Email Verification");

      logAuthEvent("USER_REGISTER_PENDING_VERIFICATION", { email: newUser.email, role: newUser.role });

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: newUser.email,
        emailSendFailed: !emailSent,
      });
    }

    logAuthEvent("USER_REGISTER_SUCCESS_AUTO_VERIFIED", { email: newUser.email, role: newUser.role });

    return NextResponse.json({
      success: true,
      requiresVerification: false,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    logAuthEvent("USER_REGISTER_FAILURE", { error: error.message || error });
    console.error("Registration Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}

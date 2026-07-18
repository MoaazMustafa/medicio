import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/crypto";
import { sendOtpEmail } from "@/lib/email";
import { verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAuthEvent } from "@/lib/logger";

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

    // Restricted roles check: only SUPER_ADMIN or ADMIN can create administrative/manager roles
    const restrictedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.PHARMACY_ADMIN,
      UserRole.LAB_ADMIN,
      UserRole.HOSPITAL_ADMIN,
    ];

    if (restrictedRoles.includes(role as UserRole)) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("medicio_session");
      if (!sessionCookie || !sessionCookie.value) {
        return NextResponse.json(
          { error: "Access denied. Only administrators can register manager or administrative account roles." },
          { status: 403 }
        );
      }

      const payload = verifyJwt(sessionCookie.value);
      if (!payload || (payload.role !== UserRole.SUPER_ADMIN && payload.role !== UserRole.ADMIN)) {
        return NextResponse.json(
          { error: "Access denied. Only administrators can register manager or administrative account roles." },
          { status: 403 }
        );
      }
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

    // If registered by Admin, set isVerified: true, otherwise false
    let isVerified = false;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("medicio_session");
    if (sessionCookie && sessionCookie.value) {
      const payload = verifyJwt(sessionCookie.value);
      if (payload && (payload.role === UserRole.SUPER_ADMIN || payload.role === UserRole.ADMIN)) {
        isVerified = true;
      }
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as UserRole,
        isVerified,
      },
    });

    // If role is doctor, create empty doctor profile
    if (role === UserRole.DOCTOR) {
      await prisma.doctor.create({
        data: {
          userId: newUser.id,
          specialty: "General Medicine",
          education: "Not Specified",
          experience: 0,
          licenseNumber: "TEMP-" + Math.floor(Math.random() * 1000000),
          isVerified: false,
        },
      });
    }

    if (!isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.verificationToken.create({
        data: {
          email: newUser.email,
          token: otp,
          expiresAt,
        },
      });

      await sendOtpEmail(newUser.email, otp, "Email Verification");

      logAuthEvent("USER_REGISTER_PENDING_VERIFICATION", { email: newUser.email, role: newUser.role });

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: newUser.email,
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

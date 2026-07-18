import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { signJwt, verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { registerSchema } from "@/lib/validations/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: newUser.email,
      });
    }

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
    console.error("Registration Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { signJwt, verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required registration parameters." },
        { status: 400 }
      );
    }

    // Check if role is valid
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

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

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as UserRole,
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

    const token = signJwt({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("medicio_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { signJwt } from "@/lib/jwt";
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

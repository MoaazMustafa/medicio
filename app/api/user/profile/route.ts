import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clearSessionCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * GET /api/user/profile — fetch current user profile details from PostgreSQL database.
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Fetch profile error: ", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/user/profile — persist profile updates to PostgreSQL database.
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, avatarUrl, role: targetRole } = body;

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { doctorProfile: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    let roleChanged = false;

    // Role conversion / mode switching logic for Doctors
    if (targetRole && (targetRole === "PATIENT" || targetRole === "DOCTOR")) {
      const isDoctorAccount = currentUser.role === "DOCTOR" || Boolean(currentUser.doctorProfile);

      if (isDoctorAccount && targetRole !== currentUser.role) {
        updateData.role = targetRole;
        roleChanged = true;

        if (targetRole === "PATIENT") {
          // Unverified doctor changed role -> purge doctor application record completely from verification queue
          await prisma.doctor.deleteMany({
            where: { userId: session.userId },
          });
          updateData.isVerified = false;
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (roleChanged) {
      await clearSessionCookie();
      const response = NextResponse.json({
        success: true,
        requiresLogout: true,
        message: "Account role updated successfully. Please log in again with your updated role.",
        user: updatedUser,
      });
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update profile error: ", error);
    return NextResponse.json(
      { error: "Failed to update profile details in database." },
      { status: 500 },
    );
  }
}

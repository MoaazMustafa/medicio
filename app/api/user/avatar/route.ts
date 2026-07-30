import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSession, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-cookie";

/**
 * DELETE /api/user/avatar
 * Manually removes/clears the authenticated user's profile avatar picture.
 */
export async function DELETE() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear avatarUrl in database
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: null },
    });

    // Re-issue session cookie without avatarUrl
    const token = await signSessionToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatarUrl: null,
    });

    const response = NextResponse.json({
      success: true,
      message: "Profile image removed successfully.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        avatarUrl: null,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error("Avatar Removal Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while removing profile picture." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/avatar
 * Manually sets or removes the authenticated user's profile avatar picture.
 * Body: { avatarUrl: string | null }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : null;

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl },
    });

    const token = await signSessionToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
    });

    const response = NextResponse.json({
      success: true,
      message: avatarUrl ? "Profile image updated." : "Profile image removed.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error("Avatar Update Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating profile picture." },
      { status: 500 }
    );
  }
}

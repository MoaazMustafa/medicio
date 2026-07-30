import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/user/password — update user password in PostgreSQL database.
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify current password if user has a password set
    if (user.passwordHash && !user.passwordHash.startsWith("OAUTH_ONLY")) {
      const isValid = verifyPassword(currentPassword || "", user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password entered is incorrect." },
          { status: 400 },
        );
      }
    }

    const newPasswordHash = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully in database.",
    });
  } catch (error: any) {
    console.error("Update password error: ", error);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 },
    );
  }
}

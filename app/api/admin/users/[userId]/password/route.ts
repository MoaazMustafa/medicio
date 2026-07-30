import { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import { hashPassword } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/**
 * PATCH /api/admin/users/[userId]/password — Admin password change endpoint.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { session, response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    const { userId } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const passwordHash = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash },
    });

    await writeAudit({
      action: "ADMIN_USER_PASSWORD_CHANGED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "USER",
      entityId: target.id,
      ip: getClientIp(request),
      metadata: {
        targetEmail: target.email,
        targetName: target.name,
      },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error: any) {
    console.error("Admin user password update error: ", error);
    return NextResponse.json(
      { error: "Failed to update user password." },
      { status: 500 },
    );
  }
}

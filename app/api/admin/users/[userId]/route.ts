import { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";
import { updateUserSchema } from "@/lib/validations/admin";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/** Roles only a SUPER_ADMIN may grant, revoke, or act upon. */
const PRIVILEGED_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

/**
 * PATCH /api/admin/users/[userId] — change a user's role or active state.
 * Rules (SRS §6 RBAC matrix + plan Phase B):
 *  - Actors may never modify their own account (prevents self-lockout).
 *  - Only SUPER_ADMIN may touch SUPER_ADMIN/ADMIN accounts or grant those roles.
 *  - Every change is written to the audit trail with before/after values.
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
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { role: newRole, isActive } = result.data;

    if (userId === session.userId) {
      return NextResponse.json(
        { error: "You cannot modify your own account from the admin console." },
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const actorIsSuper = session.role === UserRole.SUPER_ADMIN;

    // Acting on a privileged account requires SUPER_ADMIN.
    if (PRIVILEGED_ROLES.includes(target.role) && !actorIsSuper) {
      return NextResponse.json(
        { error: "Only a Super Admin can modify administrative accounts." },
        { status: 403 },
      );
    }

    // Granting a privileged role requires SUPER_ADMIN.
    if (newRole && PRIVILEGED_ROLES.includes(newRole) && !actorIsSuper) {
      return NextResponse.json(
        { error: "Only a Super Admin can grant administrative roles." },
        { status: 403 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        ...(newRole !== undefined ? { role: newRole } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    await writeAudit({
      action: "ADMIN_USER_UPDATED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "USER",
      entityId: target.id,
      ip: getClientIp(request),
      metadata: {
        targetEmail: target.email,
        before: { role: target.role, isActive: target.isActive },
        after: { role: updated.role, isActive: updated.isActive },
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Admin user update error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating the user." },
      { status: 500 },
    );
  }
}

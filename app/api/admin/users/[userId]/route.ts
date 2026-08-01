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
const PRIVILEGED_ROLES: string[] = ["SUPER_ADMIN", "ADMIN"];

/**
 * PATCH /api/admin/users/[userId] — change a user's role, name, or active state.
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

    const { role: newRole, name: newName, isActive, isVerified } = result.data;

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const actorIsSuper = (session.role as string) === "SUPER_ADMIN";

    // Non-super-admins cannot modify privileged accounts
    if (PRIVILEGED_ROLES.includes(target.role as string) && !actorIsSuper) {
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

    // Safe update using Prisma or raw SQL fallback for custom role strings
    let updatedRole = target.role as string;

    if (newRole !== undefined) {
      try {
        await prisma.user.update({
          where: { id: target.id },
          data: { role: newRole as any },
        });
        updatedRole = newRole;
      } catch {
        // Fallback for custom role string if PostgreSQL enum type cast is required
        await prisma.$executeRawUnsafe(
          `UPDATE users SET role = $1 WHERE id = $2`,
          newRole,
          target.id,
        );
        updatedRole = newRole;
      }

      if (newRole !== "DOCTOR") {
        await prisma.doctor.deleteMany({
          where: { userId: target.id },
        });
      }
    }

    if (isActive !== undefined || newName !== undefined || isVerified !== undefined) {
      await prisma.user.update({
        where: { id: target.id },
        data: {
          ...(isActive !== undefined ? { isActive } : {}),
          ...(newName !== undefined ? { name: newName } : {}),
          ...(isVerified !== undefined ? { isVerified } : {}),
        },
      });

      if (isVerified === false) {
        // When admin unverifies doctor, delete submitted application so doctor must resubmit
        await prisma.doctor.deleteMany({
          where: { userId: target.id },
        });
      } else if (isVerified === true) {
        await prisma.doctor.updateMany({
          where: { userId: target.id },
          data: { isVerified: true },
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: target.id },
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
        after: { role: updatedUser?.role || updatedRole, isActive: updatedUser?.isActive },
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Admin user update error: ", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while updating the user." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users/[userId] — delete a user account from the admin console.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { session, response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    const { userId } = await params;

    if (userId === session.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account from the admin console." },
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

    const actorIsSuper = (session.role as string) === "SUPER_ADMIN";

    if (PRIVILEGED_ROLES.includes(target.role as string) && !actorIsSuper) {
      return NextResponse.json(
        { error: "Only a Super Admin can delete administrative accounts." },
        { status: 403 },
      );
    }

    await prisma.user.delete({
      where: { id: target.id },
    });

    await writeAudit({
      action: "ADMIN_USER_DELETED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "USER",
      entityId: target.id,
      ip: getClientIp(request),
      metadata: {
        targetEmail: target.email,
        targetName: target.name,
        targetRole: target.role,
      },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error: any) {
    console.error("Admin user delete error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the user." },
      { status: 500 },
    );
  }
}

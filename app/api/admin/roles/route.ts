import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/**
 * GET /api/admin/roles — List all custom roles created by Super Admin or Admin (FR-IAM-04).
 */
export async function GET() {
  const { session, response } = await requireRole(ADMIN_ROLES);
  if (response) return response;

  try {
    const customRoles: any = await prisma.$queryRawUnsafe(
      `SELECT id, name, description, permissions, "createdAt", "updatedAt" FROM custom_roles ORDER BY "createdAt" DESC`,
    );

    const formattedRoles = (Array.isArray(customRoles) ? customRoles : []).map((role: any) => {
      let perms = [];
      try {
        perms = typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions || [];
      } catch {
        perms = [];
      }
      return {
        ...role,
        permissions: perms,
      };
    });

    return NextResponse.json({ customRoles: formattedRoles });
  } catch (error: any) {
    console.error("Fetch custom roles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom roles." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/roles — Provision a new Custom Role or update existing permissions (FR-IAM-04).
 */
export async function POST(req: Request) {
  const { session, response } = await requireRole(ADMIN_ROLES);
  if (response) return response;

  try {
    const body = await req.json();
    const { name, description, permissions, targetUserEmail } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Custom role name identifier is required." },
        { status: 400 },
      );
    }

    const rawName = name.trim().toUpperCase().replace(/\s+/g, "_");
    const normalizedRoleName = rawName.startsWith("CUSTOM_")
      ? rawName
      : `CUSTOM_${rawName}`;
    const permissionsArray = Array.isArray(permissions) ? permissions : [];

    // Check if role name already exists in custom_roles table
    const existingRoles: any = await prisma.$queryRawUnsafe(
      `SELECT id FROM custom_roles WHERE name = $1 LIMIT 1`,
      normalizedRoleName,
    );

    const now = new Date();

    if (Array.isArray(existingRoles) && existingRoles.length > 0) {
      // Upsert/Update existing custom role
      const roleId = existingRoles[0].id;
      await prisma.$executeRawUnsafe(
        `UPDATE custom_roles SET description = $1, permissions = $2, "updatedAt" = $3 WHERE id = $4`,
        description || null,
        JSON.stringify(permissionsArray),
        now,
        roleId,
      );

      void writeAudit({
        action: "SUPER_ADMIN_CUSTOM_ROLE_UPDATED",
        actorId: session.userId,
        actorRole: session.role,
        metadata: {
          roleName: normalizedRoleName,
          permissions: permissionsArray,
          targetUserEmail: targetUserEmail || null,
        },
      });

      return NextResponse.json({
        success: true,
        customRole: {
          id: roleId,
          name: normalizedRoleName,
          description: description || null,
          permissions: permissionsArray,
          updatedAt: now.toISOString(),
        },
      });
    }

    const newId = `crole_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO custom_roles (id, name, description, permissions, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)`,
      newId,
      normalizedRoleName,
      description || null,
      JSON.stringify(permissionsArray),
      now,
      now,
    );

    const createdRole = {
      id: newId,
      name: normalizedRoleName,
      description: description || null,
      permissions: permissionsArray,
      createdAt: now.toISOString(),
    };

    // Write audit log event
    void writeAudit({
      action: "SUPER_ADMIN_CUSTOM_ROLE_CREATED",
      actorId: session.userId,
      actorRole: session.role,
      metadata: {
        roleName: normalizedRoleName,
        permissions: permissionsArray,
        targetUserEmail: targetUserEmail || null,
      },
    });

    return NextResponse.json({
      success: true,
      customRole: createdRole,
    });
  } catch (error: any) {
    console.error("Create custom role error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create custom role in database." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/roles — Delete a Custom Role by ID.
 */
export async function DELETE(req: Request) {
  const { session, response } = await requireRole(ADMIN_ROLES);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("id");

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required for deletion." },
        { status: 400 },
      );
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM custom_roles WHERE id = $1`,
      roleId,
    );

    void writeAudit({
      action: "SUPER_ADMIN_CUSTOM_ROLE_DELETED",
      actorId: session.userId,
      actorRole: session.role,
      metadata: { deletedRoleId: roleId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete custom role error:", error);
    return NextResponse.json(
      { error: "Failed to delete custom role." },
      { status: 500 },
    );
  }
}

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
 * POST /api/admin/users/create — Provision a new user account from the Admin Console.
 * Checks duplicate emails, hashes password, sets account to unverified (isVerified: false), and writes audit event.
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 },
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Warning: Email address "${cleanEmail}" is already registered on Medicio.` },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(String(password));

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash,
        role: role as UserRole,
        isVerified: false, // Unverified by default for admin-created accounts
        isActive: true,
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
      action: "ADMIN_USER_PROVISIONED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "USER",
      entityId: newUser.id,
      ip: getClientIp(request),
      metadata: {
        createdEmail: newUser.email,
        createdRole: newUser.role,
        isVerified: false,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Admin user creation error: ", error);
    return NextResponse.json(
      { error: "Failed to create user account." },
      { status: 500 },
    );
  }
}

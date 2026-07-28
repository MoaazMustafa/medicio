import { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

const MAX_PAGE_SIZE = 50;

/**
 * GET /api/admin/users — paginated account listing with search and role
 * filter. Restricted to SUPER_ADMIN and ADMIN (RBAC matrix: User
 * Administration), enforced server-side per FR-IAM-05.
 */
export async function GET(request: NextRequest) {
  const { session, response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const roleParam = searchParams.get("role") ?? "";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
    );

    const roleFilter = (Object.values(UserRole) as string[]).includes(roleParam)
      ? (roleParam as UserRole)
      : undefined;

    const where = {
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      requestedBy: session.userId,
    });
  } catch (error: any) {
    console.error("Admin users list error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while listing users." },
      { status: 500 },
    );
  }
}

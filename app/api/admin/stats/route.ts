import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/**
 * GET /api/admin/stats — Real platform telemetry & analytical stats from PostgreSQL.
 */
export async function GET() {
  const { session, response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    const [
      totalUsers,
      verifiedDoctors,
      scrapedRecords,
      auditLogsCount,
      roleGroups,
      recentAuditLogs,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.doctor.count({ where: { isVerified: true } }),
      prisma.scrapedRecord.count(),
      prisma.auditLog.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
        orderBy: { role: "asc" },
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          actorRole: true,
          entityType: true,
          createdAt: true,
          metadata: true,
        },
      }),
    ]);

    // Monthly Registration Trend over past 6 months
    const now = new Date();
    const monthlyRegistrations: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const monthName = d.toLocaleString("default", { month: "short" });
      monthlyRegistrations.push({ month: monthName, count });
    }

    // Map role distribution into dictionary
    const roleCounts: Record<string, number> = {};
    for (const group of roleGroups) {
      const countVal = typeof group._count === "number" ? group._count : 1;
      roleCounts[group.role] = countVal;
    }

    return NextResponse.json({
      totalUsers,
      verifiedDoctors,
      scrapedRecords,
      auditLogsCount,
      roleCounts,
      monthlyRegistrations,
      recentAuditLogs,
      requestedBy: session.userId,
    });
  } catch (error: any) {
    console.error("Admin stats error: ", error);
    return NextResponse.json(
      { error: "Failed to fetch platform analytics stats." },
      { status: 500 },
    );
  }
}

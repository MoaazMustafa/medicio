import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/**
 * GET /api/admin/stats — 100% Real platform telemetry & analytical stats calculated from PostgreSQL.
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

    // Calculate real monthly breakdown over past 6 months for sparkline graphs
    const now = new Date();
    const monthlyRegistrations: { month: string; count: number }[] = [];
    const monthlyDoctors: number[] = [];
    const monthlyAuditLogs: number[] = [];
    const monthlyScraped: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const [uCount, docCount, auditCount, scrapeCount] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
        }),
        prisma.doctor.count({
          where: { isVerified: true, createdAt: { gte: startOfMonth, lte: endOfMonth } },
        }),
        prisma.auditLog.count({
          where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
        }),
        prisma.scrapedRecord.count({
          where: { lastScraped: { gte: startOfMonth, lte: endOfMonth } },
        }),
      ]);

      const monthName = d.toLocaleString("default", { month: "short" });
      monthlyRegistrations.push({ month: monthName, count: uCount });
      monthlyDoctors.push(docCount);
      monthlyAuditLogs.push(auditCount);
      monthlyScraped.push(scrapeCount);
    }

    // Helper for calculating percentage change between last month and current month
    const calcGrowth = (arr: number[]) => {
      if (arr.length < 2) return "+0%";
      const prev = arr[arr.length - 2] || 1;
      const curr = arr[arr.length - 1];
      const diff = curr - prev;
      const pct = Math.round((diff / prev) * 100);
      return pct >= 0 ? `+${pct}%` : `${pct}%`;
    };

    const userGrowth = calcGrowth(monthlyRegistrations.map((m) => m.count));
    const doctorGrowth = calcGrowth(monthlyDoctors);
    const auditGrowth = calcGrowth(monthlyAuditLogs);
    const scrapedGrowth = calcGrowth(monthlyScraped);

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
      sparklines: {
        users: monthlyRegistrations.map((m) => m.count),
        doctors: monthlyDoctors,
        auditLogs: monthlyAuditLogs,
        scraped: monthlyScraped,
      },
      growth: {
        users: userGrowth,
        doctors: doctorGrowth,
        auditLogs: auditGrowth,
        scraped: scrapedGrowth,
      },
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

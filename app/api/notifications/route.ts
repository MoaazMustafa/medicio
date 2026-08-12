import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  listNotificationsQuerySchema,
  notificationsBulkActionSchema,
} from "@/lib/validations/notifications";

/**
 * Notification inbox for the signed-in user.
 * GET    — cursor-paginated list + unread count (?filter=all|unread&cursor&limit)
 * PATCH  — bulk actions ({ action: "markAllRead" })
 * DELETE — clears notifications that are already read
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = listNotificationsQuerySchema.safeParse({
      filter: searchParams.get("filter") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { filter, cursor, limit } = parsed.data;

    const where = {
      userId: session.userId,
      ...(filter === "unread" ? { isRead: false } : {}),
    };

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.notification.count({
        where: { userId: session.userId, isRead: false },
      }),
    ]);

    const hasMore = rows.length > limit;
    const notifications = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      notifications,
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id ?? null : null,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = notificationsBulkActionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // action === "markAllRead"
    const result = await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ updated: result.count, unreadCount: 0 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update notifications" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.notification.deleteMany({
      where: { userId: session.userId, isRead: true },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clear notifications" },
      { status: 500 },
    );
  }
}

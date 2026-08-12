import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { unreadNotificationCount } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { updateNotificationSchema } from "@/lib/validations/notifications";

/**
 * Single-notification operations, always scoped to the caller's own rows.
 * PATCH  — toggle read state ({ isRead: boolean })
 * DELETE — dismiss the notification
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await params;
    const parsed = updateNotificationSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { isRead } = parsed.data;

    // updateMany + userId guard: a user can only touch their own rows and
    // existence of other users' notifications is never leaked.
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId: session.userId },
      data: { isRead, readAt: isRead ? new Date() : null },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      unreadCount: await unreadNotificationCount(session.userId),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await params;

    const result = await prisma.notification.deleteMany({
      where: { id: notificationId, userId: session.userId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      unreadCount: await unreadNotificationCount(session.userId),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete notification" },
      { status: 500 },
    );
  }
}

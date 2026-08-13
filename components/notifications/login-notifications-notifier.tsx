"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { NotificationRecord } from "@/components/notifications/use-notifications";

export function LoginNotificationsNotifier() {
  const router = useRouter();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const notifyUnreadOnLogin = async () => {
      try {
        const response = await fetch("/api/notifications?filter=unread&limit=10", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          notifications: NotificationRecord[];
          unreadCount: number;
        };

        if (!data.notifications || data.notifications.length === 0) return;

        // Check already toasted items in this session to prevent duplicate toasts
        const notifiedKey = "medicio_login_toasted_ids";
        const toastedIds = new Set(
          JSON.parse(sessionStorage.getItem(notifiedKey) || "[]")
        );

        const newUnread = data.notifications.filter((n) => !toastedIds.has(n.id));
        if (newUnread.length === 0) return;

        // Toast unread items with slight stagger
        newUnread.forEach((item, index) => {
          setTimeout(() => {
            toastedIds.add(item.id);
            sessionStorage.setItem(notifiedKey, JSON.stringify(Array.from(toastedIds)));

            toast(item.title, {
              description:
                item.body.length > 120 ? `${item.body.slice(0, 117)}…` : item.body,
              action: item.href
                ? {
                    label: "View",
                    onClick: () => router.push(item.href as string),
                  }
                : undefined,
              duration: 6000,
            });
          }, index * 400);
        });
      } catch (error) {
        console.error("Failed to check unread login notifications:", error);
      }
    };

    void notifyUnreadOnLogin();
  }, [router]);

  return null;
}

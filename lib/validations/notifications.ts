import { z } from "zod";

/** Query params for listing the caller's notifications. */
export const listNotificationsQuerySchema = z.object({
  filter: z.enum(["all", "unread"]).default("all"),
  cursor: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** PATCH /api/notifications — bulk actions. */
export const notificationsBulkActionSchema = z.object({
  action: z.enum(["markAllRead"]),
});

/** PATCH /api/notifications/[notificationId] — read-state toggle. */
export const updateNotificationSchema = z.object({
  isRead: z.boolean(),
});

/** Browser PushSubscription.toJSON() shape (RFC 8291 client keys). */
export const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.url().max(2048),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1).max(512),
      auth: z.string().min(1).max(512),
    }),
  }),
});

/** DELETE /api/notifications/subscriptions body. */
export const removePushSubscriptionSchema = z.object({
  endpoint: z.url().max(2048),
});

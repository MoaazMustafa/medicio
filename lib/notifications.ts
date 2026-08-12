import type { Notification, Prisma } from "@prisma/client";
import type webPushApi from "web-push";

import { prisma } from "@/lib/prisma";

/**
 * In-app + Web Push notification service (single write path).
 *
 * Every user-facing event notification is created through `notify()` /
 * `notifyMany()`: the in-app record is persisted first, then the payload is
 * fanned out to the user's registered Web Push subscriptions. Like
 * `lib/audit`, this module never throws — a notification failure must never
 * break the user-facing action that triggered it.
 *
 * Web Push is optional infrastructure: it activates only when VAPID keys are
 * configured AND the `web-push` package is installed. Otherwise in-app
 * notifications keep working and push dispatch is skipped with a one-time
 * warning.
 */

export const NOTIFICATION_TYPES = [
  "APPOINTMENT",
  "VERIFICATION",
  "AFFILIATION",
  "ACCOUNT",
  "MEDICINE",
  "LAB",
  "SYSTEM",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotifyInput {
  /** Recipient user id (`users.id`). */
  userId: string;
  type: NotificationType;
  /** Short headline shown in the bell panel and the OS notification. */
  title: string;
  /** Full message body (expandable in the panel). */
  body: string;
  /** Optional in-app destination opened from the notification. */
  href?: string;
  metadata?: Record<string, unknown>;
  /** Set false to skip Web Push fanout (in-app only). Defaults to true. */
  push?: boolean;
}

/* ------------------------------------------------------------------ */
/* Web Push plumbing                                                   */
/* ------------------------------------------------------------------ */

type WebPushModule = typeof webPushApi;

let webPushPromise: Promise<WebPushModule | null> | null = null;
let warnedUnavailable = false;

function vapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

function vapidPrivateKey(): string {
  return process.env.VAPID_PRIVATE_KEY ?? "";
}

/** True when VAPID keys are present in the environment. */
export function isPushConfigured(): boolean {
  return Boolean(vapidPublicKey() && vapidPrivateKey());
}

/**
 * Lazily loads and configures the `web-push` package. Resolves null (with a
 * one-time warning) when the package is missing or keys are not configured.
 */
async function getWebPush(): Promise<WebPushModule | null> {
  if (!isPushConfigured()) {
    if (!warnedUnavailable) {
      warnedUnavailable = true;
      console.warn(
        "[NOTIFY] VAPID keys are not configured — Web Push disabled (in-app notifications still work).",
      );
    }
    return null;
  }

  if (!webPushPromise) {
    webPushPromise = import("web-push")
      .then((mod) => {
        // CJS/ESM interop: the callable API may live on the namespace itself
        // or on its `default` export depending on the bundler target.
        const candidate = mod as unknown as WebPushModule & {
          default?: WebPushModule;
        };
        const webPush = candidate.default ?? candidate;
        webPush.setVapidDetails(
          process.env.VAPID_SUBJECT || "mailto:admin@medicio.app",
          vapidPublicKey(),
          vapidPrivateKey(),
        );
        return webPush;
      })
      .catch((error: unknown) => {
        if (!warnedUnavailable) {
          warnedUnavailable = true;
          console.warn(
            "[NOTIFY] `web-push` package unavailable — run `npm install` to enable push delivery.",
            error instanceof Error ? error.message : error,
          );
        }
        return null;
      });
  }

  return webPushPromise;
}

export interface PushPayload {
  title: string;
  body: string;
  href?: string;
  type?: string;
  notificationId?: string;
}

/**
 * Sends a Web Push message to every registered subscription of a user.
 * Expired or revoked subscriptions (HTTP 404/410) are pruned automatically.
 * Returns the number of successful deliveries. Never throws.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<number> {
  try {
    const webPush = await getWebPush();
    if (!webPush) return 0;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (subscriptions.length === 0) return 0;

    const body = JSON.stringify(payload);
    let delivered = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            body,
            { TTL: 60 * 60 * 24, urgency: "normal" },
          );
          delivered += 1;
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number }).statusCode;

          // Subscription is gone or was revoked by the browser — prune it.
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription
              .delete({ where: { id: subscription.id } })
              .catch(() => undefined);
          } else {
            console.error(
              `[NOTIFY] Push delivery failed (status ${statusCode ?? "unknown"}) for user ${userId}.`,
            );
          }
        }
      }),
    );

    return delivered;
  } catch (error) {
    console.error("[NOTIFY] Push fanout error:", error);
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/* Notification creation                                               */
/* ------------------------------------------------------------------ */

/**
 * Persists an in-app notification and fans it out over Web Push.
 * Never throws; returns the created record or null on failure.
 */
export async function notify(input: NotifyInput): Promise<Notification | null> {
  let notification: Notification | null = null;

  try {
    notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[NOTIFY] Failed to persist notification:", error);
    return null;
  }

  if (input.push !== false) {
    await sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      href: input.href,
      type: input.type,
      notificationId: notification.id,
    });
  }

  return notification;
}

/**
 * Creates the same class of notification for several recipients (e.g. every
 * admin). Recipients are de-duplicated; failures are isolated per recipient.
 */
export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  const seen = new Set<string>();
  const unique = inputs.filter((input) => {
    const key = `${input.userId}:${input.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await Promise.all(unique.map((input) => notify(input)));
}

/** Unread notification count for a user (used by API + app shell). */
export async function unreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  } catch {
    return 0;
  }
}

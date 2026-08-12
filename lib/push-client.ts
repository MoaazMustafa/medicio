/**
 * Browser-side Web Push helpers: service-worker registration, permission
 * flow, and subscription lifecycle. All functions are safe to call in any
 * environment — they no-op with a clear result when push is unsupported.
 * Server counterpart: `lib/notifications.ts`.
 */

export type PushSetupResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unsupported" | "not-configured" | "denied" | "error";
    };

/** Feature-detects everything Web Push needs. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Current browser permission for notifications. */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  return Notification.permission;
}

/**
 * Registers the Medicio service worker (idempotent — the browser reuses an
 * existing registration for the same scope).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
}

/** The active push subscription of this browser, if any. */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/** Decodes a base64url VAPID key into the byte array PushManager expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Full opt-in flow: permission prompt → push subscription → persist the
 * subscription server-side so `lib/notifications.ts` can target this browser.
 */
export async function subscribeToPush(): Promise<PushSetupResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, reason: "not-configured" };

  try {
    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission !== "granted") return { ok: false, reason: "denied" };

    const registration =
      (await navigator.serviceWorker.getRegistration()) ??
      (await registerServiceWorker());
    if (!registration) return { ok: false, reason: "error" };

    await navigator.serviceWorker.ready;

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const response = await fetch("/api/notifications/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!response.ok) {
      // Keep browser + server state consistent when persistence fails.
      await subscription.unsubscribe().catch(() => undefined);
      return { ok: false, reason: "error" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Push subscription failed:", error);
    return { ok: false, reason: "error" };
  }
}

/**
 * Opt-out flow: remove the server-side registration, then release the
 * browser subscription.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getExistingPushSubscription();
    if (!subscription) return true;

    await fetch("/api/notifications/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);

    return await subscription.unsubscribe();
  } catch (error) {
    console.error("Push unsubscribe failed:", error);
    return false;
  }
}

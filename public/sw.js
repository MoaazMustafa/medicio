/*
 * Medicio service worker — Web Push delivery + notification click routing.
 * Registered from the app shell (components/notifications/notification-bell.tsx).
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Medicio", body: event.data.text() };
  }

  const title = payload.title || "Medicio";
  const options = {
    body: payload.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.notificationId || undefined,
    data: {
      href: payload.href || "/",
      notificationId: payload.notificationId || null,
    },
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);

      // Nudge any open Medicio tabs so the bell updates instantly.
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        client.postMessage({ type: "medicio:notification", payload });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const href =
    (event.notification.data && event.notification.data.href) || "/";

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Reuse an open Medicio tab when possible.
      for (const client of windowClients) {
        if ("focus" in client) {
          try {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(href);
            }
            return;
          } catch {
            // Fall through to opening a new window.
          }
        }
      }

      await self.clients.openWindow(href);
    })(),
  );
});

// PagePulse service worker (native PWA — no Serwist/build-time plugin).
// Minimal by design: makes the app installable and ready for web push.
// Offline precaching can be added later if needed.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough fetch handler (presence helps installability). No custom caching.
self.addEventListener("fetch", () => {
  // Let the network handle requests normally.
});

// Web Push — wired up to real subscriptions in a later phase.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "PagePulse", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "PagePulse", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});

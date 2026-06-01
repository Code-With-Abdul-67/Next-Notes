// ─── NEXT NOTES SERVICE WORKER ───────────────────────────────────────────────
// Bump this version string on every deployment so the browser detects a new SW.
// The page will show an "Update available" card and only activate after the user
// clicks "Update" — no silent forced reloads.
const CACHE_VERSION = "next-notes-v5";
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/icons/icon.svg",
  "/manifest.webmanifest",
];

// ── Install ───────────────────────────────────────────────────────────────────
// Pre-cache the app shell. Do NOT call skipWaiting() here — we wait for the
// page to send a SKIP_WAITING message after the user confirms the update.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Intentionally NOT calling self.skipWaiting() here.
  // The new SW sits in "waiting" state until the user clicks "Update".
});

// ── Activate ──────────────────────────────────────────────────────────────────
// Clean up old caches from previous versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Message handler ───────────────────────────────────────────────────────────
// The UpdatePrompt component sends SKIP_WAITING when the user clicks "Update".
// This activates the new SW immediately, then the page reloads to pick it up.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls, Next.js internals, auth routes, or extensions
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/auth/") ||
    url.protocol === "chrome-extension:"
  ) {
    return;
  }

  // Navigation (HTML pages): network-first, fall back to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webp")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

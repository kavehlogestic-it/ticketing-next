/**
 * Ticketing PWA Service Worker
 * Version: 1.0.0
 */

const CACHE_NAME = "ticketing-pwa-v1";
const STATIC_CACHE_NAME = "ticketing-static-v1";

const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon.svg",
  "/fonts/Vazirmatn-Regular.ttf",
  "/fonts/Vazirmatn-Medium.ttf",
  "/fonts/Vazirmatn-Bold.ttf",
];

// Offline fallback HTML template in Persian
const OFFLINE_FALLBACK_HTML = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عدم دسترسی به اینترنت | سامانه تیکتینگ</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      text-align: center;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 1.25rem;
      padding: 2.5rem 2rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
    }
    .icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.5rem;
      border-radius: 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #f8fafc;
    }
    p {
      font-size: 0.9rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 1.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #10b981;
      color: #0f172a;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      text-decoration: none;
      border: none;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }
    .btn:hover { background: #059669; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: #f87171;
      background: rgba(239, 68, 68, 0.1);
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-badge">
      <span>●</span> ارتباط اینترنت قطع است
    </div>
    <div class="icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    </div>
    <h1>عدم اتصال به شبکه</h1>
    <p>اتصال شما به سرور سامانه تیکتینگ قطع شده است. لطفاً اتصال شبکه خود را بررسی کرده و مجدداً تلاش فرمایید.</p>
    <button class="btn" onclick="window.location.reload()">
      تلاش مجدد
    </button>
  </div>
</body>
</html>
`;

// Install Event: Pre-cache essential static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[SW] Pre-cache notice:", err)),
  );
});

// Activate Event: Clean up outdated cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME && name !== STATIC_CACHE_NAME) {
              return caches.delete(name);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch Event: Multi-tiered intelligent caching
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache non-GET requests (POST, PUT, DELETE)
  if (request.method !== "GET") {
    return;
  }

  // 2. Never cache real-time endpoints or backend APIs
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/ticketHub") ||
    url.pathname.startsWith("/ticket/hub") ||
    url.pathname.includes("/notifications/stream") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  // 3. Static Assets: Cache-First (Fonts, Icons, Next.js static bundles)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.png" ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-While-Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // 4. HTML Page Navigation: Network-First with Cache / Offline Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          // Return offline fallback HTML
          return new Response(OFFLINE_FALLBACK_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }),
    );
  }
});

// Message Event: Handle updates and skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

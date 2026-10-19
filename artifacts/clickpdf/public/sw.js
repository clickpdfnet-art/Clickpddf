// ClickPDF Enterprise Service Worker with Intelligent Resource Caching
// Enables instantaneous repeat visits via Stale-While-Revalidate for static assets,
// while strictly maintaining Network-First for real-time live navigation and ad banners.

const CACHE_VERSION = 'clickpdf-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SCOPE = self.registration.scope;

// Core assets to pre-cache on install
const PRECACHE_URLS = [
  APP_SCOPE,
  `${APP_SCOPE}manifest.json`,
  `${APP_SCOPE}icon.svg`,
  `${APP_SCOPE}favicon.ico`,
  `${APP_SCOPE}apple-touch-icon.png`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Non-fatal precache issue:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (!name.startsWith(CACHE_VERSION)) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Handle messages from client (e.g. purge cache requested by Admin)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PURGE_CACHE') {
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Never cache ads, analytics, or telemetry scripts
  if (
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('doubleclick') ||
    url.hostname.includes('googlesyndication') ||
    url.hostname.includes('adservice')
  ) {
    return;
  }

  // 1. Static Assets (Fonts, Styles, Scripts, Images, Icons) -> Cache-First with Background Update
  const isStaticAsset =
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.match(/\.(woff2|woff|ttf|css|js|svg|png|jpg|jpeg|webp|ico)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Fetch updated version in background to keep cache fresh (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // If not in cache, fetch and store
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Return fallback if offline
          return cachedResponse || new Response('Offline resource unavailable', { status: 503 });
        });
      })
    );
    return;
  }

  // 2. HTML Navigation & Other Requests -> Network-First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful HTML pages for offline resilience
        if (networkResponse && networkResponse.status === 200 && request.mode === 'navigate') {
          const clone = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        // If network is offline, check cache
        const cached = await caches.match(request);
        if (cached) return cached;

        // Offline Fallback Page if navigation fails
        if (request.mode === 'navigate') {
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>ClickPDF — Offline Mode</title>
              <style>
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  background-color: #0f172a;
                  color: #f8fafc;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                  box-sizing: border-box;
                  text-align: center;
                }
                .card {
                  background: #1e293b;
                  border: 1px solid #334155;
                  border-radius: 24px;
                  padding: 32px 24px;
                  max-width: 440px;
                  width: 100%;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                }
                h1 { margin-top: 0; font-size: 20px; }
                p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
                button {
                  background: #4f46e5;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 12px;
                  font-weight: bold;
                  cursor: pointer;
                  margin-top: 16px;
                }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>ClickPDF In-Browser Mode</h1>
                <p>You appear to be offline. Reconnect to the internet or reload once connection is restored.</p>
                <button onclick="window.location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }

        return new Response('Network error occurred while fetching resource', { status: 408 });
      })
  );
});

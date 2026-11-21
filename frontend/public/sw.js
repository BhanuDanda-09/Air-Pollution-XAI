// AirIQ India - Hardened Production Service Worker (v2.0.0)
const CACHE_NAME = 'airiq-india-v2';
const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/og-image.png'
];

// URLs that must NEVER be cached by the service worker
const BYPASS_CACHE_PATTERNS = [
  /\/api\//,
  /onrender\.com/,
  /open-meteo\.com/,
  /openstreetmap\.org/
];

function shouldBypassCache(url) {
  return BYPASS_CACHE_PATTERNS.some((pattern) => pattern.test(url.href));
}

// 1. Install Phase: precache minimal app shell without blocking
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Pre-caching asset failed, continuing:', err);
      });
    })
  );
  // Do NOT skipWaiting automatically; let client prompt user for seamless update
});

// 2. Activate Phase: purge all legacy caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting legacy cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// 3. Message Listener: skipWaiting when user clicks 'Update Now'
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received; activating new service worker...');
    self.skipWaiting();
  }
});

// 4. Fetch Handler: strictly protect against stale API responses and stale HTML
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // A. Dynamic API calls & external services: Strictly Network-Only (NEVER cache stale)
  if (shouldBypassCache(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // B. HTML Navigations (SPA routes): Network-First with offline cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fall back to precached index.html for offline SPA navigation
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // C. Static versioned hashed assets (/assets/*): Cache-first with network fallback
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // D. Other same-origin static files: Stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});

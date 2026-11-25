// AirIQ India - Hardened Production Service Worker (v2.2.0)
const BUILD_VERSION = 'v2.2.0-20261125';
const CACHE_NAME = `airiq-static-${BUILD_VERSION}`;

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

// 1. Install Phase: precache minimal app shell and immediately activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Pre-caching asset failed, continuing:', err);
      });
    })
  );
});

// 2. Activate Phase: purge all legacy caches and immediately claim clients
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
    }).then(() => self.clients.claim())
  );
});

// 3. Message Listener: support explicit skipWaiting message from client prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received; activating new service worker...');
    self.skipWaiting();
  }
});

// 4. Fetch Handler: strictly ignore cross-origin and non-GET requests
self.addEventListener('fetch', (event) => {
  // A. Ignore non-GET requests entirely
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // B. STRICT RULE: Ignore EVERY cross-origin request (OpenStreetMap tiles, APIs, CDNs).
  // Return without calling event.respondWith so the browser handles them natively.
  // Never intercept or proxy cross-origin requests through the Service Worker fetch.
  if (url.origin !== self.location.origin) {
    return;
  }

  // C. STRICT RULE: Never cache or intercept same-origin API calls (/api/*)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // D. HTML Navigations (SPA routes): Network-First with offline cache fallback
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
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // E. Static versioned hashed assets (/assets/*): Cache-first with network fallback
  if (url.pathname.startsWith('/assets/')) {
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

  // F. Other same-origin static files: Stale-while-revalidate
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
});

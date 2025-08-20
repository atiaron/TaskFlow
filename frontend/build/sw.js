/* TaskFlow SW — Minimal App Shell Cache */
const CACHE = 'tf-sw-v1';
const APP_SHELL = ['/', '/index.html'];
const STATIC_ASSETS = [
  // Add additional static assets here e.g. '/manifest.json', '/favicon.ico'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([...APP_SHELL, ...STATIC_ASSETS]);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// Stale-While-Revalidate for static; App Shell for navigations
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('/index.html');
      const fresh = fetch('/index.html').then(r => { cache.put('/index.html', r.clone()); return r; });
      return cached || fresh;
    })());
    return;
  }

  if (/\.(css|woff2?|otf|ttf)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const net = fetch(req).then(r => { cache.put(req, r.clone()); return r; });
      return cached || net;
    })());
  }
});

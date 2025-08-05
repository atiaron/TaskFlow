// Service Worker disabled for development
console.log('Service Worker: Disabled for development');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Don't intercept any requests during development
self.addEventListener('fetch', (event) => {
  // Let all requests pass through normally
  return;
});
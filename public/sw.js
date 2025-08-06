const CACHE_NAME = 'taskflow-v1.0.0';
const OFFLINE_URL = '/offline.html';

// קבצים שנרצה לקשח מיידית
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// התקנת Service Worker
self.addEventListener('install', event => {
  console.log('🔧 TaskFlow Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching core files');
        return cache.addAll(STATIC_CACHE_URLS).catch(err => {
          console.log('❌ Cache error:', err);
          // Continue even if some files fail to cache
        });
      })
      .then(() => {
        console.log('✅ TaskFlow Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// הפעלת Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 TaskFlow Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ TaskFlow Service Worker activated');
      return self.clients.claim();
    })
  );
});

// יירוט בקשות רשת
self.addEventListener('fetch', event => {
  // טיפול מיוחד לניווט דפים
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then(cache => {
              return cache.match(OFFLINE_URL) || cache.match('/');
            });
        })
    );
    return;
  }

  // אסטרטגיית Cache First למשאבים סטטיים
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' ||
      event.request.destination === 'image') {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(response => {
              // שמירת העותק בcache
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            });
        })
    );
    return;
  }

  // אסטרטגיית Network First לAPI calls
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('firestore') ||
      event.request.url.includes('claude')) {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // שמירת תגובות מוצלחות בcache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // ברירת מחדל - רשת רגילה
  event.respondWith(fetch(event.request));
});

// הודעות push
self.addEventListener('push', event => {
  console.log('🔔 Push message received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'יש לך עדכון חדש ב-TaskFlow!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'open',
        title: 'פתח את TaskFlow',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'סגור'
      }
    ],
    requireInteraction: true,
    tag: 'taskflow-notification'
  };

  event.waitUntil(
    self.registration.showNotification('TaskFlow', options)
  );
});

// טיפול בלחיצה על הודעה
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// סנכרון ברקע
self.addEventListener('sync', event => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

// פונקציה לסנכרון הודעות offline
async function syncOfflineMessages() {
  try {
    console.log('📨 Syncing offline messages...');
    
    // כאן נטפל בהודעות שנשמרו offline
    const offlineMessages = await getOfflineMessages();
    
    for (const message of offlineMessages) {
      try {
        await sendMessageToServer(message);
        await removeOfflineMessage(message.id);
      } catch (error) {
        console.error('❌ Failed to sync message:', error);
      }
    }
    
    console.log('✅ Offline messages synced successfully');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// פונקציות עזר
async function getOfflineMessages() {
  return new Promise((resolve) => {
    // זה יעבוד עם IndexedDB או localStorage
    const messages = JSON.parse(localStorage.getItem('taskflow-offline-messages') || '[]');
    resolve(messages);
  });
}

async function sendMessageToServer(message) {
  return fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message)
  });
}

async function removeOfflineMessage(messageId) {
  const messages = JSON.parse(localStorage.getItem('taskflow-offline-messages') || '[]');
  const filteredMessages = messages.filter(m => m.id !== messageId);
  localStorage.setItem('taskflow-offline-messages', JSON.stringify(filteredMessages));
}
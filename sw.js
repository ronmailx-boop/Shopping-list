// ─── עדכון גרסה v2.0.0 — מאלץ ניקוי cache ישן ב-activate ───
// חובה לשנות מספר זה בכל פריסה שמשנה קבצי JS/HTML
const CACHE_NAME = 'vplus-pro-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/notification-handler.js',
  // קבצי JS המפוצלים (החליפו את script.js הישן)
  '/constants.js',
  '/store.js',
  '/services.js',
  '/importers.js',
  '/ui.js',
  '/app.js',
  // ספריות חיצוניות
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy: Network First, then Cache
self.addEventListener('fetch', event => {
  // Only handle GET requests — the Cache API does NOT support PUT with non-GET methods.
  // Firebase Functions calls are POST requests and must NOT be intercepted/cached.
  if (event.request.method !== 'GET') {
    return; // Let the browser handle non-GET requests normally
  }

  // Also skip caching Firebase / gstatic API calls to avoid CORS / auth issues
  const url = event.request.url;
  if (
    url.includes('firebaseio.com') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('cloudfunctions.net') ||
    url.includes('firebase.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com')
  ) {
    return; // Let Firebase calls go through without caching
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return a custom offline page if nothing in cache
            return caches.match('/index.html');
          });
      })
  );
});

// Background Sync for offline changes
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // This would sync any offline changes when connection is restored
    console.log('Syncing offline data...');
    // Implementation would depend on your backend
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

// Push Notifications — FCM payload handler
self.addEventListener('push', event => {
  let title = 'Vplus Pro';
  let body  = 'התראה חדשה';
  let data  = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      // FCM שולח notification.title / notification.body
      title = payload.notification?.title || payload.data?.title || title;
      body  = payload.notification?.body  || payload.data?.body  || body;
      data  = payload.data || {};
    } catch (e) {
      // fallback אם הנתון לא JSON
      body = event.data.text();
    }
  }

  const options = {
    body,
    icon:    '/icon-96.png',
    badge:   '/icon-96.png',
    vibrate: [300, 100, 300, 100, 300],
    data,
    requireInteraction: true,
    actions: [
      { action: 'snooze-10', title: '⏰ דחה 10 דק׳' },
      { action: 'snooze-60', title: '⏰ דחה שעה'    },
      { action: 'close',     title: '✕ סגור'         }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'snooze-10' || event.action === 'snooze-60') {
    // שלח הודעה לאפליקציה לטיפול ב-snooze
    const snoozeMs = event.action === 'snooze-10' ? 10 * 60 * 1000 : 60 * 60 * 1000;
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'SNOOZE_REMINDER',
            data: event.notification.data,
            snoozeMs
          });
        });
        if (clientList.length === 0) {
          return clients.openWindow('/');
        }
      })
    );
  } else {
    // פתח את האפליקציה
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        const focused = clientList.find(c => c.focused);
        if (focused) return focused.focus();
        if (clientList.length > 0) return clientList[0].focus();
        return clients.openWindow('/');
      })
    );
  }
});




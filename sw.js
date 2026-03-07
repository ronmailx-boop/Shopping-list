const CACHE_NAME = 'vplus-pro-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
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

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let title = 'Vplus Pro';
  let body  = 'התראה חדשה';
  let icon  = '/icon-96.png';
  let badge = '/badge-72.png';
  let link  = 'https://vplus-pro.web.app';
  let extraData = {};

  if (event.data) {
    try {
      // FCM שולח JSON — מפרסרים אותו
      const payload = event.data.json();

      // FCM v1: notification object
      if (payload.notification) {
        title = payload.notification.title || title;
        body  = payload.notification.body  || body;
        icon  = payload.notification.icon  || icon;
      }
      // FCM legacy / data-only
      if (payload.data) {
        if (payload.data.title) title = payload.data.title;
        if (payload.data.body)  body  = payload.data.body;
        extraData = payload.data;
      }
      // webpush fcmOptions
      if (payload.fcmOptions && payload.fcmOptions.link) {
        link = payload.fcmOptions.link;
      }
    } catch (e) {
      // fallback — plain text
      body = event.data.text();
    }
  }

  const options = {
    body,
    icon,
    badge,
    vibrate:           [300, 100, 300, 100, 300],
    requireInteraction: true,
    renotify:           true,
    data: { link, ...extraData },
    actions: [
      { action: 'snooze-10', title: '⏰ דחה 10 דק׳' },
      { action: 'snooze-60', title: '⏰ דחה שעה'    },
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const link = event.notification.data?.link || 'https://vplus-pro.web.app';

  if (event.action === 'snooze-10' || event.action === 'snooze-60') {
    // snooze — just close, the server handles rescheduling
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('vplus-pro.web.app') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(link);
    })
  );
});




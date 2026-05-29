// Version v2.0.1 - removed external CDN URLs from precache (CORS fix)
const CACHE_NAME = 'vplus-pro-v2.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/notification-handler.js',
  '/constants.js',
  '/store.js',
  '/services.js',
  '/importers.js',
  '/ui.js',
  '/app.js'
  // External CDNs removed - they caused CORS errors during SW install
  // They will be cached automatically by the fetch handler below
];

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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;
  if (
    url.includes('firebaseio.com') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('cloudfunctions.net') ||
    url.includes('firebase.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) return response;
            return caches.match('/index.html');
          });
      })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    console.log('Syncing offline data...');
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

self.addEventListener('push', event => {
  let title = 'Vplus Pro';
  let body  = 'New notification';
  let data  = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.notification?.title || payload.data?.title || title;
      body  = payload.notification?.body  || payload.data?.body  || body;
      data  = payload.data || {};
    } catch (e) {
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
      { action: 'snooze-10', title: 'Snooze 10 min' },
      { action: 'snooze-60', title: 'Snooze 1 hour' },
      { action: 'close',     title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'snooze-10' || event.action === 'snooze-60') {
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

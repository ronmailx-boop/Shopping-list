// Version v2.0.2 - added message listener for local notifications + app badge support
const CACHE_NAME = 'vplus-pro-v2.0.2';
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

// ── Message listener: local notifications + app badge sync ──────────
self.addEventListener('message', event => {
  const msg = event.data;
  if (!msg) return;

  // עדכון badge של אייקון האפליקציה (נקרא מה-main thread דרך _syncAppBadge)
  if (msg.type === 'SET_BADGE') {
    const count = msg.badgeCount || 0;
    if ('setAppBadge' in self.registration) {
      count > 0
        ? self.registration.setAppBadge(count).catch(() => {})
        : self.registration.clearAppBadge().catch(() => {});
    }
    return;
  }

  // הצגת התראה מקומית (נקרא מ-_firePushNotification כש-timer מתפוצץ)
  if (msg.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data, badgeCount } = msg;
    const options = {
      body: body || '',
      icon:    '/icon-96.png',
      badge:   '/icon-96.png',
      vibrate: [300, 100, 300, 100, 300],
      tag:     tag || 'vplus-reminder',
      data:    data || {},
      requireInteraction: true,
      actions: [
        { action: 'snooze-10', title: 'דחה 10 דק׳' },
        { action: 'snooze-60', title: 'דחה שעה' },
        { action: 'close',     title: 'סגור' }
      ]
    };

    const showAndBadge = self.registration.showNotification(title || 'Vplus Pro', options)
      .then(() => {
        // עדכן badge אחרי שההתראה הוצגה
        if ('setAppBadge' in self.registration && badgeCount !== undefined) {
          return badgeCount > 0
            ? self.registration.setAppBadge(badgeCount).catch(() => {})
            : self.registration.clearAppBadge().catch(() => {});
        }
      });

    event.waitUntil(showAndBadge);
    return;
  }
});

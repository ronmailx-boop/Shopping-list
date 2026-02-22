// ========== Firebase Cloud Messaging Support ==========
// onBackgroundMessage הוסר — ה-push event מטפל בהכל למניעת כפילות


// ========== Cache & Install ==========
const CACHE_NAME = 'vplus-pro-v1.0.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache opened');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('[SW] Cache addAll failed:', err);
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            return response || caches.match('/index.html');
          });
      })
  );
});


// ========== Badge Support ==========
let badgeCount = 0;

async function updateBadge(count) {
  badgeCount = count || 0;
  try {
    if ('setAppBadge' in navigator) {
      if (badgeCount > 0) {
        await navigator.setAppBadge(badgeCount);
      } else {
        await navigator.clearAppBadge();
      }
    } else if ('setClientBadge' in self.registration) {
      if (badgeCount > 0) {
        await self.registration.setClientBadge(badgeCount);
      } else {
        await self.registration.clearClientBadge();
      }
    }
    console.log('[SW] Badge updated:', badgeCount);
  } catch (error) {
    console.log('[SW] Badge API not supported:', error);
  }
}


// ========== Push Notification Handler ==========
// מטפל בכל הודעות ה-push (כולל FCM) — מנגנון יחיד למניעת כפילות
self.addEventListener('push', event => {
  console.log('[SW] Push event received');

  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    return;
  }

  // FCM שולח את ה-notification בתוך payload.notification
  // וה-data בתוך payload.data
  const title = payload.notification?.title || payload.title || '🔔 התראה - VPlus';
  const body = payload.notification?.body || payload.body || 'יש לך פריט הדורש תשומת לב';
  const data = payload.data || {};
  const tag = data.type === 'reminder' ? 'vplus-reminder' : 'vplus-notification';

  badgeCount++;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        icon: '/icon-96.png',
        badge: '/icon-96.png',
        vibrate: [300, 100, 300, 100, 300],
        tag,
        requireInteraction: true,
        renotify: true,
        data
      }),
      updateBadge(badgeCount)
    ])
  );
});


// ========== Notification Click Handler ==========
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');

  event.notification.close();
  badgeCount = Math.max(0, badgeCount - 1);
  updateBadge(badgeCount);

  const notifData = event.notification.data || {};
  // Encode notification data to pass via URL for new windows
  const dataParam = encodeURIComponent(JSON.stringify(notifData));
  const targetUrl = '/?vplus_notif=' + dataParam;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {

        function sendShowAlert(client) {
          client.postMessage({
            type: 'SHOW_URGENT_ALERT',
            data: notifData
          });
        }

        // Try to find and focus an existing window
        for (let client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus().then(focusedClient => {
              // Small delay to let app settle after focus
              setTimeout(() => sendShowAlert(focusedClient || client), 400);
              return focusedClient || client;
            });
          }
        }

        // No existing window — open new one with notification data in URL
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
          // The new window reads ?vplus_notif from URL on load — no race condition
        }
      })
  );
});


// ========== Notification Close Handler ==========
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed');
  badgeCount = Math.max(0, badgeCount - 1);
  updateBadge(badgeCount);
});


// ========== Message Handler (from main app) ==========
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);

  if (event.data?.type === 'CLEAR_BADGE') {
    badgeCount = 0;
    updateBadge(0);
  }

  if (event.data?.type === 'SET_BADGE') {
    badgeCount = event.data.count || 0;
    updateBadge(badgeCount);
  }

  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = event.data;
    badgeCount++;

    self.registration.showNotification(title || '🔔 התראה - VPlus', {
      body: body || 'יש לך התראה חדשה',
      icon: '/icon-96.png',
      badge: '/icon-96.png',
      vibrate: [300, 100, 300, 100, 300],
      tag: tag || 'vplus-notification',
      requireInteraction: true,
      renotify: true,
      data: data || {}
    }).then(() => updateBadge(badgeCount));
  }
});
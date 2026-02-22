// ========== Firebase Cloud Messaging Support ==========
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBqIqxoiwwqeKkjlYJpEiqgCG09PgabwhI",
  authDomain: "vplus-pro.firebaseapp.com",
  projectId: "vplus-pro",
  storageBucket: "vplus-pro.firebasestorage.app",
  messagingSenderId: "386740827706",
  appId: "1:386740827706:web:a3c95c895826df4bb26703"
});

const messaging = firebase.messaging();

// טיפול בהודעות FCM ברקע (האפליקציה סגורה)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] FCM background message received:', payload);

  const title = payload.notification?.title || '🔔 התראה - VPlus';
  const options = {
    body: payload.notification?.body || 'יש לך התראה חדשה מ-VPlus',
    icon: '/icon-96.png',
    badge: '/icon-96.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: payload.data?.type === 'reminder' ? 'vplus-reminder' : 'vplus-notification',
    requireInteraction: true,
    renotify: true,
    data: payload.data || {}
  };

  badgeCount++;
  return Promise.all([
    self.registration.showNotification(title, options),
    updateBadge(badgeCount)
  ]);
});


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
// מטפל בהודעות push ישירות (כגיבוי למקרה ש-FCM לא תופס)
self.addEventListener('push', event => {
  console.log('[SW] Push event received:', event);

  let notificationData = {
    title: '🔔 התראה - VPlus',
    body: 'יש לך פריט הדורש תשומת לב',
    icon: '/icon-96.png',
    badge: '/icon-96.png',
    tag: 'vplus-reminder',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  badgeCount++;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        vibrate: [300, 100, 300, 100, 300],
        tag: notificationData.tag,
        requireInteraction: true,
        renotify: true,
        data: notificationData.data
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

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (let client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
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

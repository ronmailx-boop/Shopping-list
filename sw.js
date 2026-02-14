const CACHE_NAME = 'vplus-pro-v1.0.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json'
];

// Install Service Worker
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

// Activate Service Worker
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

// Fetch Strategy
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

// ========== NOTIFICATION BADGE SUPPORT ==========
let badgeCount = 0;

// Update badge count
async function updateBadge(count) {
  badgeCount = count || 0;
  
  try {
    // Try to set app badge (Chrome/Edge on Android)
    if ('setAppBadge' in navigator) {
      if (badgeCount > 0) {
        await navigator.setAppBadge(badgeCount);
      } else {
        await navigator.clearAppBadge();
      }
      console.log('[SW] Badge updated:', badgeCount);
    }
    // Fallback for older API
    else if ('setClientBadge' in self.registration) {
      if (badgeCount > 0) {
        await self.registration.setClientBadge(badgeCount);
      } else {
        await self.registration.clearClientBadge();
      }
      console.log('[SW] Badge updated (fallback):', badgeCount);
    }
  } catch (error) {
    console.log('[SW] Badge API not supported:', error);
  }
}

// ========== PUSH NOTIFICATION HANDLER ==========
self.addEventListener('push', event => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: '🔔 התראה - VPlus',
    body: 'יש לך פריט חשוב הדורשים תשומת לב',
    icon: '/icon-96.png',
    badge: '/icon-96.png',
    tag: 'vplus-reminder',
    data: {}
  };
  
  // Parse notification data
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
  
  // Increment badge
  badgeCount++;
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [300, 100, 300, 100, 300],
    tag: notificationData.tag,
    requireInteraction: true,
    renotify: true,
    silent: false,
    data: notificationData.data,
    actions: [
      {
        action: 'open',
        title: 'פתח',
        icon: '/icon-96.png'
      },
      {
        action: 'dismiss',
        title: 'סגור',
        icon: '/icon-96.png'
      }
    ]
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, options),
      updateBadge(badgeCount)
    ])
  );
});

// ========== NOTIFICATION CLICK HANDLER ==========
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  // Decrement badge
  badgeCount = Math.max(0, badgeCount - 1);
  updateBadge(badgeCount);
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Focus existing window
          for (let client of clientList) {
            if (client.url.includes(self.registration.scope) && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// ========== NOTIFICATION CLOSE HANDLER ==========
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed');
  badgeCount = Math.max(0, badgeCount - 1);
  updateBadge(badgeCount);
});

// ========== MESSAGE HANDLER (from main app) ==========
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    badgeCount = 0;
    updateBadge(0);
  }
  
  if (event.data && event.data.type === 'SET_BADGE') {
    badgeCount = event.data.count || 0;
    updateBadge(badgeCount);
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
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
      data: data || {},
      actions: [
        { action: 'open', title: 'פתח', icon: '/icon-96.png' },
        { action: 'dismiss', title: 'סגור', icon: '/icon-96.png' }
      ]
    }).then(() => {
      updateBadge(badgeCount);
    });
  }
});

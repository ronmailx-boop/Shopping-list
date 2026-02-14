const CACHE_NAME = 'vplus-pro-v1.0.1';
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
  event.respondWith(
    fetch(event.request)
      .then(response => {
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

// Enhanced Push Notifications Handler
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'התראה מ-VPlus',
    body: 'יש לך פריט חשוב הדורש תשומת לב',
    icon: '/icon-192.png',
    badge: '/badge-72.png'
  };
  
  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200, 100, 200],
    tag: 'vplus-reminder',
    requireInteraction: true,
    renotify: true,
    data: notificationData.data,
    actions: [
      {
        action: 'open',
        title: 'פתח אפליקציה',
        icon: '/check.png'
      },
      {
        action: 'snooze',
        title: 'הזכר מאוחר יותר',
        icon: '/snooze.png'
      },
      {
        action: 'dismiss',
        title: 'סגור',
        icon: '/cross.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Enhanced Notification Click Handler
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if there's already a window open
          for (let client of clientList) {
            if (client.url.includes(self.registration.scope) && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  } else if (event.action === 'snooze') {
    // Schedule a reminder for later (1 hour)
    event.waitUntil(
      self.registration.showNotification('התזכורת נדחתה', {
        body: 'נזכיר לך בעוד שעה',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'vplus-snooze-confirm',
        vibrate: [100, 50, 100]
      })
    );
    
    // In a real implementation, you would schedule another notification
    // This would require storing the notification data and setting up a timer
  } else if (event.action === 'dismiss') {
    // Just close the notification (already done above)
    console.log('Notification dismissed');
  }
});

// Periodic Background Sync (for checking due items)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-due-items') {
    event.waitUntil(checkDueItems());
  }
});

async function checkDueItems() {
  try {
    // This would check for items with upcoming due dates
    // and show notifications as needed
    console.log('Checking for due items...');
    
    // In a real implementation, you would:
    // 1. Fetch the user's data from IndexedDB or cache
    // 2. Check for items with due dates/times
    // 3. Show notifications for items that are due soon
    
  } catch (error) {
    console.error('Error checking due items:', error);
  }
}

// Message handler (for communication with the main app)
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    // Schedule a notification
    const { itemName, dueDate, dueTime } = event.data;
    scheduleNotification(itemName, dueDate, dueTime);
  }
});

function scheduleNotification(itemName, dueDate, dueTime) {
  // In a real implementation, this would use the Notifications API
  // to schedule a notification for the specified time
  console.log(`Scheduling notification for ${itemName} at ${dueDate} ${dueTime}`);
  
  // For now, we'll just log it
  // A full implementation would require storing this data
  // and checking it periodically
}

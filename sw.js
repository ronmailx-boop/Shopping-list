// שם המחסן - עדכון הגרסה ל-1.0.0 לסנכרון מלא
const CACHE_NAME = 'vplus-pro-v1.0.0';

// רשימת הקבצים לשמירה (כולל ספריות חיצוניות שאתה משתמש בהן)
const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// התקנה ראשונית של ה-Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Vplus: קבצי האפליקציה נשמרו ב-Cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// ניקוי גרסאות ישנות מהזיכרון
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Vplus: מוחק גרסת Cache ישנה', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// אסטרטגיית טעינה: ניסיון להביא מהרשת, ואם נכשל (Offline) - מהזיכרון
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(response => {
          return response || caches.match('./index.html');
        });
      })
  );
});
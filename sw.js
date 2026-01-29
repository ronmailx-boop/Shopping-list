// שם המחסן (Cache) - עדכון הגרסה כאן יגרום לדפדפן לרענן את כל הקבצים
const CACHE_NAME = 'vplus-pro-v1.0.0';

// רשימת הקבצים לשמירה לגישה לא מקוונת
const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// שלב ההתקנה - שמירת הקבצים ב-Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Vplus Cache: Opening and storing files');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// שלב ההפעלה - מחיקת גרסאות Cache ישנות
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Vplus Cache: Deleting old version', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ניהול בקשות רשת - ניסיון להביא מהרשת, ואם אין קליטה - להביא מה-Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // אם הצלחנו להביא מהרשת, נעדכן את ה-Cache במידת הצורך
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // אם אין רשת, ננסה למצוא ב-Cache
        return caches.match(event.request).then(response => {
          return response || caches.match('./index.html');
        });
      })
  );
});

const CACHE_NAME = 'vplus-pro-v1.0.2';
const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// התקנה: שמירת הקבצים החיוניים במטמון
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Vplus Cache: Storing essential files');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// הפעלה: מחיקת גרסאות ישנות של האפליקציה מהזיכרון
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Vplus Cache: Removing old version', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ניהול בקשות: רשת תחילה, מטמון כגיבוי
self.addEventListener('fetch', event => {
  // דילוג על בקשות של גוגל (כדי לא להפריע לסנכרון ענן)
  if (event.request.url.includes('google')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // אם הצלחנו להביא מהרשת, נעדכן את המטמון
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // אם אין רשת, ננסה להביא מהמטמון
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          // אם גם המטמון ריק (למשל דף חדש), נחזיר את עמוד הבית
          return caches.match('./index.html');
        });
      })
  );
});

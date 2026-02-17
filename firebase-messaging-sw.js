// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyBqIqxoiwwqeKkjlYJpEiqgCG09PgabwhI",
  authDomain: "vplus-pro.firebaseapp.com",
  projectId: "vplus-pro",
  storageBucket: "vplus-pro.firebasestorage.app",
  messagingSenderId: "386740827706",
  appId: "1:386740827706:web:a3c95c895826df4bb26703"
});

const messaging = firebase.messaging();

// ─── טיפול בהתראות רקע (האפליקציה סגורה / ממוזערת) ───────────────────────
// FCM קורא לזה אוטומטית כשמגיעה הודעה מהשרת והאפליקציה לא בחזית
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Background message received:', payload);

  const title = payload.notification?.title || '⏰ תזכורת VPlus';
  const body  = payload.notification?.body  || 'יש לך תזכורת חדשה';

  const options = {
    body,
    icon:               '/icon-192.png',
    badge:              '/badge-72.png',
    vibrate:            [300, 100, 300, 100, 300],
    tag:                'vplus-reminder-' + (payload.data?.itemName || Date.now()),
    requireInteraction: true,   // ההתראה נשארת עד שהמשתמש לוחץ
    renotify:           true,
    silent:             false,
    data: {
      listId:   payload.data?.listId   || '',
      itemName: payload.data?.itemName || '',
      dueDate:  payload.data?.dueDate  || '',
      url:      '/'
    }
  };

  return self.registration.showNotification(title, options);
});

// ─── לחיצה על התראה ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM-SW] Notification clicked:', event.notification.data);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // אם האפליקציה כבר פתוחה — פוקוס עליה ושלח אירוע
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data
            });
            return client.focus();
          }
        }
        // אחרת — פתח חלון חדש
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});


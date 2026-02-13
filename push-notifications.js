// Push Notifications Handler for VPlus
// This file initializes Firebase Cloud Messaging and requests notification permissions

import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// Initialize messaging
const messaging = getMessaging(window.firebaseApp);

// Request notification permission and get FCM token
async function requestNotificationPermission() {
  try {
    console.log('🔔 Requesting notification permission...');
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_HERE' // נצטרך להגדיר בFirebase Console
      });
      
      if (token) {
        console.log('✅ FCM Token:', token);
        // שמור את הטוקן בFirestore או בשרת
        await saveFCMToken(token);
        return token;
      }
    } else if (permission === 'denied') {
      console.error('❌ Notification permission denied');
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
  }
}

// Save FCM token to Firestore
async function saveFCMToken(token) {
  if (!window.firebaseAuth.currentUser) return;
  
  const userId = window.firebaseAuth.currentUser.uid;
  await window.setDoc(window.doc(window.firebaseDb, 'users', userId), {
    fcmToken: token,
    updatedAt: new Date()
  }, { merge: true });
  
  console.log('✅ FCM token saved to Firestore');
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('📨 Foreground message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'התראה חדשה';
  const notificationOptions = {
    body: payload.notification?.body || 'יש לך התראה חדשה',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'vplus-notification',
    requireInteraction: false
  };
  
  // Show notification
  if (Notification.permission === 'granted') {
    new Notification(notificationTitle, notificationOptions);
  }
});

// Auto-request notifications on page load
window.addEventListener('load', () => {
  // Wait for Firebase to initialize
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('🔔 Auto-requesting notification permission...');
      requestNotificationPermission();
    }
  }, 2000);
});

// Export function for manual trigger
window.requestNotificationPermission = requestNotificationPermission;

// Push Notifications Handler for VPlus
// Enhanced version with support for item due date notifications

import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// Initialize messaging
let messaging;
try {
  messaging = getMessaging(window.firebaseApp);
} catch (error) {
  console.log('Firebase messaging not initialized:', error);
}

// Request notification permission and get FCM token
async function requestNotificationPermission() {
  try {
    console.log('🔔 Requesting notification permission...');
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker registered:', registration);
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      }
      
      // Get FCM token if messaging is available
      if (messaging) {
        try {
          const token = await getToken(messaging, {
            vapidKey: 'BEfW0mtDR1km7wNEJk2iODQM5_ipheXBc7Ty_ZdxunMHlT8nLpPDNv8WhuLNJt8J2I5T6g290rBWNJMcVeEHhOe'
          });
          
          if (token) {
            console.log('✅ FCM Token:', token);
            await saveFCMToken(token);
            return token;
          }
        } catch (error) {
          console.log('FCM token not available:', error);
        }
      }
      
      return true;
    } else if (permission === 'denied') {
      console.error('❌ Notification permission denied');
      showPermissionDeniedMessage();
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
  }
  
  return false;
}

// Show message when permission is denied
function showPermissionDeniedMessage() {
  const message = 'לא ניתן להציג התראות. אנא אפשר התראות בהגדרות הדפדפן.';
  if (typeof showNotification === 'function') {
    showNotification(message, 'warning');
  } else {
    console.warn(message);
  }
}

// Save FCM token to Firestore
async function saveFCMToken(token) {
  try {
    if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
      console.log('User not authenticated, storing token locally');
      localStorage.setItem('fcmToken', token);
      return;
    }
    
    const userId = window.firebaseAuth.currentUser.uid;
    await window.setDoc(window.doc(window.firebaseDb, 'users', userId), {
      fcmToken: token,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ FCM token saved to Firestore');
  } catch (error) {
    console.error('Error saving FCM token:', error);
    localStorage.setItem('fcmToken', token);
  }
}

// Handle foreground messages
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log('📨 Foreground message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'התראה חדשה';
    const notificationOptions = {
      body: payload.notification?.body || 'יש לך התראה חדשה',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'vplus-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: payload.data
    };
    
    // Show notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(notificationTitle, notificationOptions);
      
      notification.onclick = function() {
        window.focus();
        this.close();
        
        // Handle notification click based on data
        if (payload.data && payload.data.listId) {
          // Switch to the relevant list
          if (typeof switchToList === 'function') {
            switchToList(payload.data.listId);
          }
        }
      };
    }
    
    // Also show in-app notification
    if (typeof showNotification === 'function') {
      showNotification(notificationTitle + ': ' + notificationOptions.body, 'success');
    }
  });
}

// Schedule local notification for item due date
function scheduleLocalNotification(item, dueDateTime, reminderMs) {
  const notificationTime = dueDateTime - reminderMs;
  const now = Date.now();
  
  if (notificationTime <= now) {
    console.log('Notification time has passed, showing immediately');
    return;
  }
  
  const delay = notificationTime - now;
  
  // Send message to service worker to schedule notification
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      itemName: item.name,
      dueDate: item.dueDate,
      dueTime: item.dueTime,
      price: item.price,
      delay: delay
    });
  }
  
  console.log(`📅 Scheduled local notification for "${item.name}" in ${Math.round(delay / 1000 / 60)} minutes`);
}

// Test notification function
function testNotification() {
  if (Notification.permission === 'granted') {
    const notification = new Notification('🔔 התראת בדיקה', {
      body: 'זוהי התראת בדיקה מ-VPlus',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
      requireInteraction: false
    });
    
    notification.onclick = function() {
      window.focus();
      this.close();
    };
    
    console.log('✅ Test notification sent');
  } else {
    console.warn('⚠️ Notification permission not granted');
    requestNotificationPermission();
  }
}

// Auto-request notifications on page load (delayed)
window.addEventListener('load', () => {
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('🔔 Auto-requesting notification permission...');
      requestNotificationPermission();
    } else if (Notification.permission === 'granted') {
      console.log('✅ Notifications already permitted');
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('✅ Service Worker registered'))
          .catch(err => console.error('❌ Service Worker registration failed:', err));
      }
    }
  }, 3000); // Wait 3 seconds after page load
});

// Export functions for use in main app
window.requestNotificationPermission = requestNotificationPermission;
window.scheduleLocalNotification = scheduleLocalNotification;
window.testNotification = testNotification;

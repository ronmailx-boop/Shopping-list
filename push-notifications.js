// Push Notifications Handler for VPlus
// Enhanced version with proper FCM token management and Firebase Auth integration

import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// Initialize messaging
let messaging;
let currentFCMToken = null;

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
        await getFCMTokenAndSave();
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

// Get FCM token and save it
async function getFCMTokenAndSave() {
  try {
    // חובה להעביר את ה-registration של sw.js כדי ש-FCM ידע להשתמש בו
    // (ולא יחפש את firebase-messaging-sw.js)
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: 'BEfWQmtDR1km7wNEkJk2lODQM5_IpheXBc7Ty_ZdxunMHIT8nLpPDNv8WhuLNJ18J2l5T6g290rBWNJMcVaEHh0',
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      console.log('✅ FCM Token retrieved:', token);
      currentFCMToken = token;
      await saveFCMToken(token);
      return token;
    } else {
      console.log('⚠️ No FCM token available');
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
  }
  return null;
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
      console.log('⚠️ User not authenticated yet, storing token locally for later');
      localStorage.setItem('pendingFCMToken', token);
      return;
    }
    
    const userId = window.firebaseAuth.currentUser.uid;
    console.log('💾 Saving FCM token to Firestore for user:', userId);
    
    await window.setDoc(window.doc(window.firebaseDb, 'users', userId), {
      fcmToken: token,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ FCM token saved to Firestore successfully');
    
    // Clear any pending token
    localStorage.removeItem('pendingFCMToken');
    
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    // Store locally as fallback
    localStorage.setItem('pendingFCMToken', token);
  }
}

// Try to save pending FCM token when user authenticates
async function savePendingToken() {
  const pendingToken = localStorage.getItem('pendingFCMToken');
  
  if (pendingToken && window.firebaseAuth && window.firebaseAuth.currentUser) {
    console.log('💾 Found pending FCM token, saving to Firestore...');
    await saveFCMToken(pendingToken);
  }
}

// Initialize FCM token management when auth state changes
function initFCMTokenManagement() {
  console.log('🔧 Initializing FCM token management...');
  
  // Wait for Firebase Auth to be available
  const checkAuth = setInterval(() => {
    if (window.firebaseAuth && window.onAuthStateChanged) {
      clearInterval(checkAuth);
      
      // Listen for auth state changes
      window.onAuthStateChanged(window.firebaseAuth, async (user) => {
        if (user) {
          console.log('👤 User authenticated:', user.uid);
          
          // Check if we have notification permission
          if (Notification.permission === 'granted') {
            console.log('✅ Notification permission already granted');
            
            // Get and save FCM token
            if (messaging) {
              await getFCMTokenAndSave();
            }
            
            // Also check for any pending token
            await savePendingToken();
          } else if (Notification.permission === 'default') {
            // Could auto-request permission here or wait for user action
            console.log('⚠️ Notification permission not yet requested');
          }
        } else {
          console.log('👤 No user authenticated');
        }
      });
      
      console.log('✅ FCM token management initialized with auth listener');
    }
  }, 100);
  
  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkAuth);
  }, 10000);
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

// Initialize on page load
window.addEventListener('load', () => {
  console.log('📱 Page loaded, initializing push notifications...');
  
  // Initialize FCM token management with auth listener
  initFCMTokenManagement();
  
  // Delayed auto-request for notifications (only if permission is default)
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
      
      // If user is already authenticated, get token now
      if (window.firebaseAuth && window.firebaseAuth.currentUser && messaging) {
        getFCMTokenAndSave();
      }
    }
  }, 3000); // Wait 3 seconds after page load
});

// Export functions for use in main app
window.requestNotificationPermission = requestNotificationPermission;
window.scheduleLocalNotification = scheduleLocalNotification;
window.testNotification = testNotification;
window.savePendingFCMToken = savePendingToken; // For manual trigger if needed

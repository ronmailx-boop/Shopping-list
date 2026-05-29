// ========== Enhanced Notification System with Badge Support ==========

let serviceWorkerRegistration = null;
let notificationPermissionRequested = false;

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered successfully');
            
            // Wait for activation
            await navigator.serviceWorker.ready;
            console.log('✅ Service Worker ready');
            
            return serviceWorkerRegistration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            return null;
        }
    }
    return null;
}

// Request notification permission with user-friendly dialog
async function requestNotificationPermissionWithDialog() {
    if (notificationPermissionRequested) {
        return Notification.permission === 'granted';
    }
    
    if (!('Notification' in window)) {
        alert('הדפדפן שלך לא תומך בהתראות');
        return false;
    }
    
    // Check current permission
    if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
    }
    
    if (Notification.permission === 'denied') {
        alert('הרשאות התראות נדחו. אנא אפשר התראות בהגדרות הדפדפן.');
        return false;
    }
    
    // Show custom dialog before requesting
    const userWantsNotifications = confirm(
        '🔔 VPlus רוצה לשלוח לך התראות\n\n' +
        'התראות יעזרו לך לזכור פריטים חשובים ותאריכי יעד.\n\n' +
        'האם תרצה לקבל התראות?'
    );
    
    if (!userWantsNotifications) {
        console.log('User declined notification permission request');
        notificationPermissionRequested = true;
        return false;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    notificationPermissionRequested = true;
    
    if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        showNotification('✅ התראות מופעלות בהצלחה!', 'success');
        return true;
    } else {
        console.log('❌ Notification permission denied');
        showNotification('⚠️ לא ניתן לשלוח התראות ללא הרשאה', 'warning');
        return false;
    }
}

// Show system notification via Service Worker
async function showSystemNotification(title, body, tag, data) {
    // Make sure we have permission
    if (Notification.permission !== 'granted') {
        const granted = await requestNotificationPermissionWithDialog();
        if (!granted) {
            console.log('Cannot show notification - permission denied');
            return;
        }
    }
    
    // Make sure Service Worker is registered
    if (!serviceWorkerRegistration) {
        serviceWorkerRegistration = await registerServiceWorker();
    }
    
    if (!serviceWorkerRegistration) {
        console.error('Cannot show notification - Service Worker not available');
        return;
    }
    
    // Send message to Service Worker to show notification
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            body: body,
            tag: tag || 'vplus-notification-' + Date.now(),
            data: data || {}
        });
    }
}

// Update badge count on app icon
async function updateAppBadge(count) {
    try {
        if ('setAppBadge' in navigator) {
            if (count > 0) {
                await navigator.setAppBadge(count);
                console.log('✅ Badge set to:', count);
            } else {
                await navigator.clearAppBadge();
                console.log('✅ Badge cleared');
            }
        } else if (navigator.serviceWorker.controller) {
            // Fallback: send message to Service Worker
            navigator.serviceWorker.controller.postMessage({
                type: 'SET_BADGE',
                count: count
            });
        }
    } catch (error) {
        console.log('Badge API not supported:', error);
    }
}

// Clear badge
async function clearAppBadge() {
    await updateAppBadge(0);
    
    // Also send to Service Worker
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_BADGE'
        });
    }
}

// Count pending notifications (items with due dates)
function countPendingNotifications() {
    if (!db || !db.lists || !db.currentId) return 0;
    
    const currentList = db.lists[db.currentId];
    if (!currentList || !currentList.items) return 0;
    
    const now = Date.now();
    let count = 0;
    
    currentList.items.forEach(item => {
        if (item.checked) return; // Skip completed items
        
        if (item.dueDate && item.reminderValue && item.reminderUnit) {
            const dueDateObj = new Date(item.dueDate);
            
            if (item.dueTime) {
                const [hours, minutes] = item.dueTime.split(':');
                dueDateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            } else {
                dueDateObj.setHours(9, 0, 0, 0);
            }
            
            const reminderMs = getReminderMilliseconds(item.reminderValue, item.reminderUnit);
            const notificationTime = dueDateObj.getTime() - reminderMs;
            
            // Count if notification time is in the near future (within 24 hours)
            if (notificationTime > now && notificationTime <= now + (24 * 60 * 60 * 1000)) {
                count++;
            }
        }
    });
    
    return count;
}

// Update badge based on pending notifications
function updateNotificationBadge() {
    const count = countPendingNotifications();
    updateAppBadge(count);
}

// Initialize on page load
window.addEventListener('load', async () => {
    console.log('🚀 Initializing notification system...');
    
    // Register Service Worker
    await registerServiceWorker();
    
    // Wait a bit before asking for permission (better UX)
    setTimeout(async () => {
        // Auto-request permission on first load
        if (Notification.permission === 'default' && !localStorage.getItem('notificationPromptShown')) {
            localStorage.setItem('notificationPromptShown', 'true');
            await requestNotificationPermissionWithDialog();
        }
        
        // Update badge
        updateNotificationBadge();
    }, 3000);
    
    // Clear badge when app becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            clearAppBadge();
        }
    });
});

// Export functions
window.requestNotificationPermissionWithDialog = requestNotificationPermissionWithDialog;
window.showSystemNotification = showSystemNotification;
window.updateAppBadge = updateAppBadge;
window.clearAppBadge = clearAppBadge;
window.updateNotificationBadge = updateNotificationBadge;

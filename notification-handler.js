// ========== Enhanced Notification System with Badge Support ==========

let serviceWorkerRegistration = null;
let notificationPermissionRequested = false;

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered successfully');
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

    if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
    }

    if (Notification.permission === 'denied') {
        alert('הרשאות התראות נדחו. אנא אפשר התראות בהגדרות הדפדפן.');
        return false;
    }

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
    if (Notification.permission !== 'granted') {
        const granted = await requestNotificationPermissionWithDialog();
        if (!granted) {
            console.log('Cannot show notification - permission denied');
            return;
        }
    }

    if (!serviceWorkerRegistration) {
        serviceWorkerRegistration = await registerServiceWorker();
    }

    if (!serviceWorkerRegistration) {
        console.error('Cannot show notification - Service Worker not available');
        return;
    }

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

// ── Badge management ──────────────────────────────────────────────────
// עדכון badge: שולח תמיד גם ל-SW (אמין ב-Samsung/Android)
// וגם מנסה ישירות מה-main thread כ-fallback
async function updateAppBadge(count) {
    try {
        // שיטה עיקרית: דרך SW — אמינה יותר ב-Android / Samsung One UI
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SET_BADGE',
                badgeCount: count
            });
        }
        // Fallback: ישירות מה-main thread
        if ('setAppBadge' in navigator) {
            count > 0
                ? await navigator.setAppBadge(count)
                : await navigator.clearAppBadge();
            console.log('✅ Badge updated to:', count);
        }
    } catch (error) {
        console.log('Badge API not supported:', error);
    }
}

async function clearAppBadge() {
    await updateAppBadge(0);
}

// ── ספירת התראות — מאוחדת עם getNotificationItems של script.js ──────
// משתמשת ב-getNotificationItems() אם קיימת (script.js), אחרת fallback
function countPendingNotifications() {
    // getNotificationItems מוגדרת ב-script.js — מקיפה את כל הרשימות
    // ומכבדת dismissed, reminders ו-dueDate מכל הסוגים
    if (typeof getNotificationItems === 'function') {
        return getNotificationItems().length;
    }

    // fallback אם script.js לא נטען עדיין
    if (!db || !db.lists) return 0;
    const now = Date.now();
    let count = 0;
    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            const hasReminder = !!(item.reminderValue && item.reminderUnit) ||
                                !!(item.nextAlertTime && item.nextAlertTime > 0);
            if (hasReminder) count++;
        });
    });
    return count;
}

// updateNotificationBadge — מעדכן גם badge פנימי (פעמון) וגם badge אייקון
function updateNotificationBadge() {
    const count = countPendingNotifications();
    updateAppBadge(count);

    // עדכן גם את הbadge הפנימי של הפעמון ב-UI (אם לא עשה זאת script.js כבר)
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Initialize on page load
window.addEventListener('load', async () => {
    console.log('🚀 Initializing notification system...');

    await registerServiceWorker();

    setTimeout(async () => {
        if (Notification.permission === 'default' && !localStorage.getItem('notificationPromptShown')) {
            localStorage.setItem('notificationPromptShown', 'true');
            await requestNotificationPermissionWithDialog();
        }
        updateNotificationBadge();
    }, 3000);

    // ✅ תוקן: כשהאפליקציה חוזרת לחזית — רענן את הbadge (לא מוחק אותו!)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateNotificationBadge(); // היה כאן clearAppBadge() — זה היה הבאג!
        }
    });
});

// Export functions
window.requestNotificationPermissionWithDialog = requestNotificationPermissionWithDialog;
window.showSystemNotification = showSystemNotification;
window.updateAppBadge = updateAppBadge;
window.clearAppBadge = clearAppBadge;
window.updateNotificationBadge = updateNotificationBadge;

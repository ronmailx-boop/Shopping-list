// js/features/notifications.js
import { db, save, currentUser } from '../core/store.js';
import { computeNextAlertTime, getReminderMilliseconds } from '../core/utils.js';
// ============================================================
//  services.js  ג€”  ׳׳•׳’׳™׳§׳× ׳¨׳§׳¢: Firebase, ׳‘׳ ׳§, ׳×׳–׳›׳•׳¨׳•׳×
//  ׳׳™׳™׳‘׳ ׳: constants.js, store.js
//  ׳׳™׳•׳‘׳ ׳¢׳-׳™׳“׳™: ui.js, app.js
// ============================================================


// ============================================================
//  ׳¢׳–׳¨ ג€” helper (׳׳•׳§׳׳™)
// ============================================================
function _n(id)  { return document.getElementById(id); }
function _qs(s)  { return document.querySelector(s); }

// ============================================================
//  getReminderMilliseconds / computeNextAlertTime / formatReminderText
// ============================================================
function getReminderMilliseconds(value, unit) {
    if (!value || !unit) return 0;
    const n = parseInt(value);
    if (isNaN(n) || n <= 0) return 0;
    const map = { minutes: n * 60000, hours: n * 3600000, days: n * 86400000, weeks: n * 604800000 };
    return map[unit] || 0;
}

function computeNextAlertTime(item) {
    if (!item.dueDate || !item.reminderValue || !item.reminderUnit) return null;
    const timeStr = item.dueTime || '09:00';
    const [h, m] = timeStr.split(':');
    const due = new Date(item.dueDate);
    due.setHours(parseInt(h), parseInt(m), 0, 0);
    return due.getTime() - getReminderMilliseconds(item.reminderValue, item.reminderUnit);
}

function formatReminderText(value, unit) {
    if (!value || !unit) return '';
    const units = {
        minutes: value === '1' ? '׳“׳§׳”' : '׳“׳§׳•׳×',
        hours:   value === '1' ? '׳©׳¢׳”' : '׳©׳¢׳•׳×',
        days:    value === '1' ? '׳™׳•׳'  : '׳™׳׳™׳',
        weeks:   value === '1' ? '׳©׳‘׳•׳¢' : '׳©׳‘׳•׳¢׳•׳×'
    };
    return `${value} ${units[unit] || unit}`;
}

// ============================================================
//  showDetailedError
// ============================================================
function showDetailedError(context, error) {
    const errorCode    = error.code    || 'UNKNOWN_ERROR';
    const errorMessage = error.message || 'Unknown error occurred';
    console.error(`ג [${context}]`, { code: errorCode, message: errorMessage, fullError: error });

    let errorTitle  = context;
    let userMessage = '';

    if (errorCode.includes('auth/')) {
        if (errorCode === 'auth/unauthorized-domain') {
            errorTitle  = 'ג ן¸ ׳”׳“׳•׳׳™׳™׳ ׳׳ ׳׳•׳¨׳©׳”';
            userMessage = `׳”׳“׳•׳׳™׳™׳ ׳”׳–׳” ׳׳ ׳׳•׳¨׳©׳” ׳׳”׳×׳—׳‘׳¨׳•׳× ׳‘-Firebase.\n\n1. ׳₪׳×׳— Firebase Console\n2. Authentication ג†’ Settings ג†’ Authorized domains\n3. ׳”׳•׳¡׳£: ${window.location.hostname}`;
        } else if (errorCode === 'auth/operation-not-allowed') {
            errorTitle  = 'ג ן¸ Google Sign-In ׳׳ ׳׳•׳₪׳¢׳';
            userMessage = '׳©׳™׳˜׳× ׳”׳”׳×׳—׳‘׳¨׳•׳× ׳©׳ Google ׳׳ ׳׳•׳₪׳¢׳׳×.\n\nAuthentication ג†’ Sign-in method ג†’ Google ג†’ Enable';
        } else if (errorCode === 'auth/popup-blocked') {
            errorTitle  = 'ג ן¸ ׳—׳׳•׳ ׳ ׳—׳¡׳';
            userMessage = '׳”׳“׳₪׳“׳₪׳ ׳—׳¡׳ ׳׳× ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳×.\n\n׳׳₪׳©׳¨ ׳—׳׳•׳ ׳•׳× ׳§׳•׳₪׳¦׳™׳ ׳׳׳×׳¨ ׳–׳”.';
        } else if (errorCode === 'auth/network-request-failed') {
            errorTitle  = 'ג ן¸ ׳‘׳¢׳™׳™׳× ׳¨׳©׳×';
            userMessage = '׳׳ ׳ ׳™׳×׳ ׳׳”׳×׳—׳‘׳¨ ׳׳©׳¨׳×׳™ Firebase.\n\n׳‘׳“׳•׳§ ׳׳× ׳”׳—׳™׳‘׳•׳¨ ׳׳׳™׳ ׳˜׳¨׳ ׳˜.';
        } else {
            userMessage = `׳§׳•׳“ ׳©׳’׳™׳׳”: ${errorCode}\n\n${errorMessage}`;
        }
    } else if (errorCode.includes('permission-denied')) {
        errorTitle  = 'ג ן¸ ׳׳™׳ ׳”׳¨׳©׳׳”';
        userMessage = '׳׳™׳ ׳”׳¨׳©׳׳” ׳׳’׳©׳× ׳׳ ׳×׳•׳ ׳™׳.\n\n׳‘׳“׳•׳§ ׳”׳’׳“׳¨׳•׳× Firebase Security Rules.';
    } else if (errorCode.includes('unavailable')) {
        errorTitle  = 'ג ן¸ ׳©׳™׳¨׳•׳× ׳׳ ׳–׳׳™׳';
        userMessage = '׳”׳©׳™׳¨׳•׳× ׳׳ ׳–׳׳™׳ ׳›׳¨׳’׳¢.\n\n׳ ׳¡׳” ׳©׳•׳‘ ׳׳׳•׳—׳¨ ׳™׳•׳×׳¨.';
    } else {
        userMessage = `׳§׳•׳“: ${errorCode}\n\n${errorMessage}`;
    }

    if (typeof window.showFirebaseError === 'function') {
        window.showFirebaseError(errorTitle, userMessage);
    } else if (typeof window.showNotification === 'function') {
        window.showNotification(`ג ${errorTitle}`, 'error');
    }
}

// ============================================================
//  updateCloudIndicator
// ============================================================
function updateCloudIndicator(status) {
    const indicator = _n('cloudIndicator');
    const text      = _n('cloudSyncText');
    const cloudBtn  = _n('cloudBtn');
    if (!indicator || !cloudBtn) return;

    if (status === 'connected') {
        indicator.className = 'w-2 h-2 bg-green-500 rounded-full';
        cloudBtn.className  = 'cloud-btn-connected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = '׳׳—׳•׳‘׳¨ ג…';
    } else if (status === 'syncing') {
        indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
        cloudBtn.className  = 'cloud-btn-syncing px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = '׳׳¡׳ ׳›׳¨׳...';
    } else {
        indicator.className = 'w-2 h-2 bg-red-400 rounded-full';
        cloudBtn.className  = 'cloud-btn-disconnected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = '׳׳ ׳•׳×׳§';
    }
}

// ============================================================
//  normalizeItem
// ============================================================
function normalizeItem(item) {
    return {
        name:            item.name            || '',
        price:           item.price           || 0,
        qty:             item.qty             || 1,
        checked:         item.checked         || false,
        category:        item.category        || '׳׳—׳¨',
        note:            item.note            || '',
        dueDate:         item.dueDate         || '',
        dueTime:         item.dueTime         || '',
        paymentUrl:      item.paymentUrl      || '',
        isPaid:          item.isPaid          || false,
        lastUpdated:     item.lastUpdated     || Date.now(),
        cloudId:         item.cloudId         || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
        reminderValue:   item.reminderValue   || '',
        reminderUnit:    item.reminderUnit    || '',
        nextAlertTime:   item.nextAlertTime   || null,
        alertDismissedAt: item.alertDismissedAt || null,
        isGeneralNote:   item.isGeneralNote   || false
    };
}

// ============================================================
//  mergeCloudWithLocal
// ============================================================
function mergeCloudWithLocal(cloudData, localData) {
    console.log('נ”„ ׳׳‘׳¦׳¢ ׳׳™׳–׳•׳’ ׳—׳›׳ ׳‘׳™׳ ׳¢׳ ׳ ׳׳׳§׳•׳׳™...');
    const merged = JSON.parse(JSON.stringify(cloudData));

    // Normalize cloud items
    Object.keys(merged.lists || {}).forEach(listId => {
        if (merged.lists[listId].items) {
            merged.lists[listId].items = merged.lists[listId].items.map(normalizeItem);
        }
    });

    // Merge local ג†’ cloud (add new local items / lists)
    Object.keys(cloudData.lists || {}).forEach(listId => {
        const cloudList = cloudData.lists[listId];
        const localList = localData.lists?.[listId];
        if (!localList) return;

        const cloudItemsMap = {};
        (cloudList.items || []).forEach(item => {
            if (item.cloudId) cloudItemsMap[item.cloudId] = item;
        });

        (localList.items || []).forEach(localItem => {
            if (!localItem.cloudId) {
                localItem.cloudId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                merged.lists[listId].items.push(normalizeItem(localItem));
                console.log('ג• ׳׳•׳¡׳™׳£ ׳₪׳¨׳™׳˜ ׳—׳“׳© ׳׳§׳•׳׳™ ׳׳׳ cloudId:', localItem.name);
            } else if (!cloudItemsMap[localItem.cloudId]) {
                merged.lists[listId].items.push(normalizeItem(localItem));
                console.log('ג• ׳׳•׳¡׳™׳£ ׳₪׳¨׳™׳˜ ׳—׳“׳© ׳׳׳•׳₪׳׳™׳™׳:', localItem.name);
            }
        });
    });

    // Add entirely new local lists
    Object.keys(localData.lists || {}).forEach(listId => {
        if (!merged.lists[listId]) {
            console.log('נ“ ׳׳•׳¡׳™׳£ ׳¨׳©׳™׳׳” ׳—׳“׳©׳” ׳׳§׳•׳׳™׳×:', listId);
            merged.lists[listId] = localData.lists[listId];
            if (merged.lists[listId].items) {
                merged.lists[listId].items = merged.lists[listId].items.map(normalizeItem);
            }
        }
    });

    return merged;
}

// ============================================================
//  syncToCloud
// ============================================================
async function syncToCloud() {
    if (!currentUser) { console.warn('ג ן¸ ׳׳™׳ ׳׳©׳×׳׳© ׳׳—׳•׳‘׳¨'); return; }
    console.log('ג˜ן¸ ׳׳¡׳ ׳›׳¨׳ ׳׳¢׳ ׳... UID:', currentUser.uid);
    updateCloudIndicator('syncing');
    try {
        const userDocRef = window.doc(window.firebaseDb, 'shopping_lists', currentUser.uid);
        await window.setDoc(userDocRef, db);
        console.log('ג… ׳¡׳ ׳›׳¨׳•׳ ׳׳¢׳ ׳ ׳”׳•׳©׳׳');
    } catch (error) {
        console.error('ג ׳©׳’׳™׳׳” ׳‘׳›׳×׳™׳‘׳” ׳׳¢׳ ׳:', error);
        showDetailedError('Cloud Sync', error);
    } finally {
        updateCloudIndicator('connected');
    }
}

// ============================================================
//  setupFirestoreListener
// ============================================================
function setupFirestoreListener(user) {
    console.log('נ“¡ ׳׳’׳“׳™׳¨ Firestore listener ׳¢׳‘׳•׳¨ UID:', user.uid);
    const userDocRef = window.doc(window.firebaseDb, 'shopping_lists', user.uid);

    const unsub = window.onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const cloudData = docSnap.data();
            const cloudIsEmpty = !cloudData.lists || Object.keys(cloudData.lists).length === 0;
            const localHasData = db.lists && Object.keys(db.lists).length > 0;

            if (cloudIsEmpty && localHasData) {
                syncToCloud();
                return;
            }

            if (JSON.stringify(cloudData) !== JSON.stringify(db)) {
                console.log('נ”„ ׳׳‘׳¦׳¢ ׳¡׳ ׳›׳¨׳•׳ ׳—׳›׳ ׳׳”׳¢׳ ׳...');
                let mergedDb = mergeCloudWithLocal(cloudData, db);
                if (!mergedDb.lists || Object.keys(mergedDb.lists).length === 0) {
                    mergedDb.lists     = { 'L1': { name: '׳”׳¨׳©׳™׳׳” ׳©׳׳™', url: '', budget: 0, isTemplate: false, items: [] } };
                    mergedDb.currentId = 'L1';
                }
                setDb(mergedDb);
                localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(mergedDb));
                if (typeof window.render === 'function') window.render();
                if (typeof window.showNotification === 'function') window.showNotification('ג˜ן¸ ׳¡׳•׳ ׳›׳¨׳ ׳׳”׳¢׳ ׳!', 'success');
            }
        } else {
            console.log('נ“ ׳׳¡׳׳ ׳׳ ׳§׳™׳™׳ ׳‘׳¢׳ ׳, ׳™׳•׳¦׳¨ ׳—׳“׳©...');
            syncToCloud();
        }
    }, (error) => {
        console.error('ג ׳©׳’׳™׳׳× Firestore sync:', error);
        showDetailedError('Firestore Sync', error);
        if (currentUser) updateCloudIndicator('connected');
    });

    setUnsubscribeSnapshot(unsub);
}

// ============================================================
//  initFirebaseAuth
// ============================================================
function initFirebaseAuth() {
    console.log('נ”„ ׳׳׳×׳—׳ Firebase Auth...');

    window.onAuthStateChanged(window.firebaseAuth, (user) => {
        setCurrentUser(user);
        setIsConnected(!!user);
        console.log('נ‘₪ ׳׳¦׳‘ ׳׳©׳×׳׳©:', user ? `׳׳—׳•׳‘׳¨: ${user.email}` : '׳׳ ׳•׳×׳§');

        updateCloudIndicator(user ? 'connected' : 'disconnected');

        const emailDisplay = _n('userEmailDisplay');
        const logoutBtn    = _n('logoutBtn');
        if (emailDisplay) {
            emailDisplay.textContent = user ? `׳׳—׳•׳‘׳¨ ׳›: ${user.email}` : '׳׳ ׳׳—׳•׳‘׳¨';
            emailDisplay.style.color = user ? '#059669' : '#6b7280';
        }
        if (logoutBtn) {
            logoutBtn.classList.toggle('hidden', !user);
        }

        if (user) {
            setupFirestoreListener(user);
        } else {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                setUnsubscribeSnapshot(null);
            }
        }
    });

    // Cloud button
    const cloudBtn = _n('cloudBtn');
    if (cloudBtn) {
        cloudBtn.onclick = function () {
            if (window.wizardMode) {
                if (typeof window.wiz === 'function') window.wiz('cloudBtn', 'before', () => {
                    currentUser ? (typeof window.openModal === 'function' && window.openModal('settingsModal')) : loginWithGoogle();
                });
            } else {
                currentUser ? (typeof window.openModal === 'function' && window.openModal('settingsModal')) : loginWithGoogle();
            }
        };
    }
}

// ============================================================
//  loginWithGoogle / logoutFromCloud
// ============================================================
function loginWithGoogle() {
    if (!window.firebaseAuth) {
        if (typeof window.showNotification === 'function') window.showNotification('ג³ ׳©׳™׳¨׳•׳× ׳”׳¢׳ ׳ ׳¢׳“׳™׳™׳ ׳ ׳˜׳¢׳...', 'warning');
        return;
    }
    if (!window.googleProvider) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ Google provider ׳׳ ׳–׳׳™׳', 'warning');
        return;
    }
    if (window.firebaseAuth.currentUser) {
        if (typeof window.showNotification === 'function') window.showNotification('ג… ׳׳×׳” ׳›׳‘׳¨ ׳׳—׳•׳‘׳¨', 'success');
        if (typeof window.openModal === 'function') window.openModal('settingsModal');
        return;
    }

    updateCloudIndicator('syncing');
    const isGitHubPages = window.location.hostname.includes('github.io');

    if (isGitHubPages) {
        if (typeof window.showNotification === 'function') window.showNotification('ג³ ׳׳¢׳‘׳™׳¨ ׳׳“׳£ ׳”׳”׳×׳—׳‘׳¨׳•׳× ׳©׳ Google...', 'success');
        window.signInWithRedirect(window.firebaseAuth, window.googleProvider)
            .catch(err => { showDetailedError('Login', err); updateCloudIndicator('disconnected'); });
    } else {
        window.signInWithPopup(window.firebaseAuth, window.googleProvider)
            .then(result => {
                if (typeof window.showNotification === 'function') window.showNotification('ג… ׳”׳×׳—׳‘׳¨׳× ׳‘׳”׳¦׳׳—׳”!', 'success');
                setCurrentUser(result.user);
                setIsConnected(true);
                updateCloudIndicator('connected');
                setupFirestoreListener(result.user);
            })
            .catch(err => {
                const c = err.code;
                if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') {
                    if (typeof window.showNotification === 'function') window.showNotification('ג„¹ן¸ ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳× ׳ ׳¡׳’׳¨', 'warning');
                } else if (c === 'auth/popup-blocked') {
                    if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ׳”׳“׳₪׳“׳₪׳ ׳—׳¡׳ ׳׳× ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳×', 'warning');
                } else {
                    showDetailedError('Login', err);
                }
                updateCloudIndicator('disconnected');
            });
    }
}

function logoutFromCloud() {
    if (!window.firebaseAuth) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ׳©׳™׳¨׳•׳× ׳”׳¢׳ ׳ ׳׳ ׳–׳׳™׳', 'warning');
        return;
    }
    updateCloudIndicator('syncing');
    window.signOut(window.firebaseAuth)
        .then(() => {
            setCurrentUser(null);
            setIsConnected(false);
            if (typeof window.showNotification === 'function') window.showNotification('נ‘‹ ׳”׳×׳ ׳×׳§׳× ׳׳”׳¢׳ ׳', 'success');
            updateCloudIndicator('disconnected');
            if (typeof window.closeModal === 'function') window.closeModal('settingsModal');
        })
        .catch(err => {
            showDetailedError('Logout', err);
            updateCloudIndicator('connected');
        });
}

// ============================================================
//  Firebase init trigger (wait for window.firebaseAuth)
// ============================================================
function startFirebaseWatcher() {
    const checkFirebase = setInterval(() => {
        if (window.firebaseAuth) {
            clearInterval(checkFirebase);
            console.log('ג… Firebase ׳–׳׳™׳, ׳׳׳×׳—׳...');
            initFirebaseAuth();
        }
    }, 100);

    setTimeout(() => {
        if (!window.firebaseAuth) {
            console.warn('ג ן¸ Firebase ׳׳ ׳ ׳˜׳¢׳ ׳׳—׳¨׳™ 10 ׳©׳ ׳™׳•׳×');
            if (typeof window.showNotification === 'function')
                window.showNotification('ג ן¸ ׳©׳™׳¨׳•׳× ׳”׳¢׳ ׳ ׳׳ ׳–׳׳™׳ - ׳˜׳¢׳ ׳׳—׳“׳© ׳׳× ׳”׳“׳£', 'warning');
        }
    }, 10000);
}

// ============================================================
//  ׳×׳–׳›׳•׳¨׳•׳× ג€” Reminders
// ============================================================
const _reminderTimers = new Map();
let _forceShowAfterNotificationClick = false;

function initItemAlertTime(item) {
    const natural = computeNextAlertTime(item);
    if (!natural) { item.nextAlertTime = null; return; }
    const now = Date.now();
    if (!item.nextAlertTime || item.nextAlertTime <= now) {
        item.nextAlertTime   = natural;
        item.alertDismissedAt = null;
    }
}

function snoozeUrgentAlert(ms) {
    const now        = Date.now();
    const snoozeUntil = now + ms;
    let count = 0;

    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate || !item.nextAlertTime) return;
            if (item.nextAlertTime > now && !item.alertDismissedAt) return;
            item.nextAlertTime    = snoozeUntil;
            item.alertDismissedAt = null;
            count++;
        });
    });

    if (count === 0) {
        Object.values(db.lists).forEach(list => {
            (list.items || []).forEach(item => {
                if (item.checked || item.isPaid || !item.dueDate || !item.reminderValue) return;
                item.nextAlertTime    = snoozeUntil;
                item.alertDismissedAt = null;
            });
        });
    }

    save();
    if (typeof window.closeModal === 'function') window.closeModal('urgentAlertModal');
    _scheduleAllReminders();

    const label = ms < 3600000 ? Math.round(ms / 60000) + ' ׳“׳§׳•׳×'
        : ms < 86400000 ? Math.round(ms / 3600000) + ' ׳©׳¢׳•׳×'
        : Math.round(ms / 86400000) + ' ׳™׳׳™׳';
    if (typeof window.showNotification === 'function') window.showNotification('ג° ׳×׳•׳–׳›׳¨ ׳‘׳¢׳•׳“ ' + label, 'info');
}

function closeUrgentAlert() {
    const now = Date.now();
    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            const t = item.nextAlertTime;
            if (!t || t > now) return;
            if (item.alertDismissedAt && item.alertDismissedAt >= t) return;
            item.alertDismissedAt = t;
        });
    });
    save();
    if (typeof window.closeModal === 'function') window.closeModal('urgentAlertModal');
}

function checkUrgentPayments() {
    if (!db?.lists) return;
    const now      = Date.now();
    const forceShow = _forceShowAfterNotificationClick;
    _forceShowAfterNotificationClick = false;

    const alertItems = [];
    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            const t = item.nextAlertTime;
            if (!t || t > now) return;
            if (!forceShow && item.alertDismissedAt && item.alertDismissedAt >= t) return;
            alertItems.push(item);
        });
    });

    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    if (alertItems.length > 0 && typeof window.showUrgentAlertModal === 'function') {
        window.showUrgentAlertModal(alertItems);
    }
}

function updateAppBadge(count) {
    if ('setAppBadge' in navigator) {
        count > 0 ? navigator.setAppBadge(count).catch(() => {}) : navigator.clearAppBadge().catch(() => {});
    }
}

function _scheduleAllReminders() {
    _reminderTimers.forEach(id => clearTimeout(id));
    _reminderTimers.clear();
    if (!db?.lists) return;
    const now = Date.now();

    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate || !item.reminderValue) return;
            if (!item.nextAlertTime) {
                initItemAlertTime(item);
                if (!item.nextAlertTime) return;
            }
            const t   = item.nextAlertTime;
            const key = item.cloudId || item.name;
            if (item.alertDismissedAt && item.alertDismissedAt >= t && t <= now) return;
            const delay = t - now;
            if (delay > 0) {
                const timerId = setTimeout(() => {
                    _firePushNotification(item);
                    checkUrgentPayments();
                }, Math.min(delay, 2147483647));
                _reminderTimers.set(key, timerId);
            } else {
                checkUrgentPayments();
            }
        });
    });
}

function _firePushNotification(item) {
    const title   = `ג° ׳×׳–׳›׳•׳¨׳×: ${item.name}`;
    const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString('he-IL') : '';
    const timeStr = item.dueTime ? ' ׳‘׳©׳¢׳” ' + item.dueTime : '';
    const body    = dateStr ? `׳™׳¢׳“: ${dateStr}${timeStr}` : '׳™׳© ׳׳ ׳×׳–׳›׳•׳¨׳×';
    const data    = { type: 'reminder', itemName: item.name, dueDate: item.dueDate || '', dueTime: item.dueTime || '' };
    if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION', title, body,
            tag: 'reminder-' + (item.cloudId || item.name), data
        });
    }
}

async function initNotificationSystem() {
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    _scheduleAllReminders();
    checkUrgentPayments();
    setInterval(checkUrgentPayments, 30000);
}

// ג”€ג”€ Custom Snooze ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function openCustomSnooze() {
    if (typeof window.closeModal === 'function') window.closeModal('urgentAlertModal');
    if (typeof window.openModal  === 'function') window.openModal('customSnoozeModal');
}

function applyCustomSnooze() {
    const value = parseFloat(_n('customSnoozeValue')?.value);
    const unit  = _n('customSnoozeUnit')?.value;
    if (!value || value <= 0) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ׳ ׳ ׳׳”׳–׳™׳ ׳׳¡׳₪׳¨ ׳—׳™׳•׳‘׳™', 'warning');
        return;
    }
    const ms = unit === 'minutes' ? value * 60000 : unit === 'hours' ? value * 3600000 : value * 86400000;
    snoozeUrgentAlert(ms);
    if (typeof window.closeModal === 'function') window.closeModal('customSnoozeModal');
    if (_n('customSnoozeValue')) _n('customSnoozeValue').value = '1';
    if (_n('customSnoozeUnit'))  _n('customSnoozeUnit').value  = 'hours';
}

// ג”€ג”€ SW Message Listener ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function initServiceWorkerListener() {
    if (!('serviceWorker' in navigator)) return;
    let _suppressStartupModal = false;

    navigator.serviceWorker.addEventListener('message', function (event) {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'NOTIFICATION_ACTION' || msg.type === 'SHOW_URGENT_ALERT') {
            const action = msg.action || 'show';
            if (action === 'snooze-10') { snoozeUrgentAlert(10 * 60 * 1000); return; }
            if (action === 'snooze-60') { snoozeUrgentAlert(60 * 60 * 1000); return; }
            _suppressStartupModal = true;
            if (typeof window.closeModal === 'function') window.closeModal('urgentAlertModal');
            _forceShowAfterNotificationClick = true;
            checkUrgentPayments();
        }

        if (msg.type === 'ALERT_DATA_RESPONSE') {
            if (msg.data?.action) {
                const action = msg.data.action;
                if (action === 'snooze-10') { snoozeUrgentAlert(10 * 60 * 1000); return; }
                if (action === 'snooze-60') { snoozeUrgentAlert(60 * 60 * 1000); return; }
                _suppressStartupModal = true;
                if (typeof window.closeModal === 'function') window.closeModal('urgentAlertModal');
                _forceShowAfterNotificationClick = true;
                checkUrgentPayments();
                navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_BADGE' });
            }
        }
    });
}

function checkNotificationUrlParam() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('vplus-action');
    if (action) {
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => {
            if (action === 'snooze-10') { snoozeUrgentAlert(10 * 60 * 1000); return; }
            if (action === 'snooze-60') { snoozeUrgentAlert(60 * 60 * 1000); return; }
            if (typeof window.closeModal === 'function') window.closeModal('urgentAlertModal');
            _forceShowAfterNotificationClick = true;
            checkUrgentPayments();
        }, 1500);
    } else if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'GET_ALERT_DATA' });
    }
}

// ============================================================
//  GitHub Token
// ============================================================
function loadGithubToken() {
    const token = localStorage.getItem('vplus_github_pat') || '';
    window.GITHUB_PAT = token;
    const input = _n('githubTokenInput');
    if (input && token) input.value = token;
    updateGithubTokenStatus();
}

function saveGithubToken() {
    const input = _n('githubTokenInput');
    if (!input) return;
    const token = input.value.trim();
    if (!token) {
        localStorage.removeItem('vplus_github_pat');
        window.GITHUB_PAT = '';
        if (typeof window.showNotification === 'function') window.showNotification('נ—‘ן¸ Token ׳ ׳׳—׳§');
    } else if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        if (typeof window.showNotification === 'function')
            window.showNotification('ג ן¸ Token ׳׳ ׳×׳§׳™׳ ג€” ׳—׳™׳™׳‘ ׳׳”׳×׳—׳™׳ ׳‘-ghp_ ׳׳• github_pat_', 'warning');
        return;
    } else {
        localStorage.setItem('vplus_github_pat', token);
        window.GITHUB_PAT = token;
        if (typeof window.showNotification === 'function') window.showNotification('ג… GitHub Token ׳ ׳©׳׳¨!');
    }
    updateGithubTokenStatus();
}

function updateGithubTokenStatus() {
    const input  = _n('githubTokenInput');
    const status = _n('githubTokenStatus');
    if (!status) return;
    const val = (input?.value || '') || localStorage.getItem('vplus_github_pat') || '';
    if (val.startsWith('ghp_') || val.startsWith('github_pat_')) {
        status.textContent = 'ג… ׳׳•׳’׳“׳¨';    status.style.color = '#22c55e';
    } else if (val.length > 0) {
        status.textContent = 'ג ן¸ ׳׳ ׳×׳§׳™׳'; status.style.color = '#f59e0b';
    } else {
        status.textContent = 'ג ׳׳ ׳׳•׳’׳“׳¨'; status.style.color = '#ef4444';
    }
}

// ============================================================
//  Financial progress UI
// ============================================================
function showFinProgress() {
    const el = _n('finProgressOverlay');
    if (el) el.style.display = 'flex';
}
function hideFinProgress() {
    const el = _n('finProgressOverlay');
    if (el) el.style.display = 'none';
}
function setFinStage(step, icon, title, sub, pct) {
    _n('finProgressIcon').textContent  = icon;
    _n('finProgressTitle').textContent = title;
    _n('finProgressSub').textContent   = sub;
    _n('finProgressBar').style.width   = pct;
    for (let i = 1; i <= 3; i++) {
        const dot   = _n('finDot'   + i);
        const stage = _n('finStage' + i);
        if (!dot) continue;
        dot.style.background = i < step ? '#7367f0' : i === step ? '#0ea5e9' : '#f3f4f6';
        dot.style.color      = i <= step ? 'white' : '#9ca3af';
        dot.textContent      = i < step ? 'ג“' : String(i);
    }
}

// ============================================================
//  Bank / Credit state
// ============================================================
let selectedCreditCompany = null;
let selectedBank          = null;

function setSelectedCreditCompany(v) { selectedCreditCompany = v; }
function setSelectedBank(v)          { selectedBank = v; }

function selectCreditCompany(id, btn) {
    selectedCreditCompany = id;
    document.querySelectorAll('.credit-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
}

function selectBank(bankId, btn) {
    selectedBank = bankId;
    document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');

    const cfg = BANK_CONFIG[bankId];
    if (!cfg) return;
    const field1Label = _n('bankField1Label');
    const field2Row   = _n('bankField2Row');
    const field2Label = _n('bankField2Label');
    const field2Input = _n('bankField2');
    const hintEl      = _n('bankConnectHint');
    if (field1Label) field1Label.textContent = cfg.field1Label;
    if (field2Row)   field2Row.style.display = cfg.field2 ? '' : 'none';
    if (field2Label) field2Label.textContent = cfg.field2Label || '';
    if (field2Input) field2Input.placeholder  = cfg.field2Label || '';
    if (hintEl)      hintEl.textContent       = cfg.hint || '';
}

// ============================================================
//  runFinancialFetch
// ============================================================
async function runFinancialFetch({ companyId, credentials, modalId, nameLabel }) {
    const debugLogs = [];
    const log = (msg, type = 'info', icon = 'ג€¢') => {
        debugLogs.push({ msg, type, icon, time: new Date().toLocaleTimeString('he-IL') });
        if (typeof window.showDebugLog === 'function') window.showDebugLog(debugLogs);
    };

    if (typeof window.closeModal === 'function') window.closeModal(modalId);
    showFinProgress();

    try {
        const user = window.firebaseAuth?.currentUser;
        log(`׳—׳‘׳¨׳”: ${companyId}`, 'info', 'נ¦');
        log(`currentUser: ${user ? user.email : 'null'}`, user ? 'success' : 'error', user ? 'נ‘₪' : 'ג');
        if (!user) {
            hideFinProgress();
            if (typeof window.showNotification === 'function') window.showNotification('ג ׳™׳© ׳׳”׳×׳—׳‘׳¨ ׳׳—׳©׳‘׳•׳ ׳×׳—׳™׳׳”', 'error');
            return;
        }

        const userId = user.uid;
        const jobId  = 'job_' + Date.now();

        setFinStage(1, 'נ”', '׳©׳•׳׳— ׳׳¡׳ ׳›׳¨׳•׳...', '׳׳₪׳¢׳™׳ GitHub Actions', '15%');

        const GITHUB_TOKEN = window.GITHUB_PAT || '';
        const REPO         = 'ronmailx-boop/Shopping-list';

        if (!GITHUB_TOKEN) {
            log('ג ן¸ ׳—׳¡׳¨ GITHUB_PAT ג€” ׳¢׳™׳™׳ ׳‘׳”׳’׳“׳¨׳•׳×', 'error', 'ג');
            hideFinProgress();
            if (typeof window.showNotification === 'function') window.showNotification('ג ׳—׳¡׳¨ GitHub Token ג€” ׳”׳’׳“׳¨ GITHUB_PAT', 'error');
            return;
        }

        const payload = {
            event_type: 'bank-sync',
            client_payload: {
                userId, jobId, companyId,
                username: credentials.username  || credentials.userCode || '',
                password: credentials.password  || '',
                userCode: credentials.userCode  || '',
                id:       credentials.id        || '',
                num:      credentials.num       || '',
            }
        };

        log('׳©׳•׳׳— ׳-GitHub Actions...', 'info', 'נ€');
        const ghRes = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept':        'application/vnd.github.v3+json',
                'Content-Type':  'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!ghRes.ok) {
            const errText = await ghRes.text();
            log(`׳©׳’׳™׳׳× GitHub: ${ghRes.status} ג€” ${errText}`, 'error', 'ג');
            hideFinProgress();
            if (typeof window.showNotification === 'function') window.showNotification('ג ׳©׳’׳™׳׳× GitHub Actions', 'error');
            return;
        }

        log('GitHub Actions ׳”׳•׳₪׳¢׳ ג…', 'success', 'נ€');
        setFinStage(2, 'ג³', '׳׳׳×׳™׳ ׳׳×׳•׳¦׳׳•׳×...', '׳–׳” ׳׳•׳§׳— ׳¢׳“ 3 ׳“׳§׳•׳×', '40%');

        const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const jobRef = doc(window.firebaseDb, 'bankSync', userId, 'jobs', jobId);

        const transactions = await new Promise((resolve, reject) => {
            const TIMEOUT = 8 * 60 * 1000;
            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) { settled = true; unsubscribe(); reject(new Error('timeout')); }
            }, TIMEOUT);

            const unsubscribe = onSnapshot(jobRef, (snap) => {
                if (!snap.exists()) return;
                const data = snap.data();
                log(`׳¡׳˜׳˜׳•׳¡: ${data.status}`, 'info', 'נ“');

                if (data.status === 'running') setFinStage(2, 'נ”', '׳׳×׳—׳‘׳¨ ׳׳‘׳ ׳§...', 'GitHub Actions ׳₪׳•׳¢׳', '55%');

                if (data.status === 'done' && !settled) {
                    settled = true; clearTimeout(timer); unsubscribe();
                    const accounts = (data.accounts || []).map(acc => ({
                        accountNumber: acc.accountNumber || '',
                        txns: (acc.txns || [])
                            .map(t => ({ name: t.description || '׳¢׳¡׳§׳”', amount: Math.abs(t.amount || 0), price: Math.abs(t.amount || 0), date: t.date || '' }))
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                    }));
                    const totalTxns = accounts.reduce((s, a) => s + a.txns.length, 0);
                    log(`׳”׳×׳§׳‘׳׳• ${totalTxns} ׳¢׳¡׳§׳׳•׳× ג…`, 'success', 'ג…');
                    resolve(accounts);
                }

                if (data.status === 'error' && !settled) {
                    settled = true; clearTimeout(timer); unsubscribe();
                    reject(new Error(data.errorMessage || data.errorType || '׳©׳’׳™׳׳”'));
                }
            }, (err) => {
                if (!settled) { settled = true; clearTimeout(timer); unsubscribe(); reject(err); }
            });
        });

        setFinStage(3, 'ג™ן¸', '׳׳¢׳‘׳“ ׳ ׳×׳•׳ ׳™׳...', '׳¢׳•׳“ ׳¨׳’׳¢...', '85%');
        await new Promise(r => setTimeout(r, 800));

        _n('finProgressBar').style.width           = '100%';
        _n('finProgressIcon').textContent           = 'ג…';
        _n('finProgressTitle').textContent          = '׳”׳•׳©׳׳ ׳‘׳”׳¦׳׳—׳”!';
        _n('finProgressSub').textContent            = `׳™׳•׳‘׳׳• ${transactions.length} ׳¢׳¡׳§׳׳•׳×`;
        for (let i = 1; i <= 3; i++) {
            const dot = _n('finDot' + i);
            if (!dot) continue;
            dot.textContent      = 'ג“';
            dot.style.background = '#7367f0';
            dot.style.color      = 'white';
        }
        await new Promise(r => setTimeout(r, 1000));
        hideFinProgress();

        if (transactions.length > 0) {
            const MONTHS_HE = ['׳™׳ ׳•׳׳¨','׳₪׳‘׳¨׳•׳׳¨','׳׳¨׳¥','׳׳₪׳¨׳™׳','׳׳׳™','׳™׳•׳ ׳™','׳™׳•׳׳™','׳׳•׳’׳•׳¡׳˜','׳¡׳₪׳˜׳׳‘׳¨','׳׳•׳§׳˜׳•׳‘׳¨','׳ ׳•׳‘׳׳‘׳¨','׳“׳¦׳׳‘׳¨'];
            let totalImported = 0;
            transactions.forEach(acc => {
                if (!acc.txns?.length) return;
                const cardSuffix = acc.accountNumber ? ` ${acc.accountNumber}` : '';
                const byMonth = {};
                acc.txns.forEach(t => {
                    const d   = new Date(t.date);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (!byMonth[key]) byMonth[key] = { year: d.getFullYear(), month: d.getMonth(), txns: [] };
                    byMonth[key].txns.push(t);
                });
                Object.values(byMonth)
                    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
                    .forEach(({ year, month, txns }) => {
                        const listName = `${nameLabel}${cardSuffix} - ${MONTHS_HE[month]} ${year}`;
                        txns.sort((a, b) => new Date(b.date) - new Date(a.date));
                        importFinancialTransactions(txns, listName);
                        totalImported += txns.length;
                    });
            });
            if (totalImported === 0 && typeof window.showNotification === 'function')
                window.showNotification('ג„¹ן¸ ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳×', 'warning');
        } else {
            if (typeof window.showNotification === 'function') window.showNotification('ג„¹ן¸ ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳×', 'warning');
        }

    } catch (err) {
        const msg = err.message === 'timeout' ? '׳₪׳¡׳§ ׳”׳–׳׳ ג€” ׳ ׳¡׳” ׳©׳•׳‘' : err.message;
        hideFinProgress();
        if (typeof window.showNotification === 'function') window.showNotification('ג ' + msg, 'error');
    }
}

function importFinancialTransactions(transactions, nameLabel) {
    const today = new Date().toLocaleDateString('he-IL');
    const newId = 'L' + Date.now();
    const items = transactions.map(t => ({
        name:        t.name || t.description || '׳¢׳¡׳§׳”',
        price:       parseFloat(t.amount || t.price || 0),
        qty:         1, checked: false, isPaid: true,
        category:    detectCategory(t.name || t.description || ''),
        note:        t.date ? 'נ“… ' + new Date(t.date).toLocaleDateString('he-IL') : '',
        dueDate: '', paymentUrl: '',
        lastUpdated: Date.now(),
        cloudId:     'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }));
    db.lists[newId] = { name: nameLabel + ' - ' + today, url: '', budget: 0, isTemplate: false, items };
    db.currentId    = newId;
    setActivePage('lists');
    save();
    if (typeof window.showNotification === 'function')
        window.showNotification('ג… ׳™׳•׳‘׳׳• ' + items.length + ' ׳¨׳©׳•׳׳•׳× ׳' + nameLabel + '!');
}

async function startCreditCardFetch() {
    if (!selectedCreditCompany) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ׳‘׳—׳¨ ׳—׳‘׳¨׳× ׳׳©׳¨׳׳™ ׳×׳—׳™׳׳”', 'warning');
        return;
    }
    const username = _n('creditUsername')?.value.trim();
    const password = _n('creditPassword')?.value.trim();
    if (!username || !password) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ׳”׳–׳ ׳©׳ ׳׳©׳×׳׳© ׳•׳¡׳™׳¡׳׳”', 'warning');
        return;
    }
    await runFinancialFetch({
        companyId:   selectedCreditCompany,
        credentials: { username, password },
        modalId:     'creditCardModal',
        nameLabel:   'נ’³ ' + (CREDIT_NAMES[selectedCreditCompany] || '׳׳©׳¨׳׳™')
    });
}

async function startBankFetch() {
    if (!selectedBank) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ׳‘׳—׳¨ ׳‘׳ ׳§ ׳×׳—׳™׳׳”', 'warning');
        return;
    }
    const cfg       = BANK_CONFIG[selectedBank];
    const field1Val = _n('bankField1')?.value.trim();
    const password  = _n('bankConnectPassword')?.value.trim();
    const field2Val = _n('bankField2')?.value.trim();
    if (!field1Val || !password) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ׳”׳–׳ ׳׳× ׳›׳ ׳₪׳¨׳˜׳™ ׳”׳”׳×׳—׳‘׳¨׳•׳×', 'warning');
        return;
    }
    if (cfg.field2 && !field2Val) {
        if (typeof window.showNotification === 'function') window.showNotification('ג ן¸ ' + cfg.field2Label + ' ׳ ׳“׳¨׳©', 'warning');
        return;
    }
    const credentials = { password };
    credentials[cfg.field1] = field1Val;
    if (cfg.field2) credentials[cfg.field2] = field2Val;
    await runFinancialFetch({
        companyId:   selectedBank,
        credentials,
        modalId:     'bankConnectModal',
        nameLabel:   'נ›ן¸ ' + (BANK_NAMES[selectedBank] || '׳‘׳ ׳§')
    });
}

// ג”€ג”€ Legacy stubs ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function checkAndScheduleNotifications() { _scheduleAllReminders(); }
function scheduleItemNotification()       {}
function showInAppNotification()          {}
function playNotificationSound()          {}
function showItemNotification()           {}
function checkSnoozeStatus()              { return true; }


export { initNotificationSystem, _scheduleAllReminders, checkUrgentPayments, snoozeUrgentAlert, closeUrgentAlert, initServiceWorkerListener, checkNotificationUrlParam, _firePushNotification, applyCustomSnooze, openCustomSnooze, initItemAlertTime, updateAppBadge };

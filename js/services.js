// ============================================================
//  services.js  —  לוגיקת רקע: Firebase, בנק, תזכורות
//  מייבא מ: constants.js, store.js
//  מיובא על-ידי: ui.js, app.js
// ============================================================

import { BANK_CONFIG, BANK_NAMES, CREDIT_NAMES } from './constants.js';
import {
    db, activePage, currentUser, isConnected, syncTimeout,
    unsubscribeSnapshot, isDemoMode,
    setDb, setActivePage, setCurrentUser, setIsConnected,
    setSyncTimeout, setUnsubscribeSnapshot,
    detectCategory, save
} from './store.js';

// ============================================================
//  עזר — helper (לוקלי)
// ============================================================
function _n(id)  { return document.getElementById(id); }
function _qs(s)  { return document.querySelector(s); }

// ============================================================
//  getReminderMilliseconds / computeNextAlertTime / formatReminderText
// ============================================================
export function getReminderMilliseconds(value, unit) {
    if (!value || !unit) return 0;
    const n = parseInt(value);
    if (isNaN(n) || n <= 0) return 0;
    const map = { minutes: n * 60000, hours: n * 3600000, days: n * 86400000, weeks: n * 604800000 };
    return map[unit] || 0;
}

export function computeNextAlertTime(item) {
    if (!item.dueDate || !item.reminderValue || !item.reminderUnit) return null;
    const timeStr = item.dueTime || '09:00';
    const [h, m] = timeStr.split(':');
    const due = new Date(item.dueDate);
    due.setHours(parseInt(h), parseInt(m), 0, 0);
    return due.getTime() - getReminderMilliseconds(item.reminderValue, item.reminderUnit);
}

export function formatReminderText(value, unit) {
    if (!value || !unit) return '';
    const units = {
        minutes: value === '1' ? 'דקה' : 'דקות',
        hours:   value === '1' ? 'שעה' : 'שעות',
        days:    value === '1' ? 'יום'  : 'ימים',
        weeks:   value === '1' ? 'שבוע' : 'שבועות'
    };
    return `${value} ${units[unit] || unit}`;
}

// ============================================================
//  showDetailedError
// ============================================================
export function showDetailedError(context, error) {
    const errorCode    = error.code    || 'UNKNOWN_ERROR';
    const errorMessage = error.message || 'Unknown error occurred';
    console.error(`❌ [${context}]`, { code: errorCode, message: errorMessage, fullError: error });

    let errorTitle  = context;
    let userMessage = '';

    if (errorCode.includes('auth/')) {
        if (errorCode === 'auth/unauthorized-domain') {
            errorTitle  = '⚠️ הדומיין לא מורשה';
            userMessage = `הדומיין הזה לא מורשה להתחברות ב-Firebase.\n\n1. פתח Firebase Console\n2. Authentication → Settings → Authorized domains\n3. הוסף: ${window.location.hostname}`;
        } else if (errorCode === 'auth/operation-not-allowed') {
            errorTitle  = '⚠️ Google Sign-In לא מופעל';
            userMessage = 'שיטת ההתחברות של Google לא מופעלת.\n\nAuthentication → Sign-in method → Google → Enable';
        } else if (errorCode === 'auth/popup-blocked') {
            errorTitle  = '⚠️ חלון נחסם';
            userMessage = 'הדפדפן חסם את חלון ההתחברות.\n\nאפשר חלונות קופצים לאתר זה.';
        } else if (errorCode === 'auth/network-request-failed') {
            errorTitle  = '⚠️ בעיית רשת';
            userMessage = 'לא ניתן להתחבר לשרתי Firebase.\n\nבדוק את החיבור לאינטרנט.';
        } else {
            userMessage = `קוד שגיאה: ${errorCode}\n\n${errorMessage}`;
        }
    } else if (errorCode.includes('permission-denied')) {
        errorTitle  = '⚠️ אין הרשאה';
        userMessage = 'אין הרשאה לגשת לנתונים.\n\nבדוק הגדרות Firebase Security Rules.';
    } else if (errorCode.includes('unavailable')) {
        errorTitle  = '⚠️ שירות לא זמין';
        userMessage = 'השירות לא זמין כרגע.\n\nנסה שוב מאוחר יותר.';
    } else {
        userMessage = `קוד: ${errorCode}\n\n${errorMessage}`;
    }

    if (typeof window.showFirebaseError === 'function') {
        window.showFirebaseError(errorTitle, userMessage);
    } else if (typeof window.showNotification === 'function') {
        window.showNotification(`❌ ${errorTitle}`, 'error');
    }
}

// ============================================================
//  updateCloudIndicator
// ============================================================
export function updateCloudIndicator(status) {
    const indicator = _n('cloudIndicator');
    const text      = _n('cloudSyncText');
    const cloudBtn  = _n('cloudBtn');
    if (!indicator || !cloudBtn) return;

    if (status === 'connected') {
        indicator.className = 'w-2 h-2 bg-green-500 rounded-full';
        cloudBtn.className  = 'cloud-btn-connected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = 'מחובר ✅';
    } else if (status === 'syncing') {
        indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
        cloudBtn.className  = 'cloud-btn-syncing px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = 'מסנכרן...';
    } else {
        indicator.className = 'w-2 h-2 bg-red-400 rounded-full';
        cloudBtn.className  = 'cloud-btn-disconnected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = 'מנותק';
    }
}

// ============================================================
//  normalizeItem
// ============================================================
export function normalizeItem(item) {
    return {
        name:            item.name            || '',
        price:           item.price           || 0,
        qty:             item.qty             || 1,
        checked:         item.checked         || false,
        category:        item.category        || 'אחר',
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
export function mergeCloudWithLocal(cloudData, localData) {
    console.log('🔄 מבצע מיזוג חכם בין ענן למקומי...');
    const merged = JSON.parse(JSON.stringify(cloudData));

    // Normalize cloud items
    Object.keys(merged.lists || {}).forEach(listId => {
        if (merged.lists[listId].items) {
            merged.lists[listId].items = merged.lists[listId].items.map(normalizeItem);
        }
    });

    // Merge local → cloud (add new local items / lists)
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
                console.log('➕ מוסיף פריט חדש מקומי ללא cloudId:', localItem.name);
            } else if (!cloudItemsMap[localItem.cloudId]) {
                merged.lists[listId].items.push(normalizeItem(localItem));
                console.log('➕ מוסיף פריט חדש מאופליין:', localItem.name);
            }
        });
    });

    // Add entirely new local lists
    Object.keys(localData.lists || {}).forEach(listId => {
        if (!merged.lists[listId]) {
            console.log('📝 מוסיף רשימה חדשה מקומית:', listId);
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
export async function syncToCloud() {
    if (!currentUser) { console.warn('⚠️ אין משתמש מחובר'); return; }
    console.log('☁️ מסנכרן לענן... UID:', currentUser.uid);
    updateCloudIndicator('syncing');
    try {
        const userDocRef = window.doc(window.firebaseDb, 'shopping_lists', currentUser.uid);
        await window.setDoc(userDocRef, db);
        console.log('✅ סנכרון לענן הושלם');
    } catch (error) {
        console.error('❌ שגיאה בכתיבה לענן:', error);
        showDetailedError('Cloud Sync', error);
    } finally {
        updateCloudIndicator('connected');
    }
}

// ============================================================
//  setupFirestoreListener
// ============================================================
export function setupFirestoreListener(user) {
    console.log('📡 מגדיר Firestore listener עבור UID:', user.uid);
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
                console.log('🔄 מבצע סנכרון חכם מהענן...');
                let mergedDb = mergeCloudWithLocal(cloudData, db);
                if (!mergedDb.lists || Object.keys(mergedDb.lists).length === 0) {
                    mergedDb.lists     = { 'L1': { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] } };
                    mergedDb.currentId = 'L1';
                }
                setDb(mergedDb);
                localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(mergedDb));
                if (typeof window.render === 'function') window.render();
                if (typeof window.showNotification === 'function') window.showNotification('☁️ סונכרן מהענן!', 'success');
            }
        } else {
            console.log('📝 מסמך לא קיים בענן, יוצר חדש...');
            syncToCloud();
        }
    }, (error) => {
        console.error('❌ שגיאת Firestore sync:', error);
        showDetailedError('Firestore Sync', error);
        if (currentUser) updateCloudIndicator('connected');
    });

    setUnsubscribeSnapshot(unsub);
}

// ============================================================
//  initFirebaseAuth
// ============================================================
export function initFirebaseAuth() {
    console.log('🔄 מאתחל Firebase Auth...');

    window.onAuthStateChanged(window.firebaseAuth, (user) => {
        setCurrentUser(user);
        setIsConnected(!!user);
        console.log('👤 מצב משתמש:', user ? `מחובר: ${user.email}` : 'מנותק');

        updateCloudIndicator(user ? 'connected' : 'disconnected');

        const emailDisplay = _n('userEmailDisplay');
        const logoutBtn    = _n('logoutBtn');
        if (emailDisplay) {
            emailDisplay.textContent = user ? `מחובר כ: ${user.email}` : 'לא מחובר';
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
export function loginWithGoogle() {
    if (!window.firebaseAuth) {
        if (typeof window.showNotification === 'function') window.showNotification('⏳ שירות הענן עדיין נטען...', 'warning');
        return;
    }
    if (!window.googleProvider) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ Google provider לא זמין', 'warning');
        return;
    }
    if (window.firebaseAuth.currentUser) {
        if (typeof window.showNotification === 'function') window.showNotification('✅ אתה כבר מחובר', 'success');
        if (typeof window.openModal === 'function') window.openModal('settingsModal');
        return;
    }

    updateCloudIndicator('syncing');
    const isGitHubPages = window.location.hostname.includes('github.io');

    if (isGitHubPages) {
        if (typeof window.showNotification === 'function') window.showNotification('⏳ מעביר לדף ההתחברות של Google...', 'success');
        window.signInWithRedirect(window.firebaseAuth, window.googleProvider)
            .catch(err => { showDetailedError('Login', err); updateCloudIndicator('disconnected'); });
    } else {
        window.signInWithPopup(window.firebaseAuth, window.googleProvider)
            .then(result => {
                if (typeof window.showNotification === 'function') window.showNotification('✅ התחברת בהצלחה!', 'success');
                setCurrentUser(result.user);
                setIsConnected(true);
                updateCloudIndicator('connected');
                setupFirestoreListener(result.user);
            })
            .catch(err => {
                const c = err.code;
                if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') {
                    if (typeof window.showNotification === 'function') window.showNotification('ℹ️ חלון ההתחברות נסגר', 'warning');
                } else if (c === 'auth/popup-blocked') {
                    if (typeof window.showNotification === 'function') window.showNotification('⚠️ הדפדפן חסם את חלון ההתחברות', 'warning');
                } else {
                    showDetailedError('Login', err);
                }
                updateCloudIndicator('disconnected');
            });
    }
}

export function logoutFromCloud() {
    if (!window.firebaseAuth) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ שירות הענן לא זמין', 'warning');
        return;
    }
    updateCloudIndicator('syncing');
    window.signOut(window.firebaseAuth)
        .then(() => {
            setCurrentUser(null);
            setIsConnected(false);
            if (typeof window.showNotification === 'function') window.showNotification('👋 התנתקת מהענן', 'success');
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
export function startFirebaseWatcher() {
    const checkFirebase = setInterval(() => {
        if (window.firebaseAuth) {
            clearInterval(checkFirebase);
            console.log('✅ Firebase זמין, מאתחל...');
            initFirebaseAuth();
        }
    }, 100);

    setTimeout(() => {
        if (!window.firebaseAuth) {
            console.warn('⚠️ Firebase לא נטען אחרי 10 שניות');
            if (typeof window.showNotification === 'function')
                window.showNotification('⚠️ שירות הענן לא זמין - טען מחדש את הדף', 'warning');
        }
    }, 10000);
}

// ============================================================
//  תזכורות — Reminders
// ============================================================
const _reminderTimers = new Map();
export let _forceShowAfterNotificationClick = false;

export function initItemAlertTime(item) {
    const natural = computeNextAlertTime(item);
    if (!natural) { item.nextAlertTime = null; return; }
    const now = Date.now();
    if (!item.nextAlertTime || item.nextAlertTime <= now) {
        item.nextAlertTime   = natural;
        item.alertDismissedAt = null;
    }
}

export function snoozeUrgentAlert(ms) {
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

    const label = ms < 3600000 ? Math.round(ms / 60000) + ' דקות'
        : ms < 86400000 ? Math.round(ms / 3600000) + ' שעות'
        : Math.round(ms / 86400000) + ' ימים';
    if (typeof window.showNotification === 'function') window.showNotification('⏰ תוזכר בעוד ' + label, 'info');
}

export function closeUrgentAlert() {
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

export function checkUrgentPayments() {
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

export function updateAppBadge(count) {
    if ('setAppBadge' in navigator) {
        count > 0 ? navigator.setAppBadge(count).catch(() => {}) : navigator.clearAppBadge().catch(() => {});
    }
}

export function _scheduleAllReminders() {
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
    const title   = `⏰ תזכורת: ${item.name}`;
    const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString('he-IL') : '';
    const timeStr = item.dueTime ? ' בשעה ' + item.dueTime : '';
    const body    = dateStr ? `יעד: ${dateStr}${timeStr}` : 'יש לך תזכורת';
    const data    = { type: 'reminder', itemName: item.name, dueDate: item.dueDate || '', dueTime: item.dueTime || '' };
    if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION', title, body,
            tag: 'reminder-' + (item.cloudId || item.name), data
        });
    }
}

export async function initNotificationSystem() {
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    _scheduleAllReminders();
    checkUrgentPayments();
    setInterval(checkUrgentPayments, 30000);
}

// ── Custom Snooze ─────────────────────────────────────────────
export function openCustomSnooze() {
    if (typeof window.closeModal === 'function') window.closeModal('urgentAlertModal');
    if (typeof window.openModal  === 'function') window.openModal('customSnoozeModal');
}

export function applyCustomSnooze() {
    const value = parseFloat(_n('customSnoozeValue')?.value);
    const unit  = _n('customSnoozeUnit')?.value;
    if (!value || value <= 0) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ נא להזין מספר חיובי', 'warning');
        return;
    }
    const ms = unit === 'minutes' ? value * 60000 : unit === 'hours' ? value * 3600000 : value * 86400000;
    snoozeUrgentAlert(ms);
    if (typeof window.closeModal === 'function') window.closeModal('customSnoozeModal');
    if (_n('customSnoozeValue')) _n('customSnoozeValue').value = '1';
    if (_n('customSnoozeUnit'))  _n('customSnoozeUnit').value  = 'hours';
}

// ── SW Message Listener ───────────────────────────────────────
export function initServiceWorkerListener() {
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

export function checkNotificationUrlParam() {
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
export function loadGithubToken() {
    const token = localStorage.getItem('vplus_github_pat') || '';
    window.GITHUB_PAT = token;
    const input = _n('githubTokenInput');
    if (input && token) input.value = token;
    updateGithubTokenStatus();
}

export function saveGithubToken() {
    const input = _n('githubTokenInput');
    if (!input) return;
    const token = input.value.trim();
    if (!token) {
        localStorage.removeItem('vplus_github_pat');
        window.GITHUB_PAT = '';
        if (typeof window.showNotification === 'function') window.showNotification('🗑️ Token נמחק');
    } else if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        if (typeof window.showNotification === 'function')
            window.showNotification('⚠️ Token לא תקין — חייב להתחיל ב-ghp_ או github_pat_', 'warning');
        return;
    } else {
        localStorage.setItem('vplus_github_pat', token);
        window.GITHUB_PAT = token;
        if (typeof window.showNotification === 'function') window.showNotification('✅ GitHub Token נשמר!');
    }
    updateGithubTokenStatus();
}

export function updateGithubTokenStatus() {
    const input  = _n('githubTokenInput');
    const status = _n('githubTokenStatus');
    if (!status) return;
    const val = (input?.value || '') || localStorage.getItem('vplus_github_pat') || '';
    if (val.startsWith('ghp_') || val.startsWith('github_pat_')) {
        status.textContent = '✅ מוגדר';    status.style.color = '#22c55e';
    } else if (val.length > 0) {
        status.textContent = '⚠️ לא תקין'; status.style.color = '#f59e0b';
    } else {
        status.textContent = '❌ לא מוגדר'; status.style.color = '#ef4444';
    }
}

// ============================================================
//  Financial progress UI
// ============================================================
export function showFinProgress() {
    const el = _n('finProgressOverlay');
    if (el) el.style.display = 'flex';
}
export function hideFinProgress() {
    const el = _n('finProgressOverlay');
    if (el) el.style.display = 'none';
}
export function setFinStage(step, icon, title, sub, pct) {
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
        dot.textContent      = i < step ? '✓' : String(i);
    }
}

// ============================================================
//  Bank / Credit state
// ============================================================
export let selectedCreditCompany = null;
export let selectedBank          = null;

export function setSelectedCreditCompany(v) { selectedCreditCompany = v; }
export function setSelectedBank(v)          { selectedBank = v; }

export function selectCreditCompany(id, btn) {
    selectedCreditCompany = id;
    document.querySelectorAll('.credit-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
}

export function selectBank(bankId, btn) {
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
export async function runFinancialFetch({ companyId, credentials, modalId, nameLabel }) {
    const debugLogs = [];
    const log = (msg, type = 'info', icon = '•') => {
        debugLogs.push({ msg, type, icon, time: new Date().toLocaleTimeString('he-IL') });
        if (typeof window.showDebugLog === 'function') window.showDebugLog(debugLogs);
    };

    if (typeof window.closeModal === 'function') window.closeModal(modalId);
    showFinProgress();

    try {
        const user = window.firebaseAuth?.currentUser;
        log(`חברה: ${companyId}`, 'info', '🏦');
        log(`currentUser: ${user ? user.email : 'null'}`, user ? 'success' : 'error', user ? '👤' : '❌');
        if (!user) {
            hideFinProgress();
            if (typeof window.showNotification === 'function') window.showNotification('❌ יש להתחבר לחשבון תחילה', 'error');
            return;
        }

        const userId = user.uid;
        const jobId  = 'job_' + Date.now();

        setFinStage(1, '🔐', 'שולח לסנכרון...', 'מפעיל GitHub Actions', '15%');

        const GITHUB_TOKEN = window.GITHUB_PAT || '';
        const REPO         = 'ronmailx-boop/Shopping-list';

        if (!GITHUB_TOKEN) {
            log('⚠️ חסר GITHUB_PAT — עיין בהגדרות', 'error', '❌');
            hideFinProgress();
            if (typeof window.showNotification === 'function') window.showNotification('❌ חסר GitHub Token — הגדר GITHUB_PAT', 'error');
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

        log('שולח ל-GitHub Actions...', 'info', '🚀');
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
            log(`שגיאת GitHub: ${ghRes.status} — ${errText}`, 'error', '❌');
            hideFinProgress();
            if (typeof window.showNotification === 'function') window.showNotification('❌ שגיאת GitHub Actions', 'error');
            return;
        }

        log('GitHub Actions הופעל ✅', 'success', '🚀');
        setFinStage(2, '⏳', 'ממתין לתוצאות...', 'זה לוקח עד 3 דקות', '40%');

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
                log(`סטטוס: ${data.status}`, 'info', '📊');

                if (data.status === 'running') setFinStage(2, '🔐', 'מתחבר לבנק...', 'GitHub Actions פועל', '55%');

                if (data.status === 'done' && !settled) {
                    settled = true; clearTimeout(timer); unsubscribe();
                    const accounts = (data.accounts || []).map(acc => ({
                        accountNumber: acc.accountNumber || '',
                        txns: (acc.txns || [])
                            .map(t => ({ name: t.description || 'עסקה', amount: Math.abs(t.amount || 0), price: Math.abs(t.amount || 0), date: t.date || '' }))
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                    }));
                    const totalTxns = accounts.reduce((s, a) => s + a.txns.length, 0);
                    log(`התקבלו ${totalTxns} עסקאות ✅`, 'success', '✅');
                    resolve(accounts);
                }

                if (data.status === 'error' && !settled) {
                    settled = true; clearTimeout(timer); unsubscribe();
                    reject(new Error(data.errorMessage || data.errorType || 'שגיאה'));
                }
            }, (err) => {
                if (!settled) { settled = true; clearTimeout(timer); unsubscribe(); reject(err); }
            });
        });

        setFinStage(3, '⚙️', 'מעבד נתונים...', 'עוד רגע...', '85%');
        await new Promise(r => setTimeout(r, 800));

        _n('finProgressBar').style.width           = '100%';
        _n('finProgressIcon').textContent           = '✅';
        _n('finProgressTitle').textContent          = 'הושלם בהצלחה!';
        _n('finProgressSub').textContent            = `יובאו ${transactions.length} עסקאות`;
        for (let i = 1; i <= 3; i++) {
            const dot = _n('finDot' + i);
            if (!dot) continue;
            dot.textContent      = '✓';
            dot.style.background = '#7367f0';
            dot.style.color      = 'white';
        }
        await new Promise(r => setTimeout(r, 1000));
        hideFinProgress();

        if (transactions.length > 0) {
            const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
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
                window.showNotification('ℹ️ לא נמצאו עסקאות', 'warning');
        } else {
            if (typeof window.showNotification === 'function') window.showNotification('ℹ️ לא נמצאו עסקאות', 'warning');
        }

    } catch (err) {
        const msg = err.message === 'timeout' ? 'פסק הזמן — נסה שוב' : err.message;
        hideFinProgress();
        if (typeof window.showNotification === 'function') window.showNotification('❌ ' + msg, 'error');
    }
}

export function importFinancialTransactions(transactions, nameLabel) {
    const today = new Date().toLocaleDateString('he-IL');
    const newId = 'L' + Date.now();
    const items = transactions.map(t => ({
        name:        t.name || t.description || 'עסקה',
        price:       parseFloat(t.amount || t.price || 0),
        qty:         1, checked: false, isPaid: true,
        category:    detectCategory(t.name || t.description || ''),
        note:        t.date ? '📅 ' + new Date(t.date).toLocaleDateString('he-IL') : '',
        dueDate: '', paymentUrl: '',
        lastUpdated: Date.now(),
        cloudId:     'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }));
    db.lists[newId] = { name: nameLabel + ' - ' + today, url: '', budget: 0, isTemplate: false, items };
    db.currentId    = newId;
    setActivePage('lists');
    save();
    if (typeof window.showNotification === 'function')
        window.showNotification('✅ יובאו ' + items.length + ' רשומות מ' + nameLabel + '!');
}

export async function startCreditCardFetch() {
    if (!selectedCreditCompany) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ בחר חברת אשראי תחילה', 'warning');
        return;
    }
    const username = _n('creditUsername')?.value.trim();
    const password = _n('creditPassword')?.value.trim();
    if (!username || !password) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ הזן שם משתמש וסיסמה', 'warning');
        return;
    }
    await runFinancialFetch({
        companyId:   selectedCreditCompany,
        credentials: { username, password },
        modalId:     'creditCardModal',
        nameLabel:   '💳 ' + (CREDIT_NAMES[selectedCreditCompany] || 'אשראי')
    });
}

export async function startBankFetch() {
    if (!selectedBank) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ בחר בנק תחילה', 'warning');
        return;
    }
    const cfg       = BANK_CONFIG[selectedBank];
    const field1Val = _n('bankField1')?.value.trim();
    const password  = _n('bankConnectPassword')?.value.trim();
    const field2Val = _n('bankField2')?.value.trim();
    if (!field1Val || !password) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ הזן את כל פרטי ההתחברות', 'warning');
        return;
    }
    if (cfg.field2 && !field2Val) {
        if (typeof window.showNotification === 'function') window.showNotification('⚠️ ' + cfg.field2Label + ' נדרש', 'warning');
        return;
    }
    const credentials = { password };
    credentials[cfg.field1] = field1Val;
    if (cfg.field2) credentials[cfg.field2] = field2Val;
    await runFinancialFetch({
        companyId:   selectedBank,
        credentials,
        modalId:     'bankConnectModal',
        nameLabel:   '🏛️ ' + (BANK_NAMES[selectedBank] || 'בנק')
    });
}

// ── Legacy stubs ──────────────────────────────────────────────
export function checkAndScheduleNotifications() { _scheduleAllReminders(); }
export function scheduleItemNotification()       {}
export function showInAppNotification()          {}
export function playNotificationSound()          {}
export function showItemNotification()           {}
export function checkSnoozeStatus()              { return true; }

// קוד סנכרון גוגל והגדרות נשארים ללא שינוי...

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = { success: '✅', error: '❌', info: 'ℹ️', offline: '📡' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// מאזינים למצב אופליין
window.addEventListener('online', () => showToast('החיבור חזר! סנכרון זמין', 'success'));
window.addEventListener('offline', () => showToast('עובד במצב אופליין. הנתונים נשמרים מקומית', 'offline'));

// עדכון סנכרון עם Toasts
async function syncToCloud() {
    if (!navigator.onLine) {
        showToast('אין חיבור לאינטרנט לסנכרון', 'error');
        return;
    }
    
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');

    try {
        const folderId = await findOrCreateFolder();
        const fileId = await findFileInFolder(folderId);
        const dataToSave = JSON.stringify(db);

        // לוגיקת העלאה...
        showToast('סונכרן לענן בהצלחה', 'success');
    } catch (err) {
        showToast('שגיאה בסנכרון לענן', 'error');
    } finally {
        isSyncing = false;
        updateCloudIndicator('connected');
    }
}

// עדכון ייבוא עם Toasts
function importFromText() {
    // לוגיקת ייבוא קיימת...
    if (items.length === 0) {
        showToast('לא נמצאו מוצרים לייבוא', 'error');
        return;
    }
    // בסיום הייבוא:
    showToast(`יובאו ${items.length} מוצרים בהצלחה`, 'success');
}

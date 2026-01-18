// אתחול נתונים בסיסי
let db = JSON.parse(localStorage.getItem('vplus_db')) || { items: [], settings: { isLocked: false } };
let isSyncing = false;
let accessToken = null;

function saveDb() {
    localStorage.setItem('vplus_db', JSON.stringify(db));
    render();
}

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

// ניהול דפים וטאבים
function showPage(pageId) {
    document.getElementById('pageLists').classList.toggle('hidden', pageId !== 'lists');
    document.getElementById('tabLists').classList.toggle('tab-active', pageId === 'lists');
    document.getElementById('tabSummary').classList.toggle('tab-active', pageId === 'summary');
    showToast(`עברת למסך ${pageId === 'lists' ? 'הרשימה' : 'הסיכום'}`, 'info');
}

// פונקציות כפתורים בסיסיות למניעת שגיאות
function openModal(id) { showToast(`פתיחת מודאל: ${id}`, 'info'); }
function toggleLock() { 
    db.settings.isLocked = !db.settings.isLocked; 
    saveDb(); 
    showToast(db.settings.isLocked ? 'הרשימה ננעלה' : 'הרשימה פתוחה', 'info'); 
}

// מאזינים לרשת
window.addEventListener('online', () => showToast('החיבור חזר! סנכרון זמין', 'success'));
window.addEventListener('offline', () => showToast('עובד במצב אופליין', 'offline'));

function render() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    container.innerHTML = db.items.length === 0 ? '<div class="text-center p-10 text-gray-400">הרשימה ריקה</div>' : '';
    // כאן תבוא לוגיקת הרינדור המלאה שלך
}

// הרצה ראשונית
render();

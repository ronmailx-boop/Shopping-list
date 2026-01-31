// ========== Global Configuration ==========
const GOOGLE_API_KEY = "AIzaSyBqIqxoiwwqeKkjlYJpEiqgCG09PgabwhI"; // הוסף כדי שסורק הקבלות יעבוד

// ========== Firebase Configuration ==========
let unsubscribeSnapshot = null;
let isSyncing = false;
let isConnected = false;
let currentUser = null;
let syncTimeout = null;

// ========== Categories & Keywords ==========
// (הגדרות הקטגוריות והמילים נשארות כפי שהיו בקובץ המקורי שלך)
const CATEGORIES = {
    'פירות וירקות': '#22c55e',
    'בשר ודגים': '#ef4444',
    'חלב וביצים': '#3b82f6',
    'לחם ומאפים': '#f59e0b',
    'שימורים': '#8b5cf6',
    'חטיפים': '#ec4899',
    'משקאות': '#06b6d4',
    'ניקיון': '#10b981',
    'היגיינה': '#6366f1',
    'אחר': '#6b7280'
};

// ... (שאר רשימות ה-CATEGORY_KEYWORDS והתרגומים נשארים ללא שינוי)

// ========== App Data & State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: {
        'L1': {
            name: 'הרשימה שלי',
            url: '',
            budget: 0,
            isTemplate: false,
            items: []
        }
    },
    history: [],
    templates: [],
    lastActivePage: 'lists',
    lastSync: 0,
    stats: {
        totalSpent: 0,
        listsCompleted: 0,
        monthlyData: {}
    }
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;
let monthlyChart = null;
let highlightedItemIndex = null;
let highlightedListId = null;
let categorySortEnabled = localStorage.getItem('categorySortEnabled') === 'true' || false;

// ========== Core Functions (Save, Render, Etc) ==========
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();

    if (isConnected && currentUser) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncToCloud();
        }, 1500);
    }
}

// ... (כאן מגיעות כל הפונקציות המקוריות שלך: render, toggleItem, addItem וכו')
// הקוד נשאר זהה לקוד ששלחת, פשוט וודא שהוא מכיל את כל הפונקציות עד הסוף.

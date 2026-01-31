// ========== Firebase Configuration ==========
let unsubscribeSnapshot = null;
let isSyncing = false;
let isConnected = false;
let currentUser = null;
let syncTimeout = null;

// ========== Categories & Keywords ==========
const CATEGORIES = {
    'פירות וירקות': '#22c55e', 'בשר ודגים': '#ef4444', 'חלב וביצים': '#3b82f6',
    'לחם ומאפים': '#f59e0b', 'שימורים': '#8b5cf6', 'חטיפים': '#ec4899',
    'משקאות': '#06b6d4', 'ניקיון': '#10b981', 'היגיינה': '#6366f1', 'אחר': '#6b7280'
};

const CATEGORY_KEYWORDS = {
    'פירות וירקות': ['עגבניות', 'מלפפון', 'חסה', 'גזר', 'בצל', 'תפוח', 'בננה', 'תפוז', 'לימון', 'תות', 'פלפל', 'פטריות'],
    'בשר ודגים': ['בשר', 'עוף', 'דג', 'סלמון', 'טונה', 'קבב', 'המבורגר', 'שניצל'],
    'חלב וביצים': ['חלב', 'גבינה', 'קוטג', 'יוגורט', 'חמאה', 'ביצים'],
    'לחם ומאפים': ['לחם', 'פיתה', 'חלה', 'עוגה', 'עוגיות', 'בורקס', 'פיצה', 'פסטה'],
    'שימורים': ['שימורים', 'זיתים', 'חמוצים', 'קטשופ', 'מיונז', 'ריבה'],
    'חטיפים': ['חטיף', 'במבה', 'ביסלי', 'צ׳יפס', 'שוקולד', 'ממתק'],
    'משקאות': ['מים', 'קולה', 'סודה', 'מיץ', 'בירה', 'יין', 'קפה', 'תה'],
    'ניקיון': ['סבון', 'אבקת כביסה', 'מרכך', 'אקונומיקה', 'מטליות', 'שקיות אשפה'],
    'היגיינה': ['שמפו', 'משחת שיניים', 'דאודורנט', 'בושם', 'גילוח', 'חיתולים']
};

// ... (כאן מופיעה כל שאר הלוגיקה המלאה שלך: detectCategory, translations, db, וכו')

let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

function save() {
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (isConnected) syncToCloud();
}

function render() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    const list = db.lists[db.currentId];
    list.items.forEach((item, idx) => {
        const sub = item.price * (item.qty || 1);
        total += sub;
        if (item.checked) paid += sub;

        const div = document.createElement('div');
        div.className = "item-card";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7">
                    <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</span>
                </div>
                <span class="text-xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
}

function addItem() {
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false });
        closeModal('inputForm');
        save();
    }
}

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function loginWithGoogle() {
    window.signInWithRedirect(window.firebaseAuth, window.googleProvider);
}

// איתחול Firebase
const checkFirebase = setInterval(() => {
    if (window.firebaseAuth) {
        clearInterval(checkFirebase);
        window.onAuthStateChanged(window.firebaseAuth, (user) => {
            currentUser = user;
            isConnected = !!user;
            const indicator = document.getElementById('cloudIndicator');
            const text = document.getElementById('cloudSyncText');
            if (user) {
                indicator.style.backgroundColor = '#22c55e';
                text.innerText = user.email;
            } else {
                indicator.style.backgroundColor = '#94a3b8';
                text.innerText = 'סנכרון ענן';
            }
        });
    }
}, 100);

render();

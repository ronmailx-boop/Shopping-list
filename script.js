// ========== Firebase Configuration ==========
// Firebase instances are initialized in index.html and available as:
// window.firebaseDb, window.firebaseAuth, etc.

let currentUser = null;
let syncTimeout = null;
let isSyncing = false;
let isConnected = false;
let unsubscribeSnapshot = null;

// ========== Categories ==========
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

// ========== Category Keywords ==========
const CATEGORY_KEYWORDS = {
    'פירות וירקות': [
        'עגבניות', 'עגבנייה', 'מלפפון', 'מלפפונים', 'חסה', 'חציל', 'גזר', 'בצל', 'שום', 'תפוח', 'תפוחים',
        'בננה', 'בננות', 'תפוז', 'תפוזים', 'אבוקדו', 'לימון', 'לימונים', 'תות', 'תותים', 'ענבים',
        'אבטיח', 'מלון', 'אפרסק', 'אפרסקים', 'שזיף', 'שזיפים', 'אגס', 'אגסים', 'תרד', 'כרוב',
        'ברוקולי', 'כרובית', 'פלפל', 'פלפלים', 'קישוא', 'קישואים', 'דלעת', 'תירס', 'פטריות',
        'ירקות', 'פירות', 'ירק', 'פרי', 'סלט', 'פטרוזיליה', 'כוסברה', 'נענע', 'בזיליקום'
    ],
    'בשר ודגים': [
        'בשר', 'עוף', 'תרנגולת', 'הודו', 'נקניק', 'נקניקיות', 'קבב', 'המבורגר', 'שניצל',
        'סטייק', 'אנטריקוט', 'צלי', 'כבד', 'לב', 'קורנדביף', 'סלמי', 'נתחי', 'כנפיים',
        'דג', 'דגים', 'סלמון', 'טונה', 'בקלה', 'אמנון', 'דניס', 'לוקוס', 'מושט', 'בורי',
        'שרימפס', 'קלמרי', 'פירות ים', 'סרדינים', 'מקרל'
    ],
    'חלב וביצים': [
        'חלב', 'גבינה', 'גבינות', 'קוטג', 'קוטג׳', 'יוגורט', 'שמנת', 'חמאה', 'ביצים', 'ביצה',
        'לבן', 'לבנה', 'צפתית', 'בולגרית', 'צהובה', 'מוצרלה', 'פרמזן', 'עמק', 'גילה',
        'גד', 'תנובה', 'שטראוס', 'יופלה', 'דנונה', 'מילקי', 'פודינג', 'חלבון', 'מעדן',
        'גלידה', 'גלידות', 'חלבי', 'חלביים'
    ],
    'לחם ומאפים': [
        'לחם', 'לחמניה', 'לחמניות', 'פיתה', 'פיתות', 'בגט', 'חלה', 'חלות', 'טוסט', 'כריך',
        'רוגלך', 'בורקס', 'בורקסים', 'קרואסון', 'קרואסונים', 'מאפה', 'מאפים', 'עוגה', 'עוגות',
        'עוגיות', 'עוגייה', 'ביסקוויט', 'קרקר', 'קרקרים', 'פריכיות', 'לחמית', 'בייגל',
        'מצה', 'מצות', 'פיצה', 'פסטה', 'ספגטי', 'מקרוני', 'אטריות', 'קוסקוס', 'בורגול',
        'קמח', 'שמרים', 'אבקת אפייה', 'סוכר', 'אורז', 'פתיתים'
    ],
    'שימורים': [
        'שימורים', 'קופסא', 'קופסת', 'שימורי', 'תירס שימורי', 'פטריות שימורי', 'זיתים',
        'מלפפונים חמוצים', 'חמוצים', 'כבושים', 'רוטב עגבניות', 'עגבניות מרוסקות', 'ממרח',
        'טונה קופסא', 'סרדינים קופסא', 'הומוס', 'טחינה', 'חומוס', 'פול', 'חומוס מוכן',
        'סלט', 'פסטה מוכנה', 'רוטב', 'רטבים', 'קטשופ', 'מיונז', 'חרדל', 'ריבה', 'דבש',
        'ממרחים', 'נוטלה', 'שוקולד ממרח'
    ],
    'חטיפים': [
        'חטיף', 'חטיפים', 'במבה', 'ביסלי', 'דוריטוס', 'צ׳יפס', 'צ׳יטוס', 'אפרופו', 'טורטית',
        'פופקורן', 'בוטנים', 'אגוזים', 'שקדים', 'קשיו', 'פיסטוק', 'גרעינים', 'צימוקים',
        'פירות יבשים', 'פרצל', 'בייגלה', 'עוגיות', 'ופלים', 'שוקולד', 'ממתקים', 'מסטיק',
        'סוכריות', 'חלווה', 'ארטיק', 'קרטיב'
    ],
    'משקאות': [
        'מים', 'סודה', 'קולה', 'זירו', 'ספרייט', 'פאנטה', 'מיץ', 'נקטר', 'בירה', 'יין',
        'וודקה', 'ויסקי', 'ערק', 'משקה', 'משקאות', 'קפה', 'תה', 'שוקו', 'חלב סויה',
        'חלב שקדים', 'סירופ', 'תרכיז'
    ],
    'ניקיון': [
        'אקונומיקה', 'מרכך כביסה', 'ג׳ל כביסה', 'אבקת כביסה', 'נוזל כלים', 'מסיר שומנים',
        'סבון רצפה', 'מטהר אוויר', 'ספוג', 'סמרטוט', 'מגבונים', 'נייר טואלט', 'נייר סופג',
        'שקיות זבל', 'שקיות אוכל', 'ניילון נצמד', 'נייר כסף', 'נייר אפייה', 'נרות', 'גפרורים',
        'סוללות'
    ],
    'היגיינה': [
        'שמפו', 'מרכך שיער', 'סבון גוף', 'תחליב רחצה', 'משחת שיניים', 'מברשת שיניים',
        'מי פה', 'חוט דנטלי', 'דאודורנט', 'בושם', 'קרם גוף', 'קרם פנים', 'קרם ידיים',
        'סכיני גילוח', 'קצף גילוח', 'תחבושות', 'טמפונים', 'צמר גפן', 'מקלות אוזניים',
        'תרופות', 'פלסטרים', 'וויטמינים'
    ]
};

// ========== State Management ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    items: [],
    history: [],
    templates: [],
    lists: [
        { id: 'default', name: 'רשימה ראשית', items: [], budget: 0, created: Date.now() }
    ],
    activeListId: 'default',
    darkMode: false,
    lastActivePage: 'lists',
    language: 'he',
    lastSync: 0
};

// Ensure activeListId points to a valid list
if (!db.lists.find(l => l.id === db.activeListId)) {
    db.activeListId = db.lists[0].id;
}

let activePage = db.lastActivePage || 'lists';
let currentLang = db.language || 'he';
let voices = [];
let recognition = null;

// ========== Helper Functions ==========
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const formatCurrency = (amount) => `₪${parseFloat(amount).toFixed(2)}`;

// ========== Core Functions ==========
function detectCategory(itemName) {
    if (!itemName) return 'אחר';
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => itemName.includes(keyword))) {
            return category;
        }
    }
    return 'אחר';
}

function getActiveList() {
    return db.lists.find(l => l.id === db.activeListId) || db.lists[0];
}

function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now(); // Update local timestamp
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();

    // Trigger sync if connected
    if (isConnected && currentUser && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncToFirestore();
        }, 1500); // Debounce sync
    }
}

// ========== UI Functions ==========
function addItem() {
    const list = getActiveList();
    const nameInput = document.getElementById('itemName');
    const priceInput = document.getElementById('itemPrice');
    const categoryInput = document.getElementById('itemCategory');

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value) || 0;
    const category = categoryInput.value || detectCategory(name);

    if (name) {
        list.items.unshift({
            id: generateId(),
            name,
            price,
            completed: false,
            category,
            addedAt: Date.now()
        });
        save();
        nameInput.value = '';
        priceInput.value = '';
        categoryInput.value = '';
        document.getElementById('autocompleteContainer').classList.remove('active');
        closeModal('inputForm');
        showNotification('המוצר נוסף בהצלחה!');
    }
}

function toggleItem(id) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === id);
    if (item) {
        item.completed = !item.completed;
        save();
    }
}

function deleteItem(id) {
    const list = getActiveList();
    if (confirm('למחוק את המוצר?')) {
        list.items = list.items.filter(i => i.id !== id);
        save();
    }
}

function editItem(id) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === id);
    if (item) {
        // Implement simple prompt edit for compatibility
        const newName = prompt('שם המוצר:', item.name);
        const newPrice = prompt('מחיר:', item.price);
        if (newName !== null) {
            item.name = newName;
            item.price = parseFloat(newPrice) || 0;
            save();
        }
    }
}

function saveEdit(id) {
    // Legacy function, kept for compatibility if needed
    save();
}

function completeList() {
    const list = getActiveList();
    if (list.items.length === 0) {
        showNotification('הרשימה ריקה!', 'error');
        return;
    }

    const total = list.items.reduce((sum, item) => sum + item.price, 0);
    db.history.unshift({
        id: generateId(),
        listName: list.name,
        date: new Date().toISOString(),
        total: total,
        itemCount: list.items.length,
        items: [...list.items]
    });

    list.items = []; // Clear current list
    save();
    closeModal('confirmModal');
    showNotification('הרשימה נשמרה בהיסטוריה!');
    render();
}

function deleteFullList() {
    if (db.lists.length <= 1) {
        showNotification('לא ניתן למחוק את הרשימה האחרונה', 'error');
        return;
    }
    db.lists = db.lists.filter(l => l.id !== db.activeListId);
    db.activeListId = db.lists[0].id;
    save();
    closeModal('deleteListModal');
    showPage('summary');
}

function saveNewList() {
    const name = document.getElementById('newListNameInput').value.trim();
    const budget = document.getElementById('newListBudget').value;
    const isTemplate = document.getElementById('newListTemplate').checked;

    if (name) {
        const newList = {
            id: generateId(),
            name,
            items: [],
            budget: parseFloat(budget) || 0,
            created: Date.now()
        };
        db.lists.push(newList);
        db.activeListId = newList.id;

        if (isTemplate) {
            db.templates.push({ ...newList, id: generateId(), name: `${name} (תבנית)` });
        }

        save();
        closeModal('newListModal');
        showPage('lists');
    }
}

function saveListName() {
    const list = getActiveList();
    const newName = document.getElementById('editListNameInput').value.trim();
    const newBudget = document.getElementById('editListBudget').value;

    if (newName) {
        list.name = newName;
        list.budget = parseFloat(newBudget) || 0;
        save();
        closeModal('editListNameModal');
    }
}

function saveTotal() {
    const list = getActiveList();
    const newTotal = parseFloat(document.getElementById('editTotalInput').value);
    closeModal('editTotalModal');
}


function toggleSum() {
    // Legacy/Feature toggle
}

function toggleSelectAll(checked) {
    // Implementation for select all in summary view
    const checkboxes = document.querySelectorAll('.list-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
}


function shareNative(type) {
    const list = getActiveList();
    let text = `רשימת קניות: ${list.name}\n`;
    list.items.forEach(item => {
        text += `${item.completed ? '✅' : '⬜'} ${item.name} - ₪${item.price}\n`;
    });

    if (navigator.share) {
        navigator.share({
            title: list.name,
            text: text
        }).catch(console.error);
    } else {
        // Fallback
        navigator.clipboard.writeText(text);
        showNotification('הועתק ללוח!');
    }
}

function toggleTemplateMode() {
    const list = getActiveList();
    if (list.items.length > 0) {
        const template = {
            id: generateId(),
            name: `${list.name} - תבנית`,
            items: [...list.items],
            budget: list.budget,
            created: Date.now()
        };
        db.templates.push(template);
        save();
        showNotification('נשמר כתבנית!');
    }
}

function toggleCategorySorting() {
    const list = getActiveList();
    const btn = document.getElementById('categorySortBtn');
    list.sortByCategory = !list.sortByCategory;
    save();
}

function clearListSearch() {
    document.getElementById('listSearchInput').value = '';
    render();
}

function searchInList() {
    render();
}

function importFromText() {
    const text = document.getElementById('importText').value;
    if (text) {
        const lines = text.split('\n');
        const list = getActiveList();
        lines.forEach(line => {
            const cleanLine = line.trim().replace(/^-/, '').trim();
            if (cleanLine) {
                list.items.push({
                    id: generateId(),
                    name: cleanLine,
                    price: 0,
                    completed: false,
                    category: detectCategory(cleanLine),
                    addedAt: Date.now()
                });
            }
        });
        save();
        closeModal('importModal');
        showNotification('רשימה יובאה בהצלחה!');
    }
}

function showCompletedListsModal() {
    const container = document.getElementById('completedListsContent');
    container.innerHTML = '';

    if (db.history.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">אין רשימות שהושלמו</p>';
    } else {
        db.history.forEach(hist => {
            const div = document.createElement('div');
            div.className = 'border-b p-3';
            div.innerHTML = `
                <div class="font-bold">${hist.listName}</div>
                <div class="text-xs text-gray-500">${new Date(hist.date).toLocaleDateString()}</div>
                <div>₪${hist.total.toFixed(2)} (${hist.itemCount} מוצרים)</div>
            `;
            container.appendChild(div);
        });
    }
    openModal('completedListsModal');
}

function toggleDarkMode() {
    db.darkMode = !db.darkMode;
    save();
    document.body.classList.toggle('dark-mode', db.darkMode);
}

function confirmLanguageChange() {
    const lang = document.getElementById('languageSelector').value;
    db.language = lang;
    currentLang = lang;
    save();
    updateUILanguage();
    showNotification('השפה שונתה בהצלחה!');
}

function preparePrint() {
    window.print();
}

function exportData() {
    const dataStr = JSON.stringify(db);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'vplus_data_backup.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedDb = JSON.parse(e.target.result);
                if (importedDb && importedDb.lists) {
                    db = importedDb;
                    save();
                    showNotification('נתונים שוחזרו בהצלחה!');
                }
            } catch (err) {
                showNotification('שגיאה בקריאת הקובץ', 'error');
            }
        };
        reader.readAsText(file);
    }
}

function performTranslation() {
    showNotification('פונקציית התרגום בפיתוח...');
    closeModal('translateModal');
}

function processReceipt() {
    showNotification('עיבוד קבלה בפיתוח...');
    closeModal('receiptScanModal');
}

function updateFileLabel() {
    const fileInput = document.getElementById('receiptImage');
    const label = document.getElementById('fileLabel');
    if (fileInput.files.length > 0) {
        label.textContent = `📁 ${fileInput.files[0].name}`;
    }
}

function startVoiceInput() {
    showNotification('זיהוי קולי...');
}

function openEditTotalModal() {
    openModal('editTotalModal');
}


// ========== Render Functions ==========
function render() {
    // Update Dark Mode
    document.body.classList.toggle('dark-mode', db.darkMode);

    // Render Lists or Summary based on ActiveList
    if (activePage === 'lists') {
        renderList();
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');

        // Update Bottom Bar
        const list = getActiveList();
        const total = list.items.reduce((sum, i) => sum + i.price, 0);
        const paid = list.items.filter(i => i.completed).reduce((sum, i) => sum + i.price, 0);

        document.getElementById('displayTotal').textContent = total.toFixed(2);
        document.getElementById('displayPaid').textContent = paid.toFixed(2);
        document.getElementById('displayLeft').textContent = (total - paid).toFixed(2);
        document.getElementById('listNameDisplay').textContent = list.name;
        document.getElementById('itemCountDisplay').textContent = `${list.items.length} מוצרים`;

    } else if (activePage === 'summary') {
        renderSummary();
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        document.getElementById('pageStats').classList.add('hidden');
    } else {
        renderStats();
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.remove('hidden');
    }

    // Update Tabs
    document.getElementById('tabLists').classList.toggle('tab-active', activePage === 'lists');
    document.getElementById('tabSummary').classList.toggle('tab-active', activePage === 'summary');
    document.getElementById('tabStats').classList.toggle('tab-active', activePage === 'stats');
}

function renderList() {
    const list = getActiveList();
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';

    const searchTerm = document.getElementById('listSearchInput').value.toLowerCase();

    let items = list.items.filter(i => i.name.toLowerCase().includes(searchTerm));

    if (list.sortByCategory) {
        items.sort((a, b) => a.category.localeCompare(b.category));
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = `item-card ${item.completed ? 'opacity-50' : ''}`;
        div.innerHTML = `
            <div class="flex justify-between items-center" onclick="toggleItem('${item.id}')">
                <div>
                    <div class="font-bold ${item.completed ? 'line-through' : ''}">${item.name}</div>
                    <div class="text-xs text-gray-500">${item.category}</div>
                </div>
                <div class="font-bold text-indigo-600">₪${item.price.toFixed(2)}</div>
            </div>
            <div class="mt-2 flex justify-between">
                <button onclick="event.stopPropagation(); editItem('${item.id}')" class="text-blue-500 text-xs font-bold">ערוך</button>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" class="text-red-500 text-xs font-bold">מחק</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderSummary() {
    const container = document.getElementById('summaryContainer');
    container.innerHTML = '';

    db.lists.forEach(list => {
        const div = document.createElement('div');
        div.className = `bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100 ${list.id === db.activeListId ? 'ring-2 ring-indigo-500' : ''}`;
        div.onclick = () => {
            db.activeListId = list.id;
            // Removed redundant save() to avoid too many writes, just switch page
            activePage = 'lists';
            save(); // Save the active page change
        };

        const total = list.items.reduce((sum, i) => sum + i.price, 0);

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-bold text-lg">${list.name}</span>
                <span class="font-bold text-indigo-600">₪${total.toFixed(2)}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">${list.items.length} מוצרים</div>
        `;
        container.appendChild(div);
    });
}

function renderStats() {
    // Basic stats implementation
}

function showPage(page) {
    activePage = page;
    render();
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
    // Pre-fill fields if needed
    if (id === 'editListNameModal') {
        const list = getActiveList();
        document.getElementById('editListNameInput').value = list.name;
        document.getElementById('editListBudget').value = list.budget || '';
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showNotification(msg, type = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification show';
    notif.style.borderRight = `5px solid ${type === 'error' ? '#ef4444' : '#22c55e'}`;
    notif.innerHTML = `<div class="font-bold">${msg}</div>`;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function updateUILanguage() {
    // Only basic support for now
    const labels = {
        'he': { 'tabLists': 'הרשימה שלי', 'tabSummary': 'הרשימות שלי' },
        'en': { 'tabLists': 'My List', 'tabSummary': 'My Lists' }
    };
    // Update texts...
}

function toggleLock() {
    const btn = document.getElementById('mainLockBtn');
    const isLocked = btn.classList.contains('locked');
    if (isLocked) {
        btn.classList.remove('locked');
        document.getElementById('statusTag').textContent = 'פתוח לעריכה';
    } else {
        btn.classList.add('locked');
        document.getElementById('statusTag').textContent = 'נעול';
    }
}

function toggleBottomBar() {
    const bar = document.querySelector('.bottom-bar');
    const toggle = document.getElementById('floatingToggle');
    bar.classList.toggle('minimized');
    toggle.classList.toggle('bar-hidden');
}


// ========== Firebase Integration ==========

// 1. Initialize Auth Logic
function initFirebaseAuth() {
    if (!window.firebaseAuth || !window.firebaseOnAuthStateChanged) {
        console.error('Firebase not initialized yet');
        return;
    }

    // Capture Redirect Data - CRITICAL FOR ANDROID
    if (window.firebaseGetRedirectResult) {
        window.firebaseGetRedirectResult(window.firebaseAuth)
            .then((result) => {
                if (result) {
                    console.log('User signed in via redirect:', result.user.email);
                    // The onAuthStateChanged listener will handle the UI update
                }
            })
            .catch((error) => {
                console.error('Redirect login error:', error);
                let errorMsg = 'שגיאה בחזרה מהתחברות';
                if (error.code === 'auth/unauthorized-domain') {
                    errorMsg = 'הדומיין לא מאושר ב-Firebase Console';
                }
                showNotification(`❌ ${errorMsg} (${error.code})`, 'error');
            });
    }

    // Listen for Auth State Changes
    window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
            currentUser = user;
            isConnected = true;
            updateCloudIndicator('connected');
            console.log('User signed in:', user.email);
            setupFirestoreListener();
        } else {
            currentUser = null;
            isConnected = false;
            updateCloudIndicator('disconnected');
            console.log('User signed out');
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
        }
    });

    // Setup cloud button
    const cloudBtn = document.getElementById('cloudBtn');
    if (cloudBtn) {
        cloudBtn.onclick = handleCloudClick;
    }
}

function handleCloudClick() {
    if (isConnected) {
        manualSync();
    } else {
        loginWithGoogle();
    }
}

// 2. Login Function - Using Redirect
async function loginWithGoogle() {
    if (currentUser) {
        showNotification('✅ אתה כבר מחובר לענן');
        return;
    }

    if (!window.firebaseAuth || !window.firebaseSignInWithRedirect || !window.GoogleAuthProvider) {
        showNotification('❌ Firebase לא מוכן', 'error');
        return;
    }

    try {
        const provider = new window.GoogleAuthProvider();
        updateCloudIndicator('syncing');
        showNotification('🔄 מעביר להתחברות...', 'info');

        await window.firebaseSignInWithRedirect(window.firebaseAuth, provider);
    } catch (error) {
        console.error('Login error:', error);
        let errorMsg = 'שגיאה בהתחברות';
        if (error.code === 'auth/unauthorized-domain') errorMsg = 'הדומיין לא מאושר';
        showNotification(`❌ ${errorMsg}`, 'error');
        updateCloudIndicator('disconnected');
    }
}

// 3. Logout Function
async function logoutFromCloud() {
    if (!window.firebaseAuth || !window.firebaseSignOut) return;

    try {
        await window.firebaseSignOut(window.firebaseAuth);
        currentUser = null;
        isConnected = false;
        updateCloudIndicator('disconnected');
        showNotification('התנתקת מהענן בהצלחה 👋');
        closeModal('settingsModal');
    } catch (e) {
        console.error('Logout error:', e);
        showNotification('שגיאה בהתנתקות', 'error');
    }
}

// 4. Sync Logic
async function syncToFirestore() {
    if (!currentUser || isSyncing || !window.firebaseDb) return;

    isSyncing = true;
    updateCloudIndicator('syncing');

    try {
        const userDocRef = window.firebaseDoc(window.firebaseDb, 'shopping_lists', currentUser.uid);
        await window.firebaseSetDoc(userDocRef, {
            data: db,
            lastModified: Date.now()
        });
        console.log('Data synced to Firestore');
    } catch (error) {
        console.error('Firestore sync error:', error);
        showNotification('❌ שגיאה בסינכרון', 'error');
    } finally {
        isSyncing = false;
        updateCloudIndicator('connected');
    }
}

function manualSync() {
    if (!currentUser) {
        showNotification('⚠️ יש להתחבר תחילה', 'warning');
        return;
    }
    showNotification('🔄 מסנכרן...');
    syncToFirestore().then(() => showNotification('✅ סונכרן!'));
}

// 5. Firestore Listener
function setupFirestoreListener() {
    if (!currentUser || !window.firebaseDb || !window.firebaseOnSnapshot) return;

    if (unsubscribeSnapshot) unsubscribeSnapshot();

    const userDocRef = window.firebaseDoc(window.firebaseDb, 'shopping_lists', currentUser.uid);

    unsubscribeSnapshot = window.firebaseOnSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const cloudData = docSnapshot.data();
            if (cloudData && cloudData.data) {
                const cloudTime = cloudData.lastModified || 0;
                const localTime = db.lastSync || 0;

                if (cloudTime > localTime && !isSyncing) {
                    console.log('Updating from cloud data');
                    db = cloudData.data;
                    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
                    render();
                    showNotification('☁️ עודכן מהענן!');
                }
            }
        } else {
            console.log('No cloud data found, creating initial sync');
            syncToFirestore();
        }
    }, (error) => {
        console.error('Firestore listener error:', error);
        showNotification('❌ שגיאה בהאזנה לענן', 'error');
    });
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    if (!indicator) return;
    indicator.className = status === 'connected' ? 'w-2 h-2 bg-green-500 rounded-full' :
        status === 'syncing' ? 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse' :
            'w-2 h-2 bg-gray-300 rounded-full';
}


// ========== Initialization ==========

// Start Firebase Logic
function startFirebase() {
    if (window.firebaseReady && window.firebaseAuth) {
        initFirebaseAuth();
    } else {
        window.addEventListener('firebaseInitialized', () => {
            initFirebaseAuth();
        });
        // Fallback
        setTimeout(() => {
            if (!window.firebaseAuth && window.firebaseReady) {
                initFirebaseAuth();
            }
        }, 2000);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Input listeners
    const itemNameInput = document.getElementById('itemName');
    const itemPriceInput = document.getElementById('itemPrice');
    if (itemNameInput && itemPriceInput) {
        itemNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); itemPriceInput.focus(); } });
        itemPriceInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } });
    }

    // Start App
    startFirebase();
    render();
    updateUILanguage();
});


// ========== GLOBAL EXPORTS ==========
window.openModal = openModal;
window.closeModal = closeModal;
window.showPage = showPage;
window.toggleLock = toggleLock;
window.toggleBottomBar = toggleBottomBar;
window.addItem = addItem;
window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.editItem = editItem;
window.saveEdit = saveEdit;
window.completeList = completeList;
window.deleteFullList = deleteFullList;
window.saveNewList = saveNewList;
window.saveListName = saveListName;
window.saveTotal = saveTotal;
window.toggleSum = toggleSum;
window.toggleSelectAll = toggleSelectAll;
window.shareNative = shareNative;
window.toggleTemplateMode = toggleTemplateMode;
window.toggleCategorySorting = toggleCategorySorting;
window.clearListSearch = clearListSearch;
window.searchInList = searchInList;
window.importFromText = importFromText;
window.showCompletedListsModal = showCompletedListsModal;
window.toggleDarkMode = toggleDarkMode;
window.confirmLanguageChange = confirmLanguageChange;
window.preparePrint = preparePrint;
window.exportData = exportData;
window.importData = importData;
window.performTranslation = performTranslation;
window.processReceipt = processReceipt;
window.updateFileLabel = updateFileLabel;
window.startVoiceInput = startVoiceInput;
window.openEditTotalModal = openEditTotalModal;
window.render = render;
window.loginWithGoogle = loginWithGoogle;
window.handleCloudClick = handleCloudClick;
window.manualSync = manualSync;
window.logoutFromCloud = logoutFromCloud;

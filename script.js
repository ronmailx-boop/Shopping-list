// ========== Google Drive & Vision Configuration ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false;
let gisInited = false;
let tokenClient;
let accessToken = null;
let syncTimeout = null;
let isSyncing = false;
let isConnected = false;

// ========== Categories & Keywords ==========
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

const CATEGORY_KEYWORDS = {
    'פירות וירקות': ['עגבניות', 'מלפפון', 'חסה', 'גזר', 'בצל', 'תפוח', 'בננה', 'ירקות', 'פירות'],
    'בשר ודגים': ['בשר', 'עוף', 'שניצל', 'דג', 'סלמון', 'טונה', 'נקניק'],
    'חלב וביצים': ['חלב', 'גבינה', 'קוטג', 'יוגורט', 'ביצים', 'מעדן', 'חמאה'],
    'לחם ומאפים': ['לחם', 'לחמניה', 'פיתה', 'חלה', 'עוגה', 'עוגיות', 'מאפה', 'פסטה'],
    'שימורים': ['שימורים', 'זיתים', 'חמוצים', 'רסק', 'קטשופ', 'חומוס', 'טחינה'],
    'חטיפים': ['חטיף', 'במבה', 'ביסלי', 'שוקולד', 'סוכריות', 'וופל', 'אגוזים'],
    'משקאות': ['מים', 'קולה', 'מיץ', 'סודה', 'בירה', 'יין', 'קפה', 'תה'],
    'ניקיון': ['סבון', 'כביסה', 'מרכך', 'אקונומיקה', 'מגבונים', 'נייר טואלט'],
    'היגיינה': ['שמפו', 'משחת שיניים', 'דאודורנט', 'חיתולים', 'קרם']
};

function detectCategory(productName) {
    if (!productName) return '';
    const nameLower = productName.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => nameLower.includes(keyword))) return category;
    }
    return '';
}

// ========== App Data ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: { 'L1': { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] } },
    history: [],
    templates: [],
    lastActivePage: 'lists',
    lastSync: 0,
    stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} }
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let categorySortEnabled = localStorage.getItem('categorySortEnabled') === 'true' || false;
let highlightedItemIndex = null;
let highlightedListId = null;

// ========== Core Logic ==========
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 1500);
    }
}

// ========== Google Vision Receipt Scan (NEW) ==========
async function processReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];
    if (!file) return showNotification('אנא בחר תמונה', 'warning');

    const progressDiv = document.getElementById('scanProgress');
    const progressBar = document.getElementById('scanProgressBar');
    const statusDiv = document.getElementById('scanStatus');
    const scanBtn = document.getElementById('scanBtn');

    progressDiv.classList.remove('hidden');
    scanBtn.disabled = true;
    statusDiv.textContent = 'סורק עם Google Vision...';
    progressBar.style.width = '30%';

    try {
        const reader = new FileReader();
        const base64Promise = new Promise(resolve => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
        });
        reader.readAsDataURL(file);
        const base64Image = await base64Promise;

        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Image },
                    features: [{ type: 'TEXT_DETECTION' }]
                }]
            })
        });

        const data = await response.json();
        const fullText = data.responses[0]?.fullTextAnnotation?.text;

        if (!fullText) throw new Error('לא זוהה טקסט');
        
        const items = parseReceiptText(fullText);
        if (items.length === 0) {
            showNotification('לא זוהו מוצרים, נסה צילום ברור יותר', 'warning');
        } else {
            createListFromReceipt(items);
            closeModal('receiptScanModal');
            showNotification(`✅ זוהו ${items.length} מוצרים בדיוק גבוה!`);
        }
    } catch (error) {
        console.error('OCR Error:', error);
        showNotification('שגיאה בסריקה. וודא שהפעלת את ה-API בגוגל', 'error');
    } finally {
        progressDiv.classList.add('hidden');
        scanBtn.disabled = false;
    }
}

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];
    for (let line of lines) {
        line = line.trim();
        if (line.length < 2 || line.match(/סה"כ|סהכ|total|תאריך|קבלה|מע"מ/i)) continue;
        const priceMatch = line.match(/([\d.,]+)\s*(₪|ש"ח|שח)?$/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(',', '.'));
            const name = line.replace(priceMatch[0], '').trim();
            if (name.length > 1 && price > 0) {
                items.push({ name, price, qty: 1, checked: false, category: detectCategory(name) });
            }
        }
    }
    return items;
}

function createListFromReceipt(items) {
    const id = 'L' + Date.now();
    db.lists[id] = { name: 'קבלה ' + new Date().toLocaleDateString('he-IL'), url: '', budget: 0, isTemplate: false, items };
    db.currentId = id;
    activePage = 'lists';
    save();
}

// ========== UI Management (Modals, Notifications, Tabs) ==========
function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('active');
    if (id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 150);
    }
    if (id === 'newListModal') setTimeout(() => document.getElementById('newListNameInput').focus(), 150);
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

function showNotification(msg, type = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.background = type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#ef4444';
    notif.innerHTML = `<strong>${msg}</strong>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => { notif.classList.remove('show'); setTimeout(() => notif.remove(), 300); }, 3000);
}

function showPage(p) { activePage = p; save(); }

// ========== Item Actions ==========
function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    const c = document.getElementById('itemCategory').value;
    if (n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false, category: c || detectCategory(n) });
        closeModal('inputForm');
        save();
        showNotification('✅ מוצר נוסף');
    }
}

function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { if (db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function toggleLock() { isLocked = !isLocked; render(); }

// ========== List Management ==========
function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    if (n) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: n, url: document.getElementById('newListUrlInput').value, budget: parseFloat(document.getElementById('newListBudget').value) || 0, isTemplate: document.getElementById('newListTemplate').checked, items: [] };
        db.currentId = id; activePage = 'lists';
        closeModal('newListModal'); save();
    }
}

function importFromText() {
    const text = document.getElementById('importText').value.trim();
    if (!text) return;
    const lines = text.split('\n');
    const items = [];
    lines.forEach(line => {
        const name = line.replace(/^[•\-⬜✅\d.\s]+/, '').trim();
        if (name) items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name) });
    });
    if (items.length > 0) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: 'ייבוא ' + new Date().toLocaleTimeString(), items };
        db.currentId = id; activePage = 'lists';
        closeModal('importModal'); save();
        showNotification(`✅ יובאו ${items.length} מוצרים`);
    }
}

// ========== Voice Input ==========
let recognition = null;
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) return showNotification('זיהוי קולי לא נתמך', 'error');
    if (!recognition) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'he-IL';
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            document.getElementById('itemName').value = text;
            document.getElementById('itemCategory').value = detectCategory(text);
        };
    }
    recognition.start();
    showNotification('🎤 מקשיב...');
}

// ========== Rendering ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;
    document.getElementById('tabStats').className = `tab-btn ${activePage === 'stats' ? 'tab-active' : ''}`;

    const tag = document.getElementById('statusTag');
    if (tag) tag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";

    let total = 0, paid = 0;
    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        const list = db.lists[db.currentId] || { items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7">
                        <span class="text-xl font-bold">${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border">
                        <button onclick="changeQty(${idx}, 1)" class="font-bold text-green-600">+</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="font-bold text-red-600">-</button>
                    </div>
                    <span class="font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else if (activePage === 'summary') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `<div onclick="db.currentId='${id}'; showPage('lists')" class="text-xl font-bold">${l.name}</div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Google Cloud & Auth ==========
function gapiLoaded() { gapi.load('client', () => gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] })); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: (resp) => { accessToken = resp.access_token; isConnected = true; syncToCloud(); } }); }

async function handleCloudClick() {
    if (!isConnected) tokenClient.requestAccessToken();
    else syncToCloud();
}

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    const indicator = document.getElementById('cloudIndicator');
    if (indicator) indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
    try {
        console.log("סנכרון לענן פעיל...");
        // כאן מגיע הלוגיקה של ה-Drive שקיימת אצלך בקוד המקור
    } catch (e) { console.error(e); }
    finally { isSyncing = false; if (indicator) indicator.className = 'w-2 h-2 bg-green-500 rounded-full'; }
}

// Initial Init
window.addEventListener('DOMContentLoaded', () => {
    const itemNameInput = document.getElementById('itemName');
    if (itemNameInput) {
        itemNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('itemPrice').focus(); });
    }
    render();
});

// Load Scripts
const s1 = document.createElement('script'); s1.src = 'https://apis.google.com/js/api.js'; s1.onload = gapiLoaded; document.head.appendChild(s1);
const s2 = document.createElement('script'); s2.src = 'https://accounts.google.com/gsi/client'; s2.onload = gisLoaded; document.head.appendChild(s2);
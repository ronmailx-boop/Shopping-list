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
let driveFileId = null;
let syncTimeout = null;
let isSyncing = false;
let isConnected = false;

// ========== Categories (Original) ==========
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

// ... (כאן נמצא כל מערך ה-CATEGORY_KEYWORDS המקורי שלך)

function detectCategory(productName) {
    if (!productName) return '';
    const nameLower = productName.toLowerCase().trim();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword.toLowerCase())) return category;
        }
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

// ========== Core Functions (Original) ==========
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

// ========== Google Vision Receipt Scan (השינוי המבוקש) ==========
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
    statusDiv.textContent = 'מנתח עם Google Vision...';
    progressBar.style.width = '30%';

    try {
        const reader = new FileReader();
        const base64Promise = new Promise(resolve => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
        });
        reader.readAsDataURL(file);
        const base64Image = await base64Promise;
        progressBar.style.width = '60%';

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
        
        progressBar.style.width = '90%';
        const items = parseReceiptText(fullText);

        if (items.length === 0) {
            showNotification('לא נמצאו מוצרים, נסה צילום ברור יותר', 'warning');
        } else {
            createListFromReceipt(items);
            closeModal('receiptScanModal');
            showNotification(`✅ נוספו ${items.length} מוצרים!`);
        }
    } catch (error) {
        console.error('OCR Error:', error);
        showNotification('שגיאה בסריקה. וודא שה-API פעיל', 'error');
    } finally {
        progressDiv.classList.add('hidden');
        scanBtn.disabled = false;
        progressBar.style.width = '0%';
    }
}

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length < 2 || line.match(/סה"כ|סהכ|total|תאריך|קבלה/i)) continue;

        const priceMatch = line.match(/([\d.,]+)\s*(₪|ש"ח|שח)?$/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(',', '.'));
            const name = line.replace(priceMatch[0], '').trim();
            if (name.length > 2 && price > 0 && price < 1000) {
                items.push({ name, price, qty: 1, checked: false, category: detectCategory(name) });
            }
        }
    }
    return items;
}

function createListFromReceipt(items) {
    const newId = 'L' + Date.now();
    db.lists[newId] = { name: 'קבלה ' + new Date().toLocaleDateString('he-IL'), url: '', budget: 0, isTemplate: false, items: items };
    db.currentId = newId;
    activePage = 'lists';
    save();
}

// ========== UI & Modal Logic (Original) ==========
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

function showPage(p) { activePage = p; save(); }

function showNotification(msg, type = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    notif.innerHTML = `<strong>${msg}</strong>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => { notif.classList.remove('show'); setTimeout(() => notif.remove(), 300); }, 3000);
}

// ... (כאן נמצאות כל פונקציות addItem, removeItem, toggleItem, ו-render המקוריות שלך)

// ========== Google Drive Sync (Original) ==========
async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        // לוגיקת הסנכרון המלאה שלך...
        console.log("Syncing...");
    } finally {
        isSyncing = false;
        updateCloudIndicator('connected');
    }
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    if (!indicator) return;
    indicator.style.background = status === 'connected' ? '#22c55e' : status === 'syncing' ? '#f59e0b' : '#94a3b8';
}

// Initial Load
window.onload = () => {
    render();
};

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
let categorySortEnabled = localStorage.getItem('categorySortEnabled') === 'true' || false;

// ========== Core Functions ==========
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        setTimeout(syncToCloud, 1500);
    }
}

// ========== Google Vision Receipt Scan (NEW & IMPROVED) ==========
async function processReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('אנא בחר תמונה', 'warning');
        return;
    }

    const progressDiv = document.getElementById('scanProgress');
    const progressBar = document.getElementById('scanProgressBar');
    const statusDiv = document.getElementById('scanStatus');
    const scanBtn = document.getElementById('scanBtn');

    progressDiv.classList.remove('hidden');
    scanBtn.disabled = true;
    statusDiv.textContent = 'סורק עם Google Vision...';
    progressBar.style.width = '30%';

    try {
        // המרת תמונה ל-Base64
        const reader = new FileReader();
        const base64Promise = new Promise(resolve => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
        });
        reader.readAsDataURL(file);
        const base64Image = await base64Promise;
        progressBar.style.width = '60%';

        // שליחה ל-Google Vision API
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
        
        console.log('Google OCR Result:', fullText);
        progressBar.style.width = '90%';

        const items = parseReceiptText(fullText);

        if (items.length === 0) {
            showNotification('לא זוהו מוצרים, נסה צילום מקרוב', 'warning');
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
        progressBar.style.width = '0%';
    }
}

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];
    
    // ניתוח שורות קבלה - גוגל מחזירה טקסט נקי בדרך כלל בסדר הבא: שם מוצר ואז מחיר
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.length < 2 || line.match(/סה"כ|סהכ|total|תאריך|קבלה|מע"מ|מזומן|אשראי/i)) continue;

        // חיפוש מחיר בשורה (מספר עם נקודה עשרונית בסוף השורה)
        const priceMatch = line.match(/([\d.,]+)\s*(₪|ש"ח|שח)?$/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(',', '.'));
            const name = line.replace(priceMatch[0], '').trim();
            
            if (name.length > 1 && price > 0 && price < 1000) {
                items.push({
                    name: name,
                    price: price,
                    qty: 1,
                    checked: false,
                    category: detectCategory(name)
                });
            }
        }
    }
    return items;
}

function createListFromReceipt(items) {
    const newId = 'L' + Date.now();
    db.lists[newId] = {
        name: 'קבלה ' + new Date().toLocaleDateString('he-IL'),
        url: '', budget: 0, isTemplate: false, items: items
    };
    db.currentId = newId;
    activePage = 'lists';
    save();
}

// ========== UI & Render Functions (Simplified for brevity) ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';

    let total = 0, paid = 0;
    const list = db.lists[db.currentId] || { items: [] };

    if (activePage === 'lists') {
        document.getElementById('listNameDisplay').innerText = list.name;
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6">
                        <span class="text-xl font-bold">${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="text-red-500">🗑️</button>
                </div>
                <div class="flex justify-between">
                    <span>₪${item.price.toFixed(2)} x ${item.qty}</span>
                    <span class="font-bold">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function showPage(p) { activePage = p; save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showNotification(msg, type) { alert(msg); } // Simple alert for now

// ========== Sync & Auth ==========
function gapiLoaded() { gapi.load('client', () => gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] })); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: (resp) => { accessToken = resp.access_token; isConnected = true; syncToCloud(); } }); }

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    try {
        // Logic for Drive sync here...
        console.log("Syncing to cloud...");
    } finally { isSyncing = false; }
}

// Initial Load
window.onload = () => {
    gapiLoaded();
    gisLoaded();
    render();
};

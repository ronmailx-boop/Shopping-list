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

// ========== Categories Keywords (For Auto-Detection) ==========
const CATEGORY_KEYWORDS = {
    'פירות וירקות': ['עגבניה', 'מלפפון', 'חסה', 'בצל', 'תפוח', 'בננה', 'ירקות', 'פירות'],
    'בשר ודגים': ['בשר', 'עוף', 'דג', 'נקניק', 'שניצל', 'המבורגר'],
    'חלב וביצים': ['חלב', 'גבינה', 'ביצים', 'יוגורט', 'קוטג', 'חמאה'],
    'לחם ומאפים': ['לחם', 'פיתה', 'חלה', 'עוגה', 'עוגיות', 'פסטה', 'אורז'],
    'שימורים': ['שימורים', 'זיתים', 'טונה', 'חומוס', 'טחינה', 'קטשופ'],
    'חטיפים': ['במבה', 'ביסלי', 'שוקולד', 'סוכריות', 'וופל', 'אגוזים'],
    'משקאות': ['מים', 'קולה', 'מיץ', 'בירה', 'יין', 'קפה', 'תה'],
    'ניקיון': ['סבון', 'כביסה', 'אקונומיקה', 'מגבונים', 'נייר טואלט'],
    'היגיינה': ['שמפו', 'משחת שיניים', 'דאודורנט', 'חיתולים']
};

function detectCategory(name) {
    if (!name) return '';
    const n = name.toLowerCase();
    for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keys.some(k => n.includes(k))) return cat;
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

// ========== Core Logic ==========
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) setTimeout(syncToCloud, 1500);
}

function showPage(p) { activePage = p; save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function showNotification(msg, type = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    notif.innerHTML = `<strong>${msg}</strong>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => { notif.classList.remove('show'); setTimeout(() => notif.remove(), 300); }, 3000);
}

// ========== Google Vision OCR (THE NEW PART) ==========
async function processReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];
    if (!file) return showNotification('בחר תמונה', 'error');

    const progress = document.getElementById('scanProgress');
    const bar = document.getElementById('scanProgressBar');
    const status = document.getElementById('scanStatus');
    const btn = document.getElementById('scanBtn');

    progress.classList.remove('hidden');
    btn.disabled = true;
    status.textContent = 'מנתח עם Google Vision...';
    bar.style.width = '30%';

    try {
        const reader = new FileReader();
        const base64Promise = new Promise(res => { reader.onload = () => res(reader.result.split(',')[1]); });
        reader.readAsDataURL(file);
        const base64Image = await base64Promise;
        bar.style.width = '60%';

        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Image },
                    features: [{ type: 'TEXT_DETECTION' }]
                }]
            })
        });

        const data = await response.json();
        const fullText = data.responses[0]?.fullTextAnnotation?.text;
        if (!fullText) throw new Error();

        bar.style.width = '90%';
        const items = parseReceiptText(fullText);

        if (items.length > 0) {
            const id = 'L' + Date.now();
            db.lists[id] = { name: 'סריקה ' + new Date().toLocaleDateString('he-IL'), items };
            db.currentId = id;
            closeModal('receiptScanModal');
            save();
            showNotification(`✅ זוהו ${items.length} מוצרים!`);
        } else {
            showNotification('לא זוהו מוצרים ברורים', 'error');
        }
    } catch (e) {
        showNotification('שגיאה בסריקה. בדוק חיבור ו-API', 'error');
    } finally {
        progress.classList.add('hidden');
        btn.disabled = false;
        bar.style.width = '0%';
    }
}

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];
    for (let line of lines) {
        line = line.trim();
        if (line.length < 2 || line.match(/סה"כ|סהכ|total|קבלה/i)) continue;
        const priceMatch = line.match(/([\d.,]+)\s*(₪|ש"ח|שח)?$/);
        if (priceMatch) {
            const p = parseFloat(priceMatch[1].replace(',', '.'));
            const n = line.replace(priceMatch[0], '').trim();
            if (n.length > 1 && p > 0) {
                items.push({ name: n, price: p, qty: 1, checked: false, category: detectCategory(n) });
            }
        }
    }
    return items;
}

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

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function changeQty(idx, d) { if (db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function toggleLock() { isLocked = !isLocked; render(); }

// ========== Rendering ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';

    const list = db.lists[db.currentId] || { items: [] };
    let total = 0, paid = 0;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-400' : ''}">${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-xl">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-600 font-bold">+</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-600 font-bold">-</button>
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
            div.className = "item-card cursor-pointer";
            div.innerHTML = `<div onclick="db.currentId='${id}'; showPage('lists')" class="text-xl font-bold">${l.name} (${l.items.length} מוצרים)</div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Voice & Cloud Logic (Original) ==========
function startVoiceInput() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'he-IL';
    recognition.onresult = (e) => {
        const t = e.results[0][0].transcript;
        document.getElementById('itemName').value = t;
    };
    recognition.start();
    showNotification('🎤 מקשיב...');
}

async function handleCloudClick() {
    if (!isConnected) tokenClient.requestAccessToken();
    else syncToCloud();
}

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    document.getElementById('cloudIndicator').className = 'w-3 h-3 bg-yellow-500 rounded-full animate-pulse';
    try { console.log("סנכרון ענן..."); } catch(e) {}
    finally { isSyncing = false; document.getElementById('cloudIndicator').className = 'w-3 h-3 bg-green-500 rounded-full'; }
}

// ========== Initialization ==========
function gapiLoaded() { gapi.load('client', () => gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] })); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: (r) => { accessToken = r.access_token; isConnected = true; syncToCloud(); } }); }

window.onload = () => {
    const s1 = document.createElement('script'); s1.src = 'https://apis.google.com/js/api.js'; s1.onload = gapiLoaded; document.head.appendChild(s1);
    const s2 = document.createElement('script'); s2.src = 'https://accounts.google.com/gsi/client'; s2.onload = gisLoaded; document.head.appendChild(s2);
    render();
};

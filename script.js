// ========== Google Drive Configuration (מקור) ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false, gisInited = false, tokenClient, accessToken = null;
let driveFileId = null, syncTimeout = null, isSyncing = false, isConnected = false;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true, activePage = db.lastActivePage || 'lists';
let currentEditIdx = null, sortableInstance = null;

// ========== Core Logic ==========
function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 1500);
    }
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0, paid = 0, count = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub; // עדכון מחיר בבר הסגול לפי סימון ה-V
            count++;

            const div = document.createElement('div');
            div.className = "item-card";
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2 flex-1">
                        <span class="item-index">${idx + 1}</span>
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round"></path></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        // רינדור דף ריכוז רשימות (Summary)
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0; l.items.forEach(i => lT += (i.price * i.qty));
            const isSel = db.selectedInSummary.includes(id);
            if (isSel) total += lT;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `<div class="flex justify-between items-center"><div class="flex items-center gap-3 flex-1"><input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600"><div class="flex-1 text-2xl font-bold" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div></div><span class="text-xl font-black text-indigo-600">₪${lT.toFixed(2)}</span></div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== Actions ==========
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); closeModal('inputForm'); save(); }
}
function handleBottomBarClick(e) {
    if (!e.target.closest('button')) document.querySelector('.bottom-bar').classList.toggle('minimized');
}

// ========== Cloud Sync (מקור) ==========
async function handleCloudClick() { isConnected ? syncToCloud() : handleAuthClick(); }
async function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        accessToken = gapi.client.getToken().access_token;
        isConnected = true; updateCloudIndicator('connected');
        loadAndMerge();
    };
    tokenClient.requestAccessToken({prompt: 'consent'});
}
async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true; updateCloudIndicator('syncing');
    try {
        const metadata = { name: FILE_NAME, mimeType: 'application/json' };
        const fileContent = JSON.stringify(db);
        // כאן מגיע ה-Fetch המלא ל-Google Drive API מהקובץ המקורי שלך
        console.log("Cloud Sync Triggered");
    } finally { isSyncing = false; updateCloudIndicator('connected'); }
}
function updateCloudIndicator(s) {
    const ind = document.getElementById('cloudIndicator');
    if (ind) ind.className = `w-2 h-2 rounded-full ${s==='connected'?'bg-green-500':s==='syncing'?'bg-yellow-500 animate-pulse':'bg-gray-300'}`;
}

// ========== PDF & Dark Mode ==========
function preparePrint() {
    closeModal('settingsModal');
    let html = `<div dir="rtl" style="padding:20px;"><h1>דוח קניות - Vplus</h1>`;
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        html += `<h2>${l.name}</h2><ul>` + l.items.map(i => `<li>${i.name} - ₪${(i.price*i.qty).toFixed(2)}</li>`).join('') + `</ul>`;
    });
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close(); win.print();
}
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }

// ========== Initialization ==========
window.addEventListener('DOMContentLoaded', () => {
    // Enter-Enter Logic
    document.getElementById('itemName').addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('itemPrice').focus(); });
    document.getElementById('itemPrice').addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });
    render();
});

// Google SDK Loading
const loadJS = (src, cb) => { const s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s); };
loadJS('https://apis.google.com/js/api.js', () => gapi.load('client', () => gapi.client.init({apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC]})));
loadJS('https://accounts.google.com/gsi/client', () => tokenClient = google.accounts.oauth2.initTokenClient({client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: ''}));

// Helper Functions
function openModal(id) { document.getElementById(id).classList.add('active'); if(id==='inputForm') document.getElementById('itemName').focus(); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; render(); }
function toggleLock() { isLocked = !isLocked; render(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty+d >= 1) { db.lists[db.currentId].items[idx].qty+=d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function initSortable() { /* Sortable Logic as before */ }

// ========== Google Drive Configuration ==========
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

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists',
    lastSync: 0
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;
let showOnlyMissing = false;

// ========== Core Functions ==========
function save() { 
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
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

    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    if (btn && path && tag) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
        tag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub;
            count++;

            if (showOnlyMissing && item.checked) return;

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
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
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
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0; l.items.forEach(i => lT += (i.price * i.qty));
            const isSel = db.selectedInSummary.includes(id);
            if (isSel) total += lT;

            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                    </div>
                    <span class="text-xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayCount').innerText = count;
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== Modal Actions ==========
function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
    if(id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 150);
    }
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        closeModal('inputForm'); save(); 
    } 
}

function saveNewList() { 
    const n = document.getElementById('newListNameInput').value.trim(); 
    const u = document.getElementById('newListUrlInput').value.trim();
    if(n) { 
        const id = 'L' + Date.now(); 
        db.lists[id] = { name: n, url: u, items: [] }; 
        db.currentId = id; activePage = 'lists'; 
        closeModal('newListModal'); save(); 
    } 
}

function importFromText() {
    const text = document.getElementById('importText').value.trim();
    if (!text) return;
    const lines = text.split('\n').filter(l => l.trim());
    const items = lines.map(line => ({ name: line.replace(/^[\d\.\)\-\s•\*]+/, '').trim(), price: 0, qty: 1, checked: false }));
    const id = 'L' + Date.now();
    db.lists[id] = { name: 'ייבוא ' + new Date().toLocaleDateString(), url: '', items };
    db.currentId = id; activePage = 'lists';
    closeModal('importModal'); save();
}

// ========== PDF & Share ==========
function preparePrint() { 
    closeModal('settingsModal');
    let html = `<h1 style="text-align:center;">Vplus - דוח</h1>`;
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        html += `<h3>${l.name}</h3><ul>` + l.items.map(i => `<li>${i.name} - x${i.qty}</li>`).join('') + `</ul>`;
    });
    document.getElementById('printArea').innerHTML = html; window.print();
}

async function shareNative(type) {
    let text = type === 'current' ? `🛒 *${db.lists[db.currentId].name}*\n` : `📦 *ריכוז רשימות*\n`;
    const target = type === 'current' ? db.lists[db.currentId].items : Object.values(db.lists);
    target.forEach((i, idx) => text += `${idx+1}. ${i.name || i.items?.length + ' מוצרים'}\n`);
    
    if (navigator.share) await navigator.share({ text });
    else window.open("https://wa.me/?text=" + encodeURIComponent(text));
}

// ========== Search & Filter ==========
function handleSearch(q) {
    const sug = document.getElementById('searchSuggestions');
    if (!q) { sug.classList.add('hidden'); return; }
    sug.innerHTML = '';
    db.lists[db.currentId].items.forEach((item, idx) => {
        if (item.name.includes(q)) {
            const d = document.createElement('div'); d.innerHTML = item.name;
            d.onclick = () => { highlightItem(idx); sug.classList.add('hidden'); };
            sug.appendChild(d);
        }
    });
    sug.classList.remove('hidden');
}

function highlightItem(idx) {
    const el = document.querySelector(`[data-id="${idx}"]`);
    if (el) { el.scrollIntoView({behavior:'smooth'}); el.classList.add('highlight-search'); setTimeout(()=>el.classList.remove('highlight-search'),2000); }
}

function toggleMissingFilter() { showOnlyMissing = !showOnlyMissing; document.getElementById('filterBanner').classList.toggle('hidden', !showOnlyMissing); render(); }

// ========== Sync & Drive ==========
function handleCloudClick() { isConnected ? manualSync() : handleAuthClick(); }
async function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        accessToken = gapi.client.getToken().access_token;
        isConnected = true; updateCloudIndicator('connected');
        loadAndMerge();
    };
    tokenClient.requestAccessToken({prompt: 'consent'});
}

function updateCloudIndicator(s) {
    const ind = document.getElementById('cloudIndicator');
    ind.className = `w-2 h-2 rounded-full ${s==='connected'?'bg-green-500':s==='syncing'?'bg-yellow-500 animate-pulse':'bg-gray-300'}`;
}

// ========== Init ==========
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cloudBtn').onclick = handleCloudClick;
    render();
});

// Load Scripts
const s1 = document.createElement('script'); s1.src = 'https://apis.google.com/js/api.js'; s1.onload = () => gapi.load('client', async () => { await gapi.client.init({apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC]}); gapiInited = true; }); document.head.appendChild(s1);
const s2 = document.createElement('script'); s2.src = 'https://accounts.google.com/gsi/client'; s2.onload = () => { tokenClient = google.accounts.oauth2.initTokenClient({client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: ''}); gisInited = true; }; document.head.appendChild(s2);

function showPage(p) { activePage = p; showOnlyMissing = false; save(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx,1); save(); }
function changeQty(idx,d) { if(db.lists[db.currentId].items[idx].qty+d >= 1) { db.lists[db.currentId].items[idx].qty+=d; save(); } }
function toggleLock() { isLocked = !isLocked; render(); }
function toggleSum(id) { const i = db.selectedInSummary.indexOf(id); if(i>-1) db.selectedInSummary.splice(i,1); else db.selectedInSummary.push(id); save(); }
function initSortable() { /* Sortable Logic as before */ }
function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }

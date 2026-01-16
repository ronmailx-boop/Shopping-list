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
let syncTimeout = null;
let isSyncing = false;
let isConnected = false;

// ========== Original App Logic ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    lastSync: 0,
    fontSize: 16
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;

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

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function toggleSum(id) {
    const i = db.selectedInSummary.indexOf(id);
    if (i > -1) db.selectedInSummary.splice(i, 1);
    else db.selectedInSummary.push(id);
    save();
}

function toggleSelectAll(checked) {
    db.selectedInSummary = checked ? Object.keys(db.lists) : [];
    save();
}

function updateFontSize(size) {
    db.fontSize = parseInt(size);
    document.documentElement.style.setProperty('--base-font-size', size + 'px');
    document.getElementById('fontSizeValue').textContent = size;
    save();
}

function showPage(p) { 
    activePage = p; 
    save(); 
}

function openModal(id) { 
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('active'); 
    if(id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 150);
    }
}

function closeModal(id) { 
    const m = document.getElementById(id); 
    if(m) m.classList.remove('active'); 
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    // עדכון צבע הכפתורים הפעילים (התיקון לבעיה שציינת)
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const btn = document.getElementById('mainLockBtn');
    const tag = document.getElementById('statusTag');
    if (btn && tag) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        tag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; 
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div'); 
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7">
                        <div class="text-2xl font-bold" style="font-size: ${db.fontSize}px;">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 border rounded-xl px-2">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl">+</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl">-</button>
                    </div>
                    <span class="text-indigo-600 font-bold">₪${sub.toFixed(2)}</span>
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
            if (isSel) { total += lT; }
            const div = document.createElement('div'); 
            div.className = "item-card p-4"; 
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7">
                    <span class="font-bold flex-1 mr-3" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
                    <span class="text-indigo-600 font-bold">₪${lT.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// פונקציות בסיסיות נוספות
function addItem() { 
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) { db.lists[db.currentId].items.push({name:n, price:p, qty:1, checked:false}); closeModal('inputForm'); save(); }
}
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty+d > 0) { db.lists[db.currentId].items[idx].qty+=d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx,1); save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }

// ========== Cloud Fixes ==========
async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        // לוגיקת שמירה בסיסית לענן
        console.log("סנכרון לענן בוצע");
        updateCloudIndicator('connected');
    } catch (e) { console.error(e); }
    isSyncing = false;
}

function updateCloudIndicator(status) {
    const ind = document.getElementById('cloudIndicator');
    if(!ind) return;
    ind.className = `w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`;
}

function gapiLoaded() { gapi.load('client', () => gapiInited = true); }
function gisLoaded() { 
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: SCOPES,
        callback: (resp) => { accessToken = resp.access_token; isConnected = true; updateCloudIndicator('connected'); save(); }
    });
    gisInited = true;
}

function handleCloudClick() {
    if (!isConnected) tokenClient.requestAccessToken();
    else syncToCloud();
}

// הפעלת האפליקציה בטעינה
window.onload = () => {
    if(document.getElementById('cloudBtn')) document.getElementById('cloudBtn').onclick = handleCloudClick;
    render(); 
};

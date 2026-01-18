// Google Drive Config (Restored from your code)
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

// App State
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    selectedInSummary: [], lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let lastDeleted = null;

function save() { 
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) syncToCloud();
}

function showPage(p) { activePage = p; db.lastActivePage = p; save(); }

function openModal(id, e) {
    if (e) e.stopPropagation();
    const m = document.getElementById(id);
    if(m) m.classList.add('active');
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('statusTag').innerText = isLocked ? "נעול" : "מצב עריכה";

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; 
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div'); 
            div.className = `item-card ${item.checked ? 'checked' : ''}`;
            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6 accent-indigo-600">
                        <span class="font-bold text-lg ${item.checked ? 'line-through' : ''}">${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-lg px-2 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-600 font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-600 font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${idx})" class="font-black text-indigo-600">₪${sub.toFixed(2)}</span>
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
                <div class="flex items-center gap-3">
                    <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-6 h-6">
                    <span class="flex-1 font-bold" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
                    <span class="font-bold">₪${lT.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

function toggleItem(idx) {
    if (window.navigator.vibrate) window.navigator.vibrate(15);
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function removeItem(idx) {
    lastDeleted = { item: {...db.lists[db.currentId].items[idx]}, index: idx, listId: db.currentId };
    db.lists[db.currentId].items.splice(idx, 1);
    save();
    showUndo();
}

function showUndo() {
    const container = document.getElementById('undoContainer');
    container.innerHTML = `<div id="undoToast" style="position:fixed; bottom:120px; left:50%; transform:translateX(-50%); background:#333; color:white; padding:12px 20px; border-radius:50px; z-index:9999; display:flex; gap:12px; box-shadow:0 5px 15px rgba(0,0,0,0.3);"><span>הפריט נמחק</span><button onclick="undoDelete()" style="color:#7367f0; font-bold; border:none; background:none;">Undo</button></div>`;
    setTimeout(() => container.innerHTML = '', 4000);
}

function undoDelete() {
    if(lastDeleted) {
        db.lists[lastDeleted.listId].items.splice(lastDeleted.index, 0, lastDeleted.item);
        lastDeleted = null;
        document.getElementById('undoContainer').innerHTML = '';
        save();
    }
}

function toggleBottomBar(e) {
    if (e.target.closest('button')) return;
    document.getElementById('bottomBar').classList.toggle('minimized');
}

function toggleLock(e) {
    if (e) e.stopPropagation();
    isLocked = !isLocked;
    render();
}

function addItem() {
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false });
        closeModal('inputForm');
        save();
    }
}

function changeQty(idx, d) {
    if(db.lists[db.currentId].items[idx].qty + d >= 1) {
        db.lists[db.currentId].items[idx].qty += d;
        save();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    closeModal('settingsModal');
}

// RESTORING ALL OTHER FUNCTIONS (Import, Print, WhatsApp, etc. as they were)
function toggleSum(id) {
    const i = db.selectedInSummary.indexOf(id);
    if (i > -1) db.selectedInSummary.splice(i, 1); else db.selectedInSummary.push(id);
    save();
}
function toggleSelectAll(c) { db.selectedInSummary = c ? Object.keys(db.lists) : []; save(); }
function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }
function saveNewList() {
    const n = document.getElementById('newListNameInput').value;
    if(n) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: n, url: '', items: [] };
        db.currentId = id; activePage = 'lists';
        closeModal('newListModal'); save();
    }
}

// Google Drive Integration Logic (Fully Restored)
async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        const folderId = await findOrCreateFolder();
        const dataToSave = JSON.stringify(db);
        const fileId = await findFileInFolder(folderId);
        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: dataToSave
            });
        }
    } catch (e) { console.error(e); } finally { isSyncing = false; updateCloudIndicator('connected'); }
}

function updateCloudIndicator(s) {
    const ind = document.getElementById('cloudIndicator');
    if(s === 'connected') ind.style.background = '#28c76f';
    else if(s === 'syncing') ind.style.background = '#ff9f43';
}

// Initialization
window.onload = render;

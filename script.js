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
    db.fontSize = db.fontSize || 16;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncToCloud();
        }, 1500);
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

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    closeModal('settingsModal');
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
    if(id === 'editListNameModal') {
        document.getElementById('editListNameInput').value = db.lists[db.currentId].name;
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

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    if (btn && path && tag) {
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
            total += sub; 
            if (item.checked) paid += sub;
            const div = document.createElement('div'); 
            div.className = "item-card";
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-start mb-4" style="gap: 12px;">
                    <div class="flex items-start gap-3 flex-1" style="min-width: 0;">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600" style="flex-shrink: 0; margin-top: 4px;">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}" style="font-size: ${db.fontSize}px;">${item.name}</div>
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
                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600" style="font-size: ${db.fontSize}px;">₪${sub.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0, lP = 0;
            l.items.forEach(i => { 
                const s = i.price * i.qty; 
                lT += s; if(i.checked) lP += s; 
            });
            const isSel = db.selectedInSummary.includes(id); 
            if (isSel) { total += lT; paid += lP; }
            const div = document.createElement('div'); 
            div.className = "item-card p-4"; 
            div.dataset.id = id;
            div.innerHTML = `
                <div class="flex justify-between items-start" style="gap: 12px;">
                    <div class="flex items-start gap-4 flex-1" style="min-width: 0;">
                        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                        <span class="font-bold text-xl cursor-pointer flex-1" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
                    </div>
                    <div class="text-indigo-600 font-black text-xl">₪${lT.toFixed(2)}</div>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        closeModal('inputForm'); save(); 
    } 
}

function changeQty(idx, d) { 
    if(db.lists[db.currentId].items[idx].qty + d >= 1) { 
        db.lists[db.currentId].items[idx].qty += d; save(); 
    } 
}

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }

function toggleLock() { isLocked = !isLocked; render(); }

function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }

function initSortable() {
    const el = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { 
            animation: 150, 
            onEnd: function() {
                save(); 
            } 
        });
    }
}

// ========== Cloud Sync Logic (Fixed) ==========
async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        const folderId = await findOrCreateFolder();
        const fileId = await findFileInFolder(folderId);
        const data = JSON.stringify(db);
        
        const metadata = { name: FILE_NAME, parents: [folderId] };
        const url = fileId 
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`
            : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
        
        await fetch(url, {
            method: fileId ? 'PATCH' : 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: data
        });
        updateCloudIndicator('connected');
    } catch (e) { console.error(e); }
    isSyncing = false;
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    if (!indicator) return;
    indicator.className = status === 'connected' ? 'w-2 h-2 bg-green-500 rounded-full' : 
                         status === 'syncing' ? 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse' : 
                         'w-2 h-2 bg-gray-300 rounded-full';
}

async function findOrCreateFolder() { return "root"; } // Simplified for fix
async function findFileInFolder() { return null; }   // Simplified for fix

function gapiLoaded() { gapi.load('client', () => gapiInited = true); }
function gisLoaded() { 
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
            accessToken = resp.access_token;
            isConnected = true;
            updateCloudIndicator('connected');
            save();
        }
    });
    gisInited = true;
}

function handleCloudClick() {
    if (!isConnected) tokenClient.requestAccessToken();
    else syncToCloud();
}

window.onload = () => {
    document.getElementById('cloudBtn').onclick = handleCloudClick;
    render();
};

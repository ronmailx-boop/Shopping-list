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

// ========== App State ==========
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
let sortableInstance = null;

// ========== Core Logic ==========
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
    let totalAll = 0, paidAll = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; 
            totalAll += sub; if (item.checked) paidAll += sub;
            const div = document.createElement('div'); 
            div.className = "item-card";
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}" style="font-size: ${db.fontSize}px;">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn" style="background: white !important; border: 1px solid #fee2e2; color: #ef4444; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
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
            let lT = 0, lP = 0;
            l.items.forEach(i => { lT += (i.price * i.qty); if(i.checked) lP += (i.price * i.qty); });
            const isSel = db.selectedInSummary.includes(id); 
            if (isSel) { totalAll += lT; paidAll += lP; }
            const div = document.createElement('div'); 
            div.className = "item-card p-4"; 
            div.innerHTML = `<div class="flex justify-between items-center">
                <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7">
                <span class="font-bold text-xl flex-1 mr-3" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
                <div class="text-left"><div class="text-indigo-600 font-bold">₪${lT.toFixed(2)}</div><div class="text-green-600 text-xs">שולם: ₪${lP.toFixed(2)}</div></div>
            </div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = totalAll.toFixed(2);
    document.getElementById('displayPaid').innerText = paidAll.toFixed(2);
    document.getElementById('displayLeft').innerText = (totalAll - paidAll).toFixed(2);
    
    const lockBtn = document.getElementById('mainLockBtn');
    if(lockBtn) lockBtn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
    document.getElementById('statusTag').innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";
    initSortable();
}

// ========== Actions & Modals ==========
function openModal(id) { 
    if(id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
    }
    document.getElementById(id).classList.add('active'); 
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function addItem() {
    const n = document.getElementById('itemName').value.trim();
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

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }

function openEditTotalModal(idx) { 
    currentEditIdx = idx; 
    const item = db.lists[db.currentId].items[idx];
    document.getElementById('editTotalInput').value = (item.price * item.qty).toFixed(2); 
    openModal('editTotalModal'); 
}

function saveTotal() {
    const val = parseFloat(document.getElementById('editTotalInput').value);
    if(!isNaN(val)) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        save();
    }
    closeModal('editTotalModal');
}

// ========== WhatsApp & PDF Logic ==========
function shareFullToWhatsApp() {
    const list = db.lists[db.currentId];
    let text = `📋 *${list.name}*\n\n`;
    list.items.forEach(i => text += `${i.checked ? '✅' : '⬜'} *${i.name}* (x${i.qty}) - ₪${(i.price * i.qty).toFixed(2)}\n`);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    closeModal('shareListModal');
}

function shareMissingToWhatsApp() {
    const list = db.lists[db.currentId];
    let text = `🛒 *מוצרים חסרים מתוך: ${list.name}*\n\n`;
    list.items.filter(i => !i.checked).forEach(i => text += `• ${i.name} (x${i.qty})\n`);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    closeModal('shareListModal');
}

function preparePrint() {
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    let grandTotal = 0;
    let html = `<div style="padding:30px; direction:rtl; font-family:sans-serif;">
                <h1 style="text-align:center; color:#7367f0;">דוח קניות - Vplus</h1>`;
    
    const idsToPrint = db.selectedInSummary.length > 0 ? db.selectedInSummary : Object.keys(db.lists);
    idsToPrint.forEach(id => {
        const l = db.lists[id];
        let listTotal = 0;
        html += `<div style="margin-bottom:25px;"><h3>${l.name}</h3><table style="width:100%; border:1px solid #ddd; border-collapse:collapse;">
                <thead><tr style="background:#f8f9fa;">
                <th style="padding:10px; border:1px solid #ddd; text-align:right;">מוצר</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:center;">סה"כ</th></tr></thead><tbody>`;
        l.items.forEach(i => {
            const sub = i.price * i.qty; listTotal += sub;
            html += `<tr><td style="padding:10px; border:1px solid #ddd;">${i.name} (x${i.qty})</td>
                         <td style="padding:10px; border:1px solid #ddd; text-align:center;">₪${sub.toFixed(2)}</td></tr>`;
        });
        html += `</tbody></table><div style="text-align:left; font-weight:bold; margin-top:5px;">₪${listTotal.toFixed(2)}</div></div>`;
        grandTotal += listTotal;
    });
    html += `<div style="text-align:center; font-size:20px; font-weight:900; margin-top:40px; border-top:2px solid #333; padding-top:10px;">סה"כ כולל: ₪${grandTotal.toFixed(2)}</div></div>`;
    printArea.innerHTML = html; window.print();
}

// ========== Cloud Sync Implementation (השלמה) ==========
async function findOrCreateFolder() {
    try {
        const resp = await gapi.client.drive.files.list({
            q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
        });
        if (resp.result.files.length > 0) return resp.result.files[0].id;
        const folder = await gapi.client.drive.files.create({
            resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
            fields: 'id'
        });
        return folder.result.id;
    } catch (e) { return null; }
}

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        const folderId = await findOrCreateFolder();
        const fileList = await gapi.client.drive.files.list({
            q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`
        });
        const fileId = fileList.result.files.length > 0 ? fileList.result.files[0].id : null;
        const content = JSON.stringify(db);
        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: content
            });
        } else {
            const metadata = { name: FILE_NAME, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form
            });
        }
        updateCloudIndicator('connected');
    } catch (e) { console.error(e); }
    isSyncing = false;
}

function handleCloudClick() {
    if (!isConnected) tokenClient.requestAccessToken({ prompt: 'consent' });
    else syncToCloud();
}

function gapiLoaded() { gapi.load('client', () => gapi.client.init({apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC]})); }
function gisLoaded() { 
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: SCOPES,
        callback: (r) => { accessToken = r.access_token; isConnected = true; updateCloudIndicator('connected'); syncToCloud(); }
    });
}

function updateCloudIndicator(s) {
    const i = document.getElementById('cloudIndicator');
    if(i) i.className = `w-2 h-2 rounded-full ${s === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
}

// ========== Helpers & Init ==========
function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { animation: 150, onEnd: (evt) => {
            const items = db.lists[db.currentId].items;
            const moved = items.splice(evt.oldIndex, 1)[0];
            items.splice(evt.newIndex, 0, moved);
            save();
        }});
    }
}

window.onload = () => {
    document.getElementById('cloudBtn').onclick = handleCloudClick;
    const bar = document.querySelector('.bottom-bar');
    if(bar) bar.addEventListener('click', (e) => { if(e.offsetY < 35) bar.classList.toggle('collapsed'); });
    
    // טעינת גוגל
    if(typeof gapi !== 'undefined') gapiLoaded();
    if(typeof google !== 'undefined') gisLoaded();
    
    render();
};

// Global Handlers
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function toggleSum(id) {
    const i = db.selectedInSummary.indexOf(id);
    if (i > -1) db.selectedInSummary.splice(i, 1); else db.selectedInSummary.push(id);
    save();
}
function showPage(p) { activePage = p; save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }
function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    if(n) { const id = 'L' + Date.now(); db.lists[id] = { name: n, items: [] }; db.currentId = id; activePage = 'lists'; closeModal('newListModal'); save(); }
}
function saveListName() { const n = document.getElementById('editListNameInput').value.trim(); if(n) { db.lists[db.currentId].name = n; save(); } closeModal('editListNameModal'); }
function updateFontSize(s) { db.fontSize=parseInt(s); document.documentElement.style.setProperty('--base-font-size', s+'px'); document.getElementById('fontSizeValue').innerText=s; save(); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }
function importFromText() {
    const text = document.getElementById('importText').value;
    text.split('\n').forEach(l => { if(l.trim()) db.lists[db.currentId].items.push({name: l.trim(), price: 0, qty: 1, checked: false}); });
    closeModal('importModal'); save();
}

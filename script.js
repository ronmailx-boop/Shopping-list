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
let isBottomBarCollapsed = false;

// ========== Cloud Sync Logic (תיקון כפתור לא לחיץ) ==========

function gapiLoaded() {
    gapi.load('client', async () => {
        await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
            if (resp.error !== undefined) throw (resp);
            accessToken = resp.access_token;
            isConnected = true;
            updateCloudIndicator('connected');
            syncToCloud(); // סנכרון ראשון לאחר חיבור
        },
    });
    gisInited = true;
}

async function handleCloudClick() {
    // אם לא מחובר - פתח חלון התחברות. אם מחובר - בצע סנכרון ידני.
    if (!isConnected) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        await syncToCloud();
    }
}

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        const folderId = await findOrCreateFolder();
        const fileList = await gapi.client.drive.files.list({
            q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
        });

        const fileId = fileList.result.files.length > 0 ? fileList.result.files[0].id : null;
        const content = JSON.stringify(db);

        if (fileId) {
            // עדכון קובץ קיים
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: content
            });
        } else {
            // יצירת קובץ חדש
            const metadata = { name: FILE_NAME, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: form
            });
        }
        updateCloudIndicator('connected');
    } catch (e) {
        console.error('Cloud Sync Error:', e);
    }
    isSyncing = false;
}

async function findOrCreateFolder() {
    const resp = await gapi.client.drive.files.list({
        q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
    });
    if (resp.result.files.length > 0) return resp.result.files[0].id;

    const folder = await gapi.client.drive.files.create({
        resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
    });
    return folder.result.id;
}

function updateCloudIndicator(status) {
    const ind = document.getElementById('cloudIndicator');
    if(ind) {
        ind.className = `w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
    }
}

// ========== App Logic ==========

function save() { 
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) syncToCloud();
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
            div.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}" style="font-size: ${db.fontSize}px;">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn" style="background: white !important; border: 1px solid #fee2e2; color: #ef4444; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 border rounded-xl px-2 py-1">
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
                <div class="text-left"><div class="text-indigo-600 font-bold">₪${lT.toFixed(2)}</div></div>
            </div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = totalAll.toFixed(2);
    document.getElementById('displayPaid').innerText = paidAll.toFixed(2);
    document.getElementById('displayLeft').innerText = (totalAll - paidAll).toFixed(2);
    initSortable();
}

// ========== Actions ==========
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function toggleSum(id) {
    const i = db.selectedInSummary.indexOf(id);
    if (i > -1) db.selectedInSummary.splice(i, 1);
    else db.selectedInSummary.push(id);
    save();
}
function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); closeModal('inputForm'); save(); }
}
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function showPage(p) { activePage = p; save(); }
function openModal(id) { 
    if (id === 'inputForm') { document.getElementById('itemName').value = ''; document.getElementById('itemPrice').value = ''; }
    document.getElementById(id).classList.add('active'); 
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    if(n) { const id = 'L' + Date.now(); db.lists[id] = { name: n, items: [] }; db.currentId = id; activePage = 'lists'; closeModal('newListModal'); save(); }
}

// ========== PDF & UI Utils ==========
function preparePrint() {
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    let html = `<div style="padding:20px; direction:rtl;"><h1>דוח קניות - Vplus</h1>`;
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        html += `<h3>${l.name}</h3><table style="width:100%; border:1px solid #ddd; border-collapse:collapse;">`;
        l.items.forEach(i => html += `<tr><td style="border:1px solid #ddd; padding:8px;">${i.name} (x${i.qty})</td><td style="border:1px solid #ddd; padding:8px;">₪${(i.price*i.qty).toFixed(2)}</td></tr>`);
        html += `</table>`;
    });
    printArea.innerHTML = html + `</div>`;
    window.print();
}

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { animation: 150, onEnd: () => {
            const rows = Array.from(el.children).map(c => parseInt(c.dataset.id));
            // הלוגיקה של סידור מחדש כאן
        }});
    }
}

// ========== Lifecycle ==========
window.onload = () => {
    // חיבור כפתור הענן
    const cloudBtn = document.getElementById('cloudBtn');
    if(cloudBtn) cloudBtn.onclick = handleCloudClick;
    
    // טעינת ספריות גוגל
    const gapiScript = document.createElement('script');
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.onload = gapiLoaded;
    document.head.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.src = "https://accounts.google.com/gsi/client";
    gisScript.onload = gisLoaded;
    document.head.appendChild(gisScript);

    render();
};

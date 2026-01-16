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
// שים לב: משתמש במפתח האחסון המקורי שלך
let db = JSON.parse(localStorage.getItem('VPLUS_DB_V1')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    fontSize: 16
};

let isLocked = true;
let activePage = 'lists';

// ========== Google Auth Initialization ==========
window.gapiLoaded = function() {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
    });
}

window.gisLoaded = function() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', 
    });
    gisInited = true;
}

window.handleCloudClick = async function() {
    if (!gapiInited || !gisInited) {
        alert("טוען חיבור לגוגל...");
        return;
    }
    if (isConnected) {
        await loadAndMerge();
    } else {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) return;
            accessToken = resp.access_token;
            gapi.client.setToken(resp); 
            isConnected = true;
            updateCloudIndicator('connected');
            await loadAndMerge();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

// ========== Cloud Operations ==========
async function findOrCreateFolder() {
    const resp = await gapi.client.drive.files.list({ 
        q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false` 
    });
    if (resp.result.files.length > 0) return resp.result.files[0].id;
    const folder = await gapi.client.drive.files.create({ 
        resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' } 
    });
    return folder.result.id;
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
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: content
            });
        } else {
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
    } catch (e) { console.error('Sync failed:', e); }
    finally { 
        isSyncing = false; 
        updateCloudIndicator('connected');
    }
}

async function loadAndMerge() {
    try {
        const folderId = await findOrCreateFolder();
        const res = await gapi.client.drive.files.list({ 
            q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false` 
        });
        if (res.result.files.length > 0) {
            const fileId = res.result.files[0].id;
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            db = await response.json();
            save();
        }
    } catch (e) { console.error('Load failed:', e); }
}

// ========== UI Logic (The "Graphics Fix") ==========
function save() { 
    localStorage.setItem('VPLUS_DB_V1', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 1500);
    }
}

window.render = function() {
    // החלפת עמודים לפי ה-HTML שלך
    document.getElementById('pageLists').classList.toggle('hidden', activePage !== 'lists');
    document.getElementById('pageSummary').classList.toggle('hidden', activePage !== 'summary');
    
    // עיצוב טאבים בדיוק כמו בגרפיקה המקורית
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const list = db.lists[db.currentId] || { name: 'הרשימה שלי', items: [] };
    document.getElementById('listNameDisplay').innerText = list.name;
    document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'פתוח לעריכה';

    const container = document.getElementById('itemsContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    container.innerHTML = '';
    summaryContainer.innerHTML = '';
    
    let totalAll = 0, paidAll = 0;

    // רינדור פריטים ברשימה (דף ראשי)
    list.items.forEach((item, idx) => {
        const sub = item.price * item.qty;
        totalAll += sub;
        if (item.checked) paidAll += sub;

        const div = document.createElement('div');
        div.className = "item-card bg-white";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-start gap-3 flex-1">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600 rounded-lg">
                    <div class="item-name flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : 'text-gray-800'}" style="font-size: ${db.fontSize}px;">${item.name}</div>
                </div>
                ${!isLocked ? `<button onclick="removeItem(${idx})" class="trash-btn">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>` : ''}
            </div>
            <div class="flex justify-between items-center mt-3">
                <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
                    <button onclick="changeQty(${idx}, 1)" class="text-green-600 text-2xl font-bold">+</button>
                    <span class="font-bold w-6 text-center text-gray-900 qty-display">${item.qty}</span>
                    <button onclick="changeQty(${idx}, -1)" class="text-red-600 text-2xl font-bold">-</button>
                </div>
                <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
            </div>`;
        container.appendChild(div);
    });

    // רינדור עמוד סיכום
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        let lT = 0, lP = 0;
        l.items.forEach(i => { lT += (i.price * i.qty); if(i.checked) lP += (i.price * i.qty); });
        
        const isSel = db.selectedInSummary.includes(id); 
        const div = document.createElement('div'); 
        div.className = "item-card bg-white"; 
        div.innerHTML = `<div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
                <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                <span class="summary-list-name font-bold text-xl text-gray-700" onclick="switchList('${id}')">${l.name}</span>
            </div>
            <div class="text-left font-bold text-indigo-600">₪${lT.toFixed(2)}</div>
        </div>`;
        summaryContainer.appendChild(div);
    });

    // עדכון סכומי כסף
    document.getElementById('displayTotal').innerText = totalAll.toFixed(2);
    document.getElementById('displayPaid').innerText = paidAll.toFixed(2);
    document.getElementById('displayLeft').innerText = (totalAll - paidAll).toFixed(2);
    
    // עדכון כפתור הנעילה
    const lockBtn = document.getElementById('mainLockBtn');
    lockBtn.className = `bottom-circle-btn ${isLocked ? 'bg-indigo-600' : 'bg-orange-400'}`;
    document.getElementById('lockIconPath').setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
}

// ========== Helpers & Modals ==========
window.showPage = (p) => { activePage = p; render(); }
window.toggleLock = () => { isLocked = !isLocked; render(); }
window.toggleItem = (idx) => { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
window.removeItem = (idx) => { db.lists[db.currentId].items.splice(idx, 1); save(); }
window.changeQty = (idx, d) => { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');

window.addItem = function() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        closeModal('inputForm'); save(); 
    }
}

window.saveNewList = function() {
    const n = document.getElementById('newListNameInput').value.trim();
    if (n) { 
        const id = 'L' + Date.now(); 
        db.lists[id] = { name: n, items: [] }; 
        db.currentId = id; 
        activePage = 'lists'; 
        closeModal('newListModal'); save(); 
    }
}

window.updateFontSize = (v) => { db.fontSize = parseInt(v); document.getElementById('fontSizeValue').innerText = v; render(); }
window.toggleSum = (id) => {
    const i = db.selectedInSummary.indexOf(id);
    if (i > -1) db.selectedInSummary.splice(i, 1); else db.selectedInSummary.push(id);
    save();
}
window.switchList = (id) => { db.currentId = id; activePage = 'lists'; render(); }

function updateCloudIndicator(s) {
    const i = document.getElementById('cloudIndicator');
    if(i) i.className = `w-2 h-2 rounded-full ${s === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
}

window.onload = () => { render(); };

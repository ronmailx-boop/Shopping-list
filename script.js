// ========== Google Drive Configuration ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false, gisInited = false, tokenClient, accessToken = null;
let isSyncing = false, isConnected = false, syncTimeout = null;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists',
    selectedInSummary: []
};

let activePage = db.lastActivePage || 'lists';
let isLocked = true;
let showMissingOnly = false;
let sortableInstance = null;

// ========== Initialization & Auth ==========
function gapiLoaded() { gapi.load('client', async () => { await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] }); gapiInited = true; }); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: '' }); gisInited = true; }

async function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);
        accessToken = resp.access_token;
        isConnected = true;
        updateCloudIndicator('connected');
        syncToCloud();
    };
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// ========== Cloud Sync Logic ==========
async function syncToCloud() {
    if (isSyncing || !accessToken) return;
    isSyncing = true; updateCloudIndicator('syncing');
    try {
        const folderRes = await gapi.client.drive.files.list({ q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'` });
        let folderId = folderRes.result.files[0]?.id;
        if(!folderId) {
            const folder = await gapi.client.drive.files.create({ resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }, fields: 'id' });
            folderId = folder.result.id;
        }
        const fileRes = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and '${folderId}' in parents` });
        const fileId = fileRes.result.files[0]?.id;
        const data = JSON.stringify(db);
        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: data
            });
        } else {
            const metadata = { name: FILE_NAME, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([data], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form
            });
        }
    } catch (e) { console.error(e); } finally { isSyncing = false; updateCloudIndicator('connected'); }
}

function updateCloudIndicator(s) { 
    const ind = document.getElementById('cloudIndicator');
    if(ind) ind.className = `w-2 h-2 rounded-full ${s === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
}

// ========== Core Logic ==========
function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 3000);
    }
}

function render() {
    const list = db.lists[db.currentId];
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('listNameDisplay').innerText = list.name;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            if (showMissingOnly && item.checked) return;

            const div = document.createElement('div');
            div.className = `item-card bg-white p-4 rounded-2xl shadow-sm mb-3 flex flex-col gap-3`;
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6">
                        <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${idx+1}. ${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="text-red-400">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 p-1 rounded-xl">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 font-bold px-2">+</button>
                        <span class="font-bold">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 font-bold px-2">-</button>
                    </div>
                    <span class="text-indigo-600 font-black text-xl">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const div = document.createElement('div');
            div.className = "item-card bg-white p-4 rounded-2xl shadow-sm mb-3 flex items-center gap-4";
            div.innerHTML = `
                <input type="checkbox" ${db.selectedInSummary.includes(id) ? 'checked' : ''} onchange="toggleSelectList('${id}')" class="w-6 h-6">
                <div class="flex-1 font-bold text-lg" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);

    // Lock & Sortable
    const lockPath = document.getElementById('lockIconPath');
    const lockBtn = document.getElementById('mainLockBtn');
    lockBtn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-500'}`;
    lockPath.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    document.getElementById('statusTag').innerText = isLocked ? "נעול" : "עריכה פעילה";

    if (sortableInstance) sortableInstance.destroy();
    if (!isLocked && activePage === 'lists') {
        sortableInstance = Sortable.create(container, { animation: 150, onEnd: (e) => {
            const items = db.lists[db.currentId].items;
            const item = items.splice(e.oldIndex, 1)[0];
            items.splice(e.newIndex, 0, item);
            save();
        }});
    }
}

// ========== UI Actions ==========
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function toggleBottomBar() { document.getElementById('bottomBar').classList.toggle('minimized'); }

function addItem() {
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); save(); closeModal('inputForm'); }
}

function saveNewList() {
    const n = document.getElementById('newListNameInput').value;
    if (n) { const id = 'L' + Date.now(); db.lists[id] = { name: n, items: [] }; db.currentId = id; activePage = 'lists'; save(); closeModal('newListModal'); }
}

function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d > 0) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function toggleSelectList(id) { const i = db.selectedInSummary.indexOf(id); if(i > -1) db.selectedInSummary.splice(i,1); else db.selectedInSummary.push(id); save(); }
function toggleSelectAll(c) { db.selectedInSummary = c ? Object.keys(db.lists) : []; save(); }
function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }

function preparePrint() { window.print(); }
function shareNative(t) { /* לוגיקת שיתוף */ }

// Init
render();

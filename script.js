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
let syncTimeout = null;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let sortableInstance = null;

// ========== Core Functions ==========
function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 2000);
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
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub;

            const div = document.createElement('div');
            div.className = `item-card`;
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                            <span class="item-number">${idx + 1}.</span> ${item.name}
                        </div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const div = document.createElement('div');
            div.className = "item-card flex flex-row items-center gap-4 cursor-pointer";
            div.innerHTML = `
                <div class="flex-1 font-bold text-xl" onclick="switchList('${id}')">${l.name}</div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);

    const lockBtn = document.getElementById('mainLockBtn');
    const lockPath = document.getElementById('lockIconPath');
    lockBtn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-500'}`;
    lockPath.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 1 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    document.getElementById('statusTag').innerText = isLocked ? "נעול" : "עריכה פעילה (גרירה)";

    if (sortableInstance) sortableInstance.destroy();
    if (!isLocked && activePage === 'lists') {
        sortableInstance = Sortable.create(container, { 
            animation: 150, 
            onEnd: (e) => {
                const items = db.lists[db.currentId].items;
                const [movedItem] = items.splice(e.oldIndex, 1);
                items.splice(e.newIndex, 0, movedItem);
                save();
            }
        });
    }
}

// ========== Actions & UI ==========
function toggleLock() { isLocked = !isLocked; render(); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }
function toggleBottomBar(e) { if (e.target.closest('button') || e.target.closest('input')) return; document.getElementById('bottomBar').classList.toggle('minimized'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; render(); }
function switchList(id) { db.currentId = id; activePage = 'lists'; save(); }

function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        save(); 
        closeModal('inputForm'); 
    }
}

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function changeQty(idx, d) { if (db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }

function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    if (n) { 
        const id = 'L' + Date.now(); 
        db.lists[id] = { name: n, items: [] }; 
        db.currentId = id; 
        activePage = 'lists'; 
        save(); 
        closeModal('newListModal'); 
    }
}

// ========== Google Drive Sync ==========
function gapiLoaded() { 
    gapi.load('client', () => {
        gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] })
        .then(() => { gapiInited = true; });
    });
}

function gisLoaded() { 
    tokenClient = google.accounts.oauth2.initTokenClient({ 
        client_id: GOOGLE_CLIENT_ID, 
        scope: SCOPES, 
        callback: '' 
    }); 
    gisInited = true; 
}

async function handleCloudClick() {
    if (!isConnected) {
        tokenClient.callback = async (resp) => { 
            accessToken = resp.access_token; 
            isConnected = true; 
            updateCloudIndicator('connected'); 
            syncToCloud(); 
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else syncToCloud();
}

async function syncToCloud() {
    if (isSyncing || !accessToken) return;
    isSyncing = true; 
    updateCloudIndicator('syncing');
    try {
        const folderResponse = await gapi.client.drive.files.list({ q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed = false` });
        let folderId = folderResponse.result.files[0]?.id;
        if(!folderId) {
            const folder = await gapi.client.drive.files.create({ resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }, fields: 'id' });
            folderId = folder.result.id;
        }
        const fileResponse = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed = false` });
        const fileId = fileResponse.result.files[0]?.id;
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

// ========== Init ==========
window.onload = () => { render(); };

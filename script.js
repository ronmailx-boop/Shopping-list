// ========== Google Drive Implementation ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false, gisInited = false, tokenClient, accessToken = null;
let isSyncing = false, isConnected = false, syncTimeout = null;

let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } }, lastActivePage: 'lists', selectedInSummary: []
};
let activePage = db.lastActivePage || 'lists', isLocked = true, showMissingOnly = false, highlightedItemName = null;
let sortableInstance = null, currentEditIdx = null;

// פונקציית שמירה עם סנכרון ענן
function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 2000);
    }
}

// --- לוגיקת סנכרון ענן ---
async function handleCloudClick() {
    if (!isConnected) {
        tokenClient.callback = async (resp) => {
            accessToken = resp.access_token; isConnected = true;
            updateCloudIndicator('connected');
            await loadAndMerge();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else { await loadAndMerge(); }
}

async function syncToCloud() {
    if (isSyncing || !accessToken) return;
    isSyncing = true; updateCloudIndicator('syncing');
    try {
        const folderResponse = await gapi.client.drive.files.list({ q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'` });
        let folderId = folderResponse.result.files[0]?.id;
        if(!folderId) {
            const folder = await gapi.client.drive.files.create({ resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }, fields: 'id' });
            folderId = folder.result.id;
        }
        const fileResponse = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and '${folderId}' in parents` });
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
    } catch (e) { console.error("Sync failed", e); }
    finally { isSyncing = false; updateCloudIndicator('connected'); }
}

async function loadAndMerge() { /* מימוש טעינה ומיזוג כפי שהיה במקור */ render(); }
function updateCloudIndicator(s) { 
    const ind = document.getElementById('cloudIndicator');
    if(ind) ind.className = `w-2 h-2 rounded-full ${s === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
}

// --- לוגיקת ממשק משתמש ---
function toggleLock() { isLocked = !isLocked; render(); }
function showPage(p) { activePage = p; save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }
function toggleBottomBar(e) {
    if (e.target.closest('button') || e.target.closest('input')) return;
    document.getElementById('bottomBar').classList.toggle('minimized');
}

function openEditTotalModal(idx) { currentEditIdx = idx; openModal('editTotalModal'); }
function saveTotal() {
    const val = parseFloat(document.getElementById('editTotalInput').value);
    if (!isNaN(val)) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        save();
    }
    closeModal('editTotalModal');
}

// --- חיפוש וסינון ---
function handleItemSearch(val) {
    const sug = document.getElementById('itemSuggestions');
    if (!val.trim()) { sug.classList.add('hidden'); return; }
    const matches = db.lists[db.currentId].items.filter(i => i.name.toLowerCase().includes(val.toLowerCase()));
    if (matches.length > 0) {
        sug.innerHTML = matches.map(i => `<div class="p-3 border-b cursor-pointer font-bold" onclick="highlightItem('${i.name.replace(/'/g, "\\'")}')">${i.name}</div>`).join('');
        sug.classList.remove('hidden');
    } else { sug.classList.add('hidden'); }
}

function highlightItem(name) {
    highlightedItemName = name; showMissingOnly = false; render();
    document.getElementById('itemSuggestions').classList.add('hidden');
    document.getElementById('itemSearchInput').value = '';
    setTimeout(() => { 
        const el = document.querySelector('.highlight-flash');
        if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { highlightedItemName = null; render(); }, 3000); 
    }, 100);
}

function toggleMissingFilter() { 
    showMissingOnly = !showMissingOnly; 
    const btn = document.getElementById('filterMissingBtn');
    btn.innerText = showMissingOnly ? "הצג הכל" : "הצג חסרים בלבד";
    render(); 
}

// --- Render ---
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

        let itemsToRender = list.items.map((i, idx) => ({...i, originalIdx: idx}));
        if (highlightedItemName) itemsToRender.sort((a,b) => a.name === highlightedItemName ? -1 : 1);

        itemsToRender.forEach((item) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            if (showMissingOnly && item.checked) return;

            const div = document.createElement('div');
            div.className = `item-card ${item.name === highlightedItemName ? 'highlight-flash' : ''}`;
            div.setAttribute('data-id', item.originalIdx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked':''} onchange="toggleItem(${item.originalIdx})" class="w-7 h-7">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                            <span class="text-indigo-600 opacity-50 text-sm">${item.originalIdx + 1}.</span> ${item.name}
                        </div>
                    </div>
                    <button onclick="removeItem(${item.originalIdx})" class="text-red-500">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-100 px-2 py-1 rounded-xl">
                        <button onclick="changeQty(${item.originalIdx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold">${item.qty}</span>
                        <button onclick="changeQty(${item.originalIdx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${item.originalIdx})" class="text-2xl font-black text-indigo-600 cursor-pointer">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const div = document.createElement('div');
            div.className = "item-card flex items-center gap-4";
            div.innerHTML = `<input type="checkbox" class="w-7 h-7" ${db.selectedInSummary.includes(id) ? 'checked':''} onchange="toggleSum('${id}')"><div class="flex-1 font-bold text-xl" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);

    // ניהול מנעול וגרירה
    const lockPath = document.getElementById('lockIconPath');
    lockPath.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    
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

// ========== Init ==========
window.onload = () => {
    gapi.load('client', () => gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] }));
    tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: '' });
    document.getElementById('cloudBtn').onclick = handleCloudClick;
    render();
};

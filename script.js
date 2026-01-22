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
let highlightedItemName = null;
let sortableInstance = null;
let currentEditIdx = null;

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

// ========== UI Logic ==========
function openModal(id) { 
    const m = document.getElementById(id);
    if(m) {
        m.classList.add('active');
        if(id === 'inputForm') {
            document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = '';
            setTimeout(() => document.getElementById('itemName').focus(), 150);
        }
    }
}

function closeModal(id) { 
    const m = document.getElementById(id); 
    if(m) m.classList.remove('active'); 
}

function showPage(p) { activePage = p; save(); }

function toggleBottomBar(e) {
    if (e.target.closest('button') || e.target.closest('input')) return;
    document.getElementById('bottomBar').classList.toggle('minimized');
}

function toggleLock() { 
    isLocked = !isLocked; 
    render(); 
}

function toggleDarkMode() { 
    document.body.classList.toggle('dark-mode'); 
    closeModal('settingsModal'); 
}

// ========== List Logic ==========
function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        closeModal('inputForm'); 
        save(); 
    } 
}

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function changeQty(idx, d) { 
    if(db.lists[db.currentId].items[idx].qty + d >= 1) { 
        db.lists[db.currentId].items[idx].qty += d; 
        save(); 
    } 
}

function openEditTotalModal(idx) {
    currentEditIdx = idx;
    const item = db.lists[db.currentId].items[idx];
    document.getElementById('editTotalInput').value = (item.price * item.qty).toFixed(2);
    openModal('editTotalModal');
}

function saveTotal() {
    const val = parseFloat(document.getElementById('editTotalInput').value);
    if (!isNaN(val)) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        save();
    }
    closeModal('editTotalModal');
}

function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }

function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    const u = document.getElementById('newListUrlInput').value.trim();
    if (n) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: n, url: u, items: [] };
        db.currentId = id;
        activePage = 'lists';
        closeModal('newListModal');
        save();
    }
}

// ========== Search & Filter ==========
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
    highlightedItemName = name; 
    showMissingOnly = false; 
    render();
    document.getElementById('itemSuggestions').classList.add('hidden');
    document.getElementById('itemSearchInput').value = '';
    setTimeout(() => {
        const el = document.querySelector('.highlight-flash');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { highlightedItemName = null; render(); }, 3000);
    }, 100);
}

function toggleMissingFilter() {
    showMissingOnly = !showMissingOnly;
    const btn = document.getElementById('filterMissingBtn');
    btn.innerText = showMissingOnly ? "הצג הכל" : "הצג חסרים בלבד";
    render();
}

// ========== Cloud Sync (Drive) ==========
function gapiLoaded() { gapi.load('client', () => gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] }).then(() => gapiInited = true)); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: '' }); gisInited = true; }

async function handleCloudClick() {
    if (!isConnected) {
        tokenClient.callback = async (resp) => { accessToken = resp.access_token; isConnected = true; updateCloudIndicator('connected'); syncToCloud(); };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else syncToCloud();
}

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

// ========== PDF & Share ==========
function preparePrint() { 
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    let grandTotal = 0;
    let htmlContent = `<h1 style="text-align:center; color:#7367f0; direction:rtl;">Vplus - דוח תקציב</h1>`;
    
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        let lTotal = 0;
        htmlContent += `<div style="direction:rtl; margin-bottom:20px; border-bottom:1px solid #eee;">
            <h3>${l.name}</h3>
            <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
                <tr style="background:#f4f4f4;"><th style="text-align:right;">מוצר</th><th>כמות</th><th style="text-align:left;">סה"כ</th></tr>`;
        l.items.forEach(i => {
            const s = i.price * i.qty; lTotal += s;
            htmlContent += `<tr><td style="text-align:right;">${i.name}</td><td style="text-align:center;">${i.qty}</td><td style="text-align:left;">₪${s.toFixed(2)}</td></tr>`;
        });
        htmlContent += `</table><p style="text-align:left; font-weight:bold;">סה"כ רשימה: ₪${lTotal.toFixed(2)}</p></div>`;
        grandTotal += lTotal;
    });
    htmlContent += `<h2 style="text-align:center; margin-top:30px;">סה"כ לתשלום: ₪${grandTotal.toFixed(2)}</h2>`;
    printArea.innerHTML = htmlContent;
    window.print(); 
}

function shareNative(type) {
    let text = "";
    if (type === 'list') {
        const l = db.lists[db.currentId];
        text = `🛒 *${l.name}*\n` + l.items.map(i => `${i.checked ? '✅':'⬜'} ${i.name} (x${i.qty})`).join('\n');
    }
    if (navigator.share) navigator.share({ text });
    else { navigator.clipboard.writeText(text); alert("הועתק ללוח"); }
}

// ========== Render ==========
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
                            <span class="item-number">${item.originalIdx + 1}.</span> ${item.name}
                        </div>
                    </div>
                    <button onclick="removeItem(${item.originalIdx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${item.originalIdx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
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
            div.className = "item-card flex items-center gap-4 cursor-pointer";
            div.innerHTML = `<div class="flex-1 font-bold text-xl" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);

    const lockBtn = document.getElementById('mainLockBtn');
    const lockPath = document.getElementById('lockIconPath');
    lockBtn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
    lockPath.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    document.getElementById('statusTag').innerText = isLocked ? "נעול" : "עריכה פעילה (גרירה)";

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

// ========== Initialize ==========
window.onload = () => {
    const bar = document.getElementById('bottomBar');
    bar.addEventListener('click', toggleBottomBar);
    const btns = bar.querySelectorAll('button');
    btns.forEach(b => b.addEventListener('click', e => e.stopPropagation()));
    
    document.getElementById('cloudBtn').onclick = handleCloudClick;
    render();
};

const s1 = document.createElement('script'); s1.src = 'https://apis.google.com/js/api.js'; s1.onload = gapiLoaded; document.head.appendChild(s1);
const s2 = document.createElement('script'); s2.src = 'https://accounts.google.com/gsi/client'; s2.onload = gisLoaded; document.head.appendChild(s2);

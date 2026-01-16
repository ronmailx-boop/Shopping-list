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
let driveFileId = null;
let syncTimeout = null;
let isSyncing = false;
let isConnected = false;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    lastSync: 0
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;

// ========== Core Logic ==========
function save() { 
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncToCloud();
        }, 1500);
    }
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
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
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
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
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
        
        // תיקון ויזואלי לכפתור "בחר הכל" בדף הריכוז
        const selectAllCheckbox = document.getElementById('selectAllLists');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = db.selectedInSummary.length === Object.keys(db.lists).length && Object.keys(db.lists).length > 0;
        }

        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0, lP = 0;
            l.items.forEach(i => { lT += (i.price * i.qty); if(i.checked) lP += (i.price * i.qty); });
            const isSel = db.selectedInSummary.includes(id); 
            if (isSel) { total += lT; paid += lP; }
            const div = document.createElement('div'); 
            div.className = "item-card p-4"; 
            div.dataset.id = id;
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                        <span class="font-bold text-xl cursor-pointer" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
                    </div>
                    <div class="text-indigo-600 font-black text-xl">₪${lT.toFixed(2)}</div>
                </div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== Fix: Select All Logic (from script 8) ==========
function toggleSelectAll(checked) {
    // עדכון המערך בבסיס הנתונים עבור כל המפתחות הקיימים
    db.selectedInSummary = checked ? Object.keys(db.lists) : [];
    save();
}

// ========== Fix: Import Logic (from script 9) ==========
function importFromText() {
    const text = document.getElementById('importText').value.trim();
    if (!text) { alert('אנא הדבק טקסט לייבוא'); return; }

    const lines = text.split('\n').filter(line => line.trim());
    let listName = 'רשימה מיובאת';
    let startIndex = 0;
    
    // זיהוי כותרת רשימה (למשל *שם רשימה*)
    if (lines[0].includes('*')) {
        const match = lines[0].match(/\*([^*]+)\*/);
        if (match) { listName = match[1].trim(); startIndex = 1; }
    }

    const newListId = 'L' + Date.now();
    const items = [];

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.includes('🛒') || line.includes('💰') || line.includes('סה"כ')) continue;

        let itemAdded = false;

        // פורמט 1: ⬜ *שם* (xכמות) - ₪מחיר
        const fullMatch = line.match(/[⬜✅]\s*\*([^*]+)\*\s*\(x(\d+)\)\s*-\s*₪([\d.]+)/);
        if (fullMatch) {
            const qty = parseInt(fullMatch[2]);
            items.push({ name: fullMatch[1].trim(), price: parseFloat(fullMatch[3])/qty, qty, checked: line.includes('✅') });
            itemAdded = true;
        }

        // פורמט פשוט: • שם
        if (!itemAdded) {
            const name = line.replace(/^[•\-\*\s]+/, '').replace(/\*+$/, '').trim();
            if (name) items.push({ name, price: 0, qty: 1, checked: false });
        }
    }

    if (items.length > 0) {
        db.lists[newListId] = { name: listName, items };
        db.currentId = newListId;
        activePage = 'lists';
        closeModal('importModal');
        save();
    }
}

// ========== Fix: WhatsApp & PDF (Ensuring active buttons) ==========
function shareSummaryToWhatsApp() {
    const selectedIds = db.selectedInSummary;
    if (selectedIds.length === 0) { alert("בחר לפחות רשימה אחת!"); return; }
    let text = `📦 *ריכוז חסרים:*\n\n`;
    selectedIds.forEach(id => {
        const l = db.lists[id];
        const missing = l.items.filter(i => !i.checked);
        if (missing.length > 0) {
            text += `🔹 *${l.name}:*\n`;
            missing.forEach(i => text += `  - ${i.name} (x${i.qty})\n`);
            text += `\n`;
        }
    });
    window.open("https://wa.me/?text=" + encodeURIComponent(text));
}

function preparePrint() { 
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    let grandTotal = 0;
    let html = `<div style="direction:rtl; padding:20px; font-family:sans-serif;">
                <h1 style="text-align:center; color:#7367f0;">דוח קניות - Vplus</h1>`;
    
    const idsToPrint = db.selectedInSummary.length > 0 ? db.selectedInSummary : Object.keys(db.lists);
    idsToPrint.forEach(id => {
        const l = db.lists[id];
        let listTotal = 0;
        html += `<h3>${l.name}</h3><table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
                <tr style="background:#eee;"><th>מוצר</th><th>כמות</th><th>סה"כ</th></tr>`;
        l.items.forEach(i => {
            const s = i.price * i.qty; listTotal += s;
            html += `<tr><td style="border:1px solid #ddd; padding:8px;">${i.name}</td>
                    <td style="border:1px solid #ddd; padding:8px; text-align:center;">${i.qty}</td>
                    <td style="border:1px solid #ddd; padding:8px; text-align:left;">₪${s.toFixed(2)}</td></tr>`;
        });
        html += `</table><div style="text-align:left; font-weight:bold;">סה"כ רשימה: ₪${listTotal.toFixed(2)}</div>`;
        grandTotal += listTotal;
    });
    html += `<h2 style="text-align:center; margin-top:30px;">סה"כ כולל: ₪${grandTotal.toFixed(2)}</h2></div>`;
    printArea.innerHTML = html;
    setTimeout(() => { window.print(); }, 500);
}

// ========== Google Drive (Restoring from script 8) ==========
function gapiLoaded() { gapi.load('client', initializeGapiClient); }

async function initializeGapiClient() {
    await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: ''
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) { document.getElementById('cloudBtn').onclick = handleCloudClick; }
}

function handleCloudClick() {
    if (isConnected) syncToCloud();
    else handleAuthClick();
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        accessToken = gapi.client.getToken().access_token;
        isConnected = true;
        updateCloudIndicator('connected');
        await loadAndMerge();
    };
    tokenClient.requestAccessToken({prompt: 'consent'});
}

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        const folderId = await findOrCreateFolder();
        const fileId = await findFileInFolder(folderId);
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
    } catch (e) { console.error(e); }
    finally { isSyncing = false; updateCloudIndicator('connected'); }
}

async function findOrCreateFolder() {
    const res = await gapi.client.drive.files.list({ q: `name='${FOLDER_NAME}' and trashed=false` });
    if (res.result.files.length > 0) return res.result.files[0].id;
    const folder = await gapi.client.drive.files.create({ resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' } });
    return folder.result.id;
}

async function findFileInFolder(fId) {
    const res = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and '${fId}' in parents` });
    return res.result.files.length > 0 ? res.result.files[0].id : null;
}

async function loadAndMerge() {
    const fId = await findOrCreateFolder();
    const fileId = await findFileInFolder(fId);
    if (!fileId) return;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
    db = await res.json();
    save();
}

// ========== UI Utilities & Helpers ==========
function openModal(id) { 
    const m = document.getElementById(id);
    if(m) {
        m.classList.add('active');
        if(id === 'inputForm') {
            document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = '';
        }
    }
}
function closeModal(id) { const m = document.getElementById(id); if(m) m.classList.remove('active'); }
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
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); closeModal('inputForm'); save(); }
}
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty+d>=1) { db.lists[db.currentId].items[idx].qty+=d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function showPage(p) { activePage = p; save(); }
function updateCloudIndicator(s) {
    const i = document.getElementById('cloudIndicator');
    if(i) i.className = `w-2 h-2 rounded-full ${s === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
}
function openEditTotalModal(i) { currentEditIdx = i; document.getElementById('editTotalInput').value = ''; openModal('editTotalModal'); }
function saveTotal() {
    const v = parseFloat(document.getElementById('editTotalInput').value);
    if (!isNaN(v)) { const item = db.lists[db.currentId].items[currentEditIdx]; item.price = v/item.qty; save(); }
    closeModal('editTotalModal');
}
function initSortable() {
    const el = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { animation: 150, onEnd: () => {
            const newOrder = Array.from(el.children).map(c => activePage === 'lists' ? parseInt(c.getAttribute('data-id')) : c.getAttribute('data-id'));
            if (activePage === 'lists') {
                const items = db.lists[db.currentId].items;
                db.lists[db.currentId].items = newOrder.map(idx => items[idx]);
            } else {
                const newLists = {};
                newOrder.forEach(id => newLists[id] = db.lists[id]);
                db.lists = newLists;
            }
            save();
        }});
    }
}

window.onload = () => {
    const bar = document.querySelector('.bottom-bar');
    if(bar) bar.addEventListener('click', (e) => { if(e.offsetY < 35) bar.classList.toggle('collapsed'); });
    render();
};

const script1 = document.createElement('script'); script1.src = 'https://apis.google.com/js/api.js'; script1.onload = gapiLoaded; document.head.appendChild(script1);
const script2 = document.createElement('script'); script2.src = 'https://accounts.google.com/gsi/client'; script2.onload = gisLoaded; document.head.appendChild(script2);

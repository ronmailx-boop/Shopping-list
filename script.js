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

// ========== Core Logic & Render ==========
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
                    <button onclick="removeItem(${idx})" class="text-red-500 bg-transparent p-0 border-none">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1 border border-gray-200">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-600 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center text-gray-900">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-600 text-2xl font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        const selectAllCheckbox = document.getElementById('selectAllLists');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = db.selectedInSummary.length === Object.keys(db.lists).length && Object.keys(db.lists).length > 0;
        }
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0, lP = 0;
            l.items.forEach(i => { lT += (i.price * i.qty); if(i.checked) lP += (i.price * i.qty); });
            const isSel = db.selectedInSummary.includes(id); 
            if (isSel) { totalAll += lT; paidAll += lP; }
            const div = document.createElement('div'); 
            div.className = "item-card p-4"; 
            div.innerHTML = `<div class="flex justify-between items-center">
                <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                <span class="font-bold text-xl flex-1 mr-3" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
                <div class="text-left font-bold text-indigo-600">₪${lT.toFixed(2)}</div>
            </div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = totalAll.toFixed(2);
    document.getElementById('displayPaid').innerText = paidAll.toFixed(2);
    document.getElementById('displayLeft').innerText = (totalAll - paidAll).toFixed(2);
    
    const lockBtn = document.getElementById('mainLockBtn');
    if(lockBtn) lockBtn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
    const statusTag = document.getElementById('statusTag');
    if(statusTag) statusTag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";
    initSortable();
}

// ========== WhatsApp Share ==========
function shareFullToWhatsApp() {
    const list = db.lists[db.currentId];
    if (!list) return;
    let text = `📋 *${list.name}*\n\n`;
    list.items.forEach(i => {
        text += `${i.checked ? '✅' : '⬜'} *${i.name}* (x${i.qty}) - ₪${(i.price * i.qty).toFixed(2)}\n`;
    });
    const total = document.getElementById('displayTotal').innerText;
    text += `\n💰 *סה"כ לתשלום: ₪${total}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    closeModal('shareListModal');
}

function shareMissingToWhatsApp() {
    const list = db.lists[db.currentId];
    if (!list) return;
    const missing = list.items.filter(i => !i.checked);
    if (missing.length === 0) { alert("אין מוצרים חסרים!"); return; }
    let text = `🛒 *מוצרים חסרים ב-${list.name}:*\n\n`;
    missing.forEach(i => {
        text += `• ${i.name} (x${i.qty})\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    closeModal('shareListModal');
}

function shareSummaryToWhatsApp() {
    const selectedIds = db.selectedInSummary;
    if (selectedIds.length === 0) { alert("יש לבחור לפחות רשימה אחת!"); return; }
    let text = `📦 *ריכוז רשימות קנייה (חסרים):*\n\n`;
    selectedIds.forEach(id => {
        const l = db.lists[id];
        const missing = l.items.filter(i => !i.checked);
        if (missing.length > 0) {
            text += `🔹 *${l.name}:*\n`;
            missing.forEach(i => text += `  - ${i.name} (x${i.qty})\n`);
            text += `\n`;
        }
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// ========== Google Drive Sync - REBUILT & IMPROVED ==========
function gapiLoaded() {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                apiKey: GOOGLE_API_KEY,
                discoveryDocs: [DISCOVERY_DOC]
            });
            gapiInited = true;
            console.log('✅ GAPI initialized');
            maybeEnableSync();
        } catch (error) {
            console.error('❌ GAPI init error:', error);
        }
    });
}

function gisLoaded() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: async (response) => {
                if (response.error) {
                    console.error('❌ Token error:', response.error);
                    return;
                }
                accessToken = response.access_token;
                isConnected = true;
                updateCloudIndicator('connected');
                console.log('✅ Connected to Google Drive');
                await loadFromCloud();
            }
        });
        gisInited = true;
        console.log('✅ GIS initialized');
        maybeEnableSync();
    } catch (error) {
        console.error('❌ GIS init error:', error);
    }
}

function maybeEnableSync() {
    if (gapiInited && gisInited) {
        const btn = document.getElementById('cloudBtn');
        if (btn) {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
        console.log('✅ Cloud sync ready');
    }
}

async function handleCloudClick() {
    console.log('☁️ Cloud button clicked');
    
    if (!gapiInited || !gisInited) {
        alert('⏳ מערכת הענן עדיין נטענת, אנא המתן רגע...');
        return;
    }
    
    if (isConnected) {
        // כבר מחובר - סנכרן מיידית
        console.log('🔄 Already connected, syncing...');
        await loadFromCloud();
        alert('✅ הסנכרון הושלם בהצלחה!');
    } else {
        // לא מחובר - בקש הרשאה
        console.log('🔑 Requesting access...');
        try {
            tokenClient.requestAccessToken({ prompt: '' });
        } catch (error) {
            console.error('❌ Access error:', error);
            alert('שגיאה בהתחברות. אנא נסה שוב.');
        }
    }
}

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    
    isSyncing = true;
    updateCloudIndicator('syncing');
    console.log('⬆️ Uploading to cloud...');
    
    try {
        const folderId = await getOrCreateFolder();
        const existingFile = await findFile(folderId);
        const content = JSON.stringify(db);
        
        if (existingFile) {
            // עדכן קובץ קיים
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: content
            });
            console.log('✅ File updated');
        } else {
            // צור קובץ חדש
            const metadata = {
                name: FILE_NAME,
                parents: [folderId],
                mimeType: 'application/json'
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));
            
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: form
            });
            console.log('✅ New file created');
        }
        
        updateCloudIndicator('connected');
    } catch (error) {
        console.error('❌ Sync error:', error);
        updateCloudIndicator('error');
    } finally {
        isSyncing = false;
    }
}

async function loadFromCloud() {
    if (!accessToken) return;
    
    updateCloudIndicator('syncing');
    console.log('⬇️ Loading from cloud...');
    
    try {
        const folderId = await getOrCreateFolder();
        const existingFile = await findFile(folderId);
        
        if (existingFile) {
            // טען קובץ קיים
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            const cloudData = await response.json();
            
            // מיזוג חכם - בחר את הנתונים העדכניים יותר
            if (!db.lastSync || cloudData.lastSync > db.lastSync) {
                db = cloudData;
                localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
                render();
                console.log('✅ Data loaded from cloud');
            } else {
                console.log('ℹ️ Local data is newer, uploading...');
                await syncToCloud();
            }
        } else {
            // אין קובץ בענן - העלה את הנתונים המקומיים
            console.log('ℹ️ No cloud file, creating...');
            await syncToCloud();
        }
        
        updateCloudIndicator('connected');
    } catch (error) {
        console.error('❌ Load error:', error);
        updateCloudIndicator('error');
    }
}

async function getOrCreateFolder() {
    const response = await gapi.client.drive.files.list({
        q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
    });
    
    if (response.result.files && response.result.files.length > 0) {
        console.log('📁 Folder found:', response.result.files[0].id);
        return response.result.files[0].id;
    }
    
    // צור תיקייה חדשה
    const folderMetadata = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
    };
    
    const folder = await gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
    });
    
    console.log('📁 Folder created:', folder.result.id);
    return folder.result.id;
}

async function findFile(folderId) {
    const response = await gapi.client.drive.files.list({
        q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1,
        spaces: 'drive'
    });
    
    if (response.result.files && response.result.files.length > 0) {
        console.log('📄 File found:', response.result.files[0].id);
        return response.result.files[0];
    }
    
    console.log('📄 No file found');
    return null;
}

// ========== UI Utilities ==========
function openModal(id) { 
    const m = document.getElementById(id);
    if(m) {
        m.classList.add('active');
        if(id==='inputForm'){ 
            document.getElementById('itemName').value=''; 
            document.getElementById('itemPrice').value=''; 
        }
    }
}

function closeModal(id) { 
    const m = document.getElementById(id); 
    if(m) m.classList.remove('active'); 
}

function showPage(p) { 
    activePage = p; 
    render(); 
}

function toggleLock() { 
    isLocked = !isLocked; 
    render(); 
}

function toggleItem(idx) { 
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; 
    save(); 
}

function removeItem(idx) { 
    db.lists[db.currentId].items.splice(idx, 1); 
    save(); 
}

function changeQty(idx, d) { 
    if(db.lists[db.currentId].items[idx].qty + d >= 1) { 
        db.lists[db.currentId].items[idx].qty += d; 
        save(); 
    } 
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

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        closeModal('inputForm'); 
        save(); 
    }
}

function executeClear() { 
    if (db.lists[db.currentId]) { 
        db.lists[db.currentId].items = []; 
        closeModal('confirmModal'); 
        save(); 
    } 
}

function saveNewList() {
    const input = document.getElementById('newListNameInput');
    const name = input.value.trim();
    if (name) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: name, items: [] };
        db.currentId = id; 
        activePage = 'lists';
        input.value = ''; 
        closeModal('newListModal'); 
        save();
    }
}

function importFromText() {
    const textarea = document.getElementById('importText');
    const text = textarea.value.trim();
    if (!text) { closeModal('importModal'); return; }
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
        const clean = line.replace(/[•\-\*⬜✅]/g, '').trim();
        if (clean) db.lists[db.currentId].items.push({ name: clean, price: 0, qty: 1, checked: false });
    });
    textarea.value = ''; 
    closeModal('importModal'); 
    save();
}

// ========== Init & Utilities ==========
function preparePrint() { 
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    let grandTotal = 0;
    let html = `<div dir="rtl" style="padding:30px;"><h1 style="text-align:center; color:#7367f0;">דוח קניות - Vplus</h1>`;
    const idsToPrint = db.selectedInSummary.length > 0 ? db.selectedInSummary : Object.keys(db.lists);
    idsToPrint.forEach(id => {
        const l = db.lists[id];
        let listTotal = 0;
        html += `<h3>${l.name}</h3><table style="width:100%; border-collapse:collapse; margin-bottom:15px;">`;
        l.items.forEach(i => {
            const s = i.price * i.qty; 
            listTotal += s;
            html += `<tr><td style="border:1px solid #ddd; padding:8px;">${i.name}</td><td style="border:1px solid #ddd; padding:8px; text-align:center;">${i.qty}</td><td style="border:1px solid #ddd; padding:8px; text-align:left;">₪${s.toFixed(2)}</td></tr>`;
        });
        html += `</table><div style="text-align:left; font-weight:bold;">סה"כ: ₪${listTotal.toFixed(2)}</div><br>`;
        grandTotal += listTotal;
    });
    html += `<h2 style="text-align:center; border-top:2px solid #333;">סה"כ כללי: ₪${grandTotal.toFixed(2)}</h2></div>`;
    printArea.innerHTML = html;
    setTimeout(() => { window.print(); }, 600);
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    if (!indicator) return;
    
    if (status === 'connected') {
        indicator.className = 'w-2 h-2 bg-green-500 rounded-full';
    } else if (status === 'syncing') {
        indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
    } else if (status === 'error') {
        indicator.className = 'w-2 h-2 bg-red-500 rounded-full';
    } else {
        indicator.className = 'w-2 h-2 bg-gray-300 rounded-full';
    }
}

function updateFontSize(s) { 
    db.fontSize = parseInt(s); 
    document.documentElement.style.setProperty('--base-font-size', s+'px'); 
    document.getElementById('fontSizeValue').innerText = s; 
    save(); 
}

function toggleDarkMode() { 
    document.body.classList.toggle('dark-mode'); 
    closeModal('settingsModal'); 
}

function saveListName() { 
    const n = document.getElementById('editListNameInput').value.trim(); 
    if(n) { 
        db.lists[db.currentId].name = n; 
        save(); 
    } 
    closeModal('editListNameModal'); 
}

function openEditTotalModal(i) { 
    currentEditIdx = i; 
    document.getElementById('editTotalInput').value = ''; 
    openModal('editTotalModal'); 
}

function saveTotal() {
    const v = parseFloat(document.getElementById('editTotalInput').value);
    if(!isNaN(v)){ 
        const item = db.lists[db.currentId].items[currentEditIdx]; 
        item.price = v / item.qty; 
        save(); 
    }
    closeModal('editTotalModal');
}

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked && activePage === 'lists') {
        sortableInstance = Sortable.create(el, { 
            animation: 150, 
            onEnd: (evt) => {
                const items = db.lists[db.currentId].items;
                const moved = items.splice(evt.oldIndex, 1)[0];
                items.splice(evt.newIndex, 0, moved);
                save();
            }
        });
    }
}

// ========== App Initialization ==========
window.onload = () => {
    console.log('🚀 Vplus App Loading...');
    
    // חיבור כפתור הענן
    const cloudBtn = document.getElementById('cloudBtn');
    if (cloudBtn) {
        cloudBtn.onclick = handleCloudClick;
        cloudBtn.style.opacity = '0.5'; // מתחיל כהה עד שה-API נטען
        console.log('☁️ Cloud button connected');
    }
    
    // התקנת מאזין לכווץ הבר התחתון
    const bar = document.querySelector('.bottom-bar');
    if (bar) {
        bar.addEventListener('click', (e) => { 
            if (e.offsetY < 35) {
                bar.classList.toggle('collapsed');
            }
        });
    }
    
    // טעינה ראשונית
    render();
    console.log('✅ App loaded successfully');
};
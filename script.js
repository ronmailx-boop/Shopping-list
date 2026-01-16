// ========== Google Config ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'vplus_data.json';

let gapiInited = false;
let gisInited = false;
let tokenClient;
let accessToken = null;
let isConnected = false;
let syncTimeout = null;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('VPLUS_DB_V1')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    fontSize: 16
};

let activePage = 'lists';
let isLocked = true;
let currentEditIdx = null;

// ========== Google Auth ==========

function gapiLoaded() {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
        checkToken();
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
            if (resp.error) return;
            accessToken = resp.access_token;
            isConnected = true;
            updateCloudIndicator('connected');
            loadFromCloud();
        }
    });
    gisInited = true;
}

function checkToken() {
    const saved = localStorage.getItem('g_token');
    if (saved) {
        accessToken = saved;
        isConnected = true;
        gapi.client.setToken({ access_token: saved });
        updateCloudIndicator('connected');
    }
}

async function handleCloudClick() {
    if (!gapiInited || !gisInited) return;
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// ========== Cloud Operations ==========

async function saveToCloud() {
    if (!accessToken) return;
    updateCloudIndicator('syncing');
    try {
        const res = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and trashed=false` });
        const fileId = res.result.files.length > 0 ? res.result.files[0].id : null;
        const metadata = { name: FILE_NAME, mimeType: 'application/json' };
        const content = JSON.stringify(db);

        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: content
            });
        } else {
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form
            });
        }
        updateCloudIndicator('connected');
    } catch (e) { console.error(e); }
}

async function loadFromCloud() {
    try {
        const res = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and trashed=false` });
        if (res.result.files.length > 0) {
            const file = await fetch(`https://www.googleapis.com/drive/v3/files/${res.result.files[0].id}?alt=media`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await file.json();
            if (data) { db = data; save(); }
        }
    } catch (e) { console.error(e); }
}

// ========== Core Functions ==========

function save() {
    localStorage.setItem('VPLUS_DB_V1', JSON.stringify(db));
    render();
    if (isConnected) {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(saveToCloud, 2000);
    }
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let tAll = 0, pAll = 0;

    document.getElementById('tabLists').className = `tab-btn flex-1 text-center py-2 rounded-lg cursor-pointer font-bold ${activePage === 'lists' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 text-center py-2 rounded-lg cursor-pointer font-bold ${activePage === 'summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            tAll += sub; if (item.checked) pAll += sub;
            const div = document.createElement('div');
            div.className = "item-card bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex flex-col gap-3";
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600 rounded-lg">
                        <span class="text-xl font-bold flex-1 ${item.checked ? 'line-through text-gray-300' : 'text-gray-800'}">${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="text-red-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-600 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center text-gray-900">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-600 text-2xl font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lt = 0; l.items.forEach(i => lt += (i.price * i.qty));
            const sel = db.selectedInSummary.includes(id);
            if (sel) { tAll += lt; l.items.forEach(i => { if(i.checked) pAll += (i.price*i.qty) }) }
            const div = document.createElement('div');
            div.className = "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex justify-between items-center";
            div.innerHTML = `<div class="flex items-center gap-3">
                <input type="checkbox" ${sel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-6 h-6">
                <span class="font-bold text-lg" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
            </div><span class="font-bold text-indigo-600">₪${lt.toFixed(2)}</span>`;
            container.appendChild(div);
        });
    }
    document.querySelectorAll('#displayTotal').forEach(el => el.innerText = tAll.toFixed(2));
    document.querySelectorAll('#displayPaid').forEach(el => el.innerText = pAll.toFixed(2));
    document.querySelectorAll('#displayLeft').forEach(el => el.innerText = (tAll - pAll).toFixed(2));
    
    const lockIcon = document.getElementById('lockIconPath');
    if (lockIcon) lockIcon.setAttribute('d', isLocked ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z");
    initSortable();
}

// ========== Actions ==========

function addItem() {
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); save(); closeModal('inputForm'); document.getElementById('itemName').value = ''; document.getElementById('itemPrice').value = ''; }
}

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function changeQty(idx, d) { const item = db.lists[db.currentId].items[idx]; if (item.qty + d > 0) { item.qty += d; save(); } }
function toggleSum(id) { const i = db.selectedInSummary.indexOf(id); if (i > -1) db.selectedInSummary.splice(i, 1); else db.selectedInSummary.push(id); save(); }
function toggleSelectAll(c) { db.selectedInSummary = c ? Object.keys(db.lists) : []; save(); }
function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }
function showPage(p) { activePage = p; render(); }
function toggleLock() { isLocked = !isLocked; render(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function shareFullToWhatsApp() {
    const l = db.lists[db.currentId];
    let t = `📋 *${l.name}*\n\n`;
    l.items.forEach(i => t += `${i.checked ? '✅' : '⬜'} ${i.name} (x${i.qty}) - ₪${(i.price*i.qty).toFixed(2)}\n`);
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`);
}

function shareMissingToWhatsApp() {
    const l = db.lists[db.currentId];
    let t = `⬜ *חסרים ב-${l.name}:*\n\n`;
    l.items.filter(i => !i.checked).forEach(i => t += `• ${i.name} (x${i.qty})\n`);
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`);
}

function preparePrint() {
    const area = document.getElementById('printArea');
    let h = `<div dir="rtl" style="padding:20px; font-family:sans-serif;"><h1>דוח Vplus</h1>`;
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        h += `<h3>${l.name}</h3><table border="1" style="width:100%; border-collapse:collapse;">`;
        l.items.forEach(i => h += `<tr><td>${i.name}</td><td>${i.qty}</td><td>₪${(i.price*i.qty).toFixed(2)}</td></tr>`);
        h += `</table>`;
    });
    area.innerHTML = h + `</div>`;
    window.print();
}

function updateCloudIndicator(s) {
    const el = document.getElementById('cloudIndicator');
    if (el) el.className = `w-2 h-2 rounded-full ${s === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
}

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (el && !isLocked) {
        Sortable.create(el, { animation: 150, onEnd: (evt) => {
            const items = db.lists[db.currentId].items;
            const item = items.splice(evt.oldIndex, 1)[0];
            items.splice(evt.newIndex, 0, item);
            save();
        }});
    }
}

// ========== Lifecycle ==========
window.onload = () => {
    document.getElementById('cloudBtn').onclick = handleCloudClick;
    gapiLoaded();
    gisLoaded();
    render();
};

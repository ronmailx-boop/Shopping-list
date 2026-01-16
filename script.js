// ========== Config ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'vplus_v2.json';

let db = JSON.parse(localStorage.getItem('VPLUS_V2')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } }
};
let gapiInited = false, gisInited = false, tokenClient, accessToken = null, isConnected = false;
let activePage = 'lists', isLocked = true;

// ========== Initialization ==========
window.onload = () => {
    // טעינת גוגל
    if (typeof gapi !== 'undefined') {
        gapi.load('client', async () => {
            await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] });
            gapiInited = true;
        });
    }
    if (typeof google !== 'undefined') {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID, scope: SCOPES,
            callback: (resp) => {
                if (resp.error) return;
                accessToken = resp.access_token;
                gapi.client.setToken(resp);
                isConnected = true;
                updateCloudIndicator('connected');
                loadFromCloud();
            }
        });
        gisInited = true;
    }
    // שחזור מצב לילה
    if (localStorage.getItem('VPLUS_DARK') === 'true') document.body.classList.add('dark-mode');
    document.getElementById('cloudBtn').onclick = () => { if(gisInited) tokenClient.requestAccessToken(); };
    render();
};

// ========== Core Logic ==========
function save() {
    localStorage.setItem('VPLUS_V2', JSON.stringify(db));
    render();
    if (isConnected) syncToCloud();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    // עיצוב טאבים
    document.getElementById('tabLists').className = `tab-btn flex-1 text-center py-3 rounded-xl font-bold transition-all ${activePage === 'lists' ? 'bg-white text-[#5851db] shadow-md' : 'text-gray-400'}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 text-center py-3 rounded-xl font-bold transition-all ${activePage === 'summary' ? 'bg-white text-[#5851db] shadow-md' : 'text-gray-400'}`;

    const list = db.lists[db.currentId];
    document.getElementById('listNameDisplay').innerText = list.name;

    list.items.forEach((item, idx) => {
        const sub = item.price * item.qty;
        total += sub; if (item.checked) paid += sub;
        const div = document.createElement('div');
        div.className = "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex flex-col transition-all";
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-3">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6 accent-indigo-600">
                    <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-300' : 'text-gray-800'}">${item.name}</span>
                </div>
                <button onclick="removeItem(${idx})" class="text-red-300"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2"/></svg></button>
            </div>
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1">
                    <button onclick="changeQty(${idx}, 1)" class="text-green-600 text-2xl font-bold">+</button>
                    <span class="font-bold w-6 text-center text-gray-900">${item.qty}</span>
                    <button onclick="changeQty(${idx}, -1)" class="text-red-600 text-2xl font-bold">-</button>
                </div>
                <span class="text-2xl font-black text-[#5851db]">₪${sub.toFixed(2)}</span>
            </div>`;
        container.appendChild(div);
    });

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Functions ==========
function addItem() {
    const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); save(); closeModal('inputForm'); }
}

function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('VPLUS_DARK', isDark);
}

function preparePrint() {
    const list = db.lists[db.currentId];
    let html = `<div dir="rtl" style="font-family:Arial; padding:20px;"><h2>רשימה: ${list.name}</h2><table border="1" style="width:100%; border-collapse:collapse;">`;
    html += `<tr><th>מוצר</th><th>כמות</th><th>מחיר</th><th>סה"כ</th></tr>`;
    list.items.forEach(i => {
        html += `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price}</td><td>${(i.qty*i.price).toFixed(2)}</td></tr>`;
    });
    html += `</table></div>`;
    const win = window.open('', '_blank');
    win.document.write(html); win.print();
}

// ========== Helpers ==========
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; render(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function updateCloudIndicator(s) { document.getElementById('cloudIndicator').className = `w-2.5 h-2.5 rounded-full ${s === 'connected' ? 'bg-green-500 shadow-sm' : 'bg-yellow-500'}`; }

// ========== Cloud Sync ==========
async function syncToCloud() {
    try {
        const res = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}'` });
        const fileId = res.result.files.length > 0 ? res.result.files[0].id : null;
        if (fileId) await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(db) });
    } catch (e) {}
}
async function loadFromCloud() {
    try {
        const res = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}'` });
        if (res.result.files.length > 0) {
            const file = await fetch(`https://www.googleapis.com/drive/v3/files/${res.result.files[0].id}?alt=media`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            db = await file.json(); save();
        }
    } catch (e) {}
}

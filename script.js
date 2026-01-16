const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'vplus_v3.json';

let db = JSON.parse(localStorage.getItem('VPLUS_V3')) || { currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', items: [] } } };
let gapiInited = false, gisInited = false, tokenClient, accessToken = null, isConnected = false;
let activePage = 'lists', isLocked = true;

window.onload = () => {
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
    if (localStorage.getItem('VPLUS_DARK') === 'true') document.body.classList.add('dark-mode');
    document.getElementById('cloudBtn').onclick = () => { if(gisInited) tokenClient.requestAccessToken(); };
    render();
};

function save() {
    localStorage.setItem('VPLUS_V3', JSON.stringify(db));
    render();
    if (isConnected) syncToCloud();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn flex-1 text-center py-3 rounded-xl font-bold transition-all ${activePage === 'lists' ? 'bg-white text-[#5851db] shadow-md' : 'text-gray-400'}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 text-center py-3 rounded-xl font-bold transition-all ${activePage === 'summary' ? 'bg-white text-[#5851db] shadow-md' : 'text-gray-400'}`;

    const list = db.lists[db.currentId];
    document.getElementById('listNameDisplay').innerText = list.name;

    list.items.forEach((item, idx) => {
        const sub = item.price * item.qty;
        total += sub; if (item.checked) paid += sub;
        const div = document.createElement('div');
        div.className = "item-card bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex flex-col";
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-3">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6 accent-indigo-600">
                    <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-300' : 'text-gray-800'}">${item.name}</span>
                </div>
                <button onclick="removeItem(${idx})" class="text-red-300 active:scale-90"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
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

    const lockBtn = document.getElementById('mainLockBtn');
    const lockSvg = document.getElementById('lockIconSvg');
    if (isLocked) {
        lockBtn.className = "w-12 h-12 bg-[#42a5f5] rounded-full flex items-center justify-center shadow-lg active:scale-90";
        lockSvg.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
    } else {
        lockBtn.className = "w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center shadow-lg active:scale-90";
        lockSvg.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v2"></path>';
    }
}

function addItem() {
    const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); save(); closeModal('inputForm'); }
}
function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }
function toggleDarkMode() { const isDark = document.body.classList.toggle('dark-mode'); localStorage.setItem('VPLUS_DARK', isDark); }
function preparePrint() {
    const list = db.lists[db.currentId];
    let html = `<div dir="rtl" style="font-family:Arial; padding:20px;"><h2>רשימה: ${list.name}</h2><table border="1" style="width:100%; border-collapse:collapse;"><tr><th>מוצר</th><th>כמות</th><th>סה"כ</th></tr>`;
    list.items.forEach(i => html += `<tr><td>${i.name}</td><td>${i.qty}</td><td>${(i.qty*i.price).toFixed(2)}</td></tr>`);
    const win = window.open('', '_blank'); win.document.write(html + `</table></div>`); win.print();
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; render(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function updateCloudIndicator(s) { document.getElementById('cloudIndicator').className = `w-2.5 h-2.5 rounded-full ${s === 'connected' ? 'bg-green-500 shadow-sm' : 'bg-yellow-500'}`; }

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

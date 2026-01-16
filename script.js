// ========== Google Drive Config ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'vplus_v5_data.json';

let db = JSON.parse(localStorage.getItem('VPLUS_DB_V5')) || { currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', items: [] } } };
let gapiInited = false, gisInited = false, tokenClient, accessToken = null, isConnected = false;
let activePage = 'lists', isLocked = true;

// Initialization
function gapiLoaded() {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
    });
}

function gisLoaded() {
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

async function handleCloudClick() {
    if (!gapiInited || !gisInited) return; // הסרת ה-alert המציק
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// Rendering Logic
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    // Tabs Styling
    document.getElementById('tabLists').className = `tab-btn flex-1 text-center py-4 rounded-2xl font-black transition-all ${activePage === 'lists' ? 'bg-white text-[#4f46e5] shadow-lg' : 'text-slate-400'}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 text-center py-4 rounded-2xl font-black transition-all ${activePage === 'summary' ? 'bg-white text-[#4f46e5] shadow-lg' : 'text-slate-400'}`;

    const list = db.lists[db.currentId];
    document.getElementById('listNameDisplay').innerText = list.name;

    list.items.forEach((item, idx) => {
        const sub = item.price * item.qty;
        total += sub; if (item.checked) paid += sub;
        const div = document.createElement('div');
        div.className = "bg-white p-5 rounded-[25px] shadow-sm border border-slate-100 flex flex-col gap-4";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-8 h-8 accent-[#4f46e5] rounded-xl">
                    <span class="text-2xl font-bold ${item.checked ? 'line-through text-slate-300' : 'text-slate-800'}">${item.name}</span>
                </div>
                <button onclick="removeItem(${idx})" class="text-red-300 active:scale-90">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-100">
                    <button onclick="changeQty(${idx}, 1)" class="text-green-600 text-3xl font-black">+</button>
                    <span class="font-black text-2xl w-8 text-center text-slate-900">${item.qty}</span>
                    <button onclick="changeQty(${idx}, -1)" class="text-red-600 text-3xl font-black">-</button>
                </div>
                <span class="text-3xl font-black text-[#4f46e5]">₪${sub.toFixed(2)}</span>
            </div>`;
        container.appendChild(div);
    });

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// שאר הפונקציות נשארות זהות (save, addItem, etc.)
function save() { localStorage.setItem('VPLUS_DB_V5', JSON.stringify(db)); render(); if (isConnected) syncToCloud(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function addItem() {
    const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); save(); closeModal('inputForm'); }
}
function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; render(); }
function updateCloudIndicator(s) { document.getElementById('cloudIndicator').className = `w-3 h-3 rounded-full ${s === 'connected' ? 'bg-green-500 shadow-sm' : 'bg-yellow-500 animate-pulse'}`; }

window.onload = () => {
    document.getElementById('cloudBtn').onclick = handleCloudClick;
    render();
};

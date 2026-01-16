// ========== Google Drive Config ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false, gisInited = false, tokenClient, accessToken = null, isConnected = false;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', items: [] } }, fontSize: 16
};
let isLocked = true, activePage = 'lists', currentEditIdx = null;

// ========== Global Functions (For HTML) ==========
window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');
window.showPage = (p) => { activePage = p; render(); };
window.toggleLock = () => { isLocked = !isLocked; render(); };

window.gapiLoaded = () => {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
        gapiInited = true;
    });
};

window.gisLoaded = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.file', callback: ''
    });
    gisInited = true;
};

window.handleCloudClick = async () => {
    if (!gapiInited || !gisInited) { alert("טוען חיבור לגוגל..."); return; }
    if (isConnected) { await loadAndMerge(); } 
    else {
        tokenClient.callback = async (resp) => {
            if (resp.error) return;
            accessToken = resp.access_token;
            gapi.client.setToken(resp);
            isConnected = true;
            updateCloudIndicator('connected');
            await loadAndMerge();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
};

// ========== Render Logic (The UI Fix) ==========
function render() {
    document.getElementById('pageLists').classList.toggle('hidden', activePage !== 'lists');
    document.getElementById('pageSummary').classList.toggle('hidden', activePage !== 'summary');
    
    document.getElementById('tabLists').className = `tab-btn flex-1 ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 ${activePage === 'summary' ? 'tab-active' : ''}`;

    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    container.innerHTML = '';
    let total = 0, paid = 0;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'פתוח לעריכה';

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="window.toggleItem(${idx})" class="w-7 h-7">
                        <div class="item-name font-bold ${item.checked ? 'line-through text-gray-300' : ''}" style="font-size:${db.fontSize}px">${item.name}</div>
                    </div>
                    ${!isLocked ? `<button onclick="window.removeItem(${idx})" class="trash-btn">🗑️</button>` : ''}
                </div>
                <div class="flex justify-between mt-3">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2">
                        <button onclick="window.changeQty(${idx}, 1)" class="text-green-600 font-bold">+</button>
                        <span>${item.qty}</span>
                        <button onclick="window.changeQty(${idx}, -1)" class="text-red-600 font-bold">-</button>
                    </div>
                    <span onclick="window.openEditTotalModal(${idx})" class="font-black text-indigo-600 cursor-pointer">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Actions ==========
window.addItem = () => {
    const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); save(); closeModal('inputForm'); }
};
window.toggleItem = (i) => { db.lists[db.currentId].items[i].checked = !db.lists[db.currentId].items[i].checked; save(); };
window.removeItem = (i) => { db.lists[db.currentId].items.splice(i, 1); save(); };
window.changeQty = (i, d) => { if(db.lists[db.currentId].items[i].qty + d > 0) { db.lists[db.currentId].items[i].qty += d; save(); } };
window.openEditTotalModal = (i) => { currentEditIdx = i; openModal('editTotalModal'); };
window.saveTotal = () => {
    const v = parseFloat(document.getElementById('editTotalInput').value);
    if(v) { db.lists[db.currentId].items[currentEditIdx].price = v / db.lists[db.currentId].items[currentEditIdx].qty; save(); closeModal('editTotalModal'); }
};

function save() { localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db)); render(); if(isConnected) syncToCloud(); }

window.onload = render;

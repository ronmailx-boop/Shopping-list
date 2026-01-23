// ========== Google Drive Config (מקור) ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false, gisInited = false, tokenClient, accessToken = null;
let isSyncing = false, isConnected = false;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let showOnlyMissing = false;
let sortableInstance = null;

// ========== Core Functions ==========
function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) syncToCloud();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0, paid = 0, count = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    if (btn && path) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
        tag.innerText = isLocked ? "נעול" : "עריכה פעילה (גרירה מופעלת)";
    }

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub;
            count++;

            if (showOnlyMissing && item.checked) return;

            const div = document.createElement('div');
            div.className = "item-card";
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2 flex-1">
                        <span class="item-index">${idx + 1}</span>
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round"></path></svg>
                    </button>
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
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0; l.items.forEach(i => lT += (i.price * i.qty));
            const isSel = db.selectedInSummary.includes(id);
            if (isSel) total += lT;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                    </div>
                    <span class="text-xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayCount').innerText = count;
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== Logic Functions ==========
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function toggleSum(id) { const i = db.selectedInSummary.indexOf(id); if(i>-1) db.selectedInSummary.splice(i,1); else db.selectedInSummary.push(id); save(); }
function showPage(p) { activePage = p; showOnlyMissing = false; save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty+d >= 1) { db.lists[db.currentId].items[idx].qty+=d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); closeModal('inputForm'); save(); }
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

function handleBottomBarClick(e) {
    if (!e.target.closest('button') && !e.target.closest('input')) {
        document.querySelector('.bottom-bar').classList.toggle('minimized');
    }
}

// ========== Professional PDF Export ==========
function preparePrint() {
    closeModal('settingsModal');
    let grandTotal = 0;
    let html = `<div dir="rtl" style="font-family:sans-serif; padding:20px;">
                <h1 style="text-align:center; color:#7367f0;">Vplus - דוח קניות מפורט</h1>`;
    
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        let lT = 0;
        html += `<h2 style="border-bottom:2px solid #7367f0;">${l.name}</h2>
                 <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                 <tr style="background:#f4f7fa;">
                    <th style="padding:10px; border:1px solid #ddd; text-align:right;">מוצר</th>
                    <th style="padding:10px; border:1px solid #ddd; text-align:center;">כמות</th>
                    <th style="padding:10px; border:1px solid #ddd; text-align:left;">סה"כ</th>
                 </tr>`;
        l.items.forEach(i => {
            const s = i.price * i.qty; lT += s;
            html += `<tr>
                        <td style="padding:10px; border:1px solid #ddd;">${i.name}</td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">${i.qty}</td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:left;">₪${s.toFixed(2)}</td>
                     </tr>`;
        });
        html += `</table><p style="text-align:left; font-weight:bold;">סה"כ רשימה: ₪${lT.toFixed(2)}</p>`;
        grandTotal += lT;
    });
    html += `<h2 style="text-align:center; margin-top:40px; padding:20px; border:4px double #7367f0;">סה"כ לתשלום: ₪${grandTotal.toFixed(2)}</h2></div>`;
    
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close();
    setTimeout(() => { win.print(); }, 500);
}

// ========== Search & Filters ==========
function handleSearch(q) {
    const sug = document.getElementById('searchSuggestions');
    if (!q) { sug.classList.add('hidden'); return; }
    sug.innerHTML = '';
    db.lists[db.currentId].items.forEach((item, idx) => {
        if (item.name.includes(q)) {
            const d = document.createElement('div');
            d.innerHTML = item.name;
            d.onclick = () => { highlightItem(idx); sug.classList.add('hidden'); document.getElementById('globalSearch').value = ''; };
            sug.appendChild(d);
        }
    });
    sug.classList.toggle('hidden', sug.innerHTML === '');
}

function highlightItem(idx) {
    const el = document.querySelector(`[data-id="${idx}"]`);
    if (el) { el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-search'); setTimeout(()=>el.classList.remove('highlight-search'),3000); }
}

function toggleMissingFilter() { showOnlyMissing = !showOnlyMissing; document.getElementById('filterBanner').classList.toggle('hidden', !showOnlyMissing); render(); }

// ========== Helpers & Init ==========
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) sortableInstance = Sortable.create(el, { animation: 150, onEnd: () => {
        const order = Array.from(el.children).map(c => parseInt(c.dataset.id));
        const items = db.lists[db.currentId].items;
        db.lists[db.currentId].items = order.map(i => items[i]);
        save();
    }});
}

window.addEventListener('DOMContentLoaded', render);

// ========== Google Scripts ==========
const loadJS = (src, cb) => { const s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s); };
loadJS('https://apis.google.com/js/api.js', () => gapi.load('client', () => gapi.client.init({apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC]})));
loadJS('https://accounts.google.com/gsi/client', () => tokenClient = google.accounts.oauth2.initTokenClient({client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: ''}));

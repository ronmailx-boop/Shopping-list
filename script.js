// ========== Google Drive Configuration (מקור) ==========
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

    // עדכון כפתור נעילה וסטטוס
    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    if (btn && path && tag) {
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

            const div = document.createElement('div');
            div.className = "item-card";
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2 flex-1">
                        <span class="item-index font-bold text-indigo-600 bg-indigo-50 px-2 rounded-lg">${idx + 1}</span>
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
                        <div class="flex-1 text-2xl font-bold cursor-pointer" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                    </div>
                    <span class="text-xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== Logic & Actions ==========
function showPage(p) { activePage = p; save(); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function toggleSum(id) { const i = db.selectedInSummary.indexOf(id); if(i>-1) db.selectedInSummary.splice(i,1); else db.selectedInSummary.push(id); save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty+d >= 1) { db.lists[db.currentId].items[idx].qty+=d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false });
        closeModal('inputForm');
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

function toggleBottomBarFromEvent(e) {
    const bar = document.querySelector('.bottom-bar');
    bar.classList.toggle('minimized');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    closeModal('settingsModal');
}

// ========== Professional PDF (מקור) ==========
function preparePrint() {
    closeModal('settingsModal');
    let grandTotal = 0;
    let html = `<div dir="rtl" style="font-family:Arial, sans-serif; padding:30px;">
                <h1 style="text-align:center; color:#7367f0; border-bottom:4px double #7367f0; padding-bottom:10px;">Vplus - דוח קניות מפורט</h1>`;
    
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        let listTotal = 0;
        html += `<h2 style="color:#444; margin-top:30px;">${l.name}</h2>
                 <table style="width:100%; border-collapse:collapse; margin-bottom:10px; border:1px solid #eee;">
                 <tr style="background:#f8f9fa;">
                    <th style="padding:12px; border:1px solid #eee; text-align:right;">מוצר</th>
                    <th style="padding:12px; border:1px solid #eee; text-align:center;">כמות</th>
                    <th style="padding:12px; border:1px solid #eee; text-align:left;">סה"כ</th>
                 </tr>`;
        l.items.forEach(i => {
            const s = i.price * i.qty; listTotal += s;
            html += `<tr>
                        <td style="padding:10px; border:1px solid #eee;">${i.name}</td>
                        <td style="padding:10px; border:1px solid #eee; text-align:center;">${i.qty}</td>
                        <td style="padding:10px; border:1px solid #eee; text-align:left;">₪${s.toFixed(2)}</td>
                     </tr>`;
        });
        html += `</table><p style="text-align:left; font-weight:bold; font-size:1.1em;">סה"כ רשימה: ₪${listTotal.toFixed(2)}</p>`;
        grandTotal += listTotal;
    });
    html += `<div style="text-align:center; margin-top:50px; padding:20px; border:3px solid #7367f0; background:#f0eeff; font-size:1.8em; font-weight:900;">סה"כ כולל לתשלום: ₪${grandTotal.toFixed(2)}</div></div>`;
    
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close();
    setTimeout(() => { win.print(); }, 500);
}

// ========== Modal Utils ==========
function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
    if (id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 200);
    }
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ========== Init & Listeners ==========
window.addEventListener('DOMContentLoaded', () => {
    // הוספה מהירה: Enter בשם עובר למחיר, Enter במחיר מוסיף מוצר
    document.getElementById('itemName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('itemPrice').focus(); }
    });
    document.getElementById('itemPrice').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addItem(); }
    });

    render();
});

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { animation: 150, onEnd: () => {
            const order = Array.from(el.children).map(c => parseInt(c.dataset.id));
            const items = db.lists[db.currentId].items;
            db.lists[db.currentId].items = order.map(i => items[i]);
            save();
        }});
    }
}

// Google Scripts (מקור)
const loadJS = (src, cb) => { const s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s); };
loadJS('https://apis.google.com/js/api.js', () => gapi.load('client', () => gapi.client.init({apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC]})));
loadJS('https://accounts.google.com/gsi/client', () => tokenClient = google.accounts.oauth2.initTokenClient({client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: ''}));

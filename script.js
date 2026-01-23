// ========== Google Drive Configuration ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiInited = false;
let gisInited = false;
let tokenClient;
let accessToken = null;
let driveFileId = null;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let showMissingOnly = false;
let highlightedItemIndex = null;

// ========== Core Logic ==========
function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    
    container.innerHTML = '';
    let total = 0, paid = 0;

    // Tabs UI
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        
        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        
        const itemsToShow = showMissingOnly ? list.items.filter(i => !i.checked) : list.items;
        document.getElementById('itemCountDisplay').innerText = `${itemsToShow.length} מוצרים`;

        itemsToShow.forEach((item, idx) => {
            const originalIdx = list.items.indexOf(item);
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub;

            const div = document.createElement('div');
            div.className = `item-card ${highlightedItemIndex === originalIdx ? 'highlighted' : ''}`;
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${originalIdx})" class="w-7 h-7">
                        <div class="text-xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    ${!isLocked ? `<button onclick="removeItem(${originalIdx})" class="text-red-500 p-2">✕</button>` : ''}
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
                        <button onclick="changeQty(${originalIdx}, 1)" class="text-green-600 font-bold text-xl px-2">+</button>
                        <span class="font-bold text-lg">${item.qty}</span>
                        <button onclick="changeQty(${originalIdx}, -1)" class="text-red-600 font-bold text-xl px-2">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${originalIdx})" class="text-xl font-black text-indigo-600 cursor-pointer">₪${sub.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        renderSummaryPage(container);
    }

    // Update Bottom Bar
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

function renderSummaryPage(container) {
    document.getElementById('pageLists').classList.add('hidden');
    document.getElementById('pageSummary').classList.remove('hidden');
    
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        const div = document.createElement('div');
        div.className = "item-card cursor-pointer hover:bg-indigo-50";
        div.onclick = () => { db.currentId = id; showPage('lists'); };
        div.innerHTML = `<div class="font-bold text-lg">${l.name}</div><div class="text-sm opacity-60">${l.items.length} מוצרים</div>`;
        container.appendChild(div);
    });
}

// ========== User Actions ==========
function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false });
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        closeModal('inputForm');
        save();
    }
}

function changeQty(idx, delta) {
    const item = db.lists[db.currentId].items[idx];
    if (item.qty + delta >= 1) {
        item.qty += delta;
        save();
    }
}

function removeItem(idx) {
    if (confirm('למחוק את המוצר?')) {
        db.lists[db.currentId].items.splice(idx, 1);
        save();
    }
}

function showPage(page) {
    activePage = page;
    save();
}

function toggleLock() {
    isLocked = !isLocked;
    const path = document.getElementById('lockIconPath');
    if (isLocked) {
        path.setAttribute('d', 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z');
        document.getElementById('statusTag').innerText = "נעול";
    } else {
        path.setAttribute('d', 'M8 11V7a4 4 0 118 0m-4 8v2M7 21h10a2 2 0 002-2v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z');
        document.getElementById('statusTag').innerText = "עריכה פעילה";
    }
    render();
}

// ========== Modal Logic ==========
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openEditTotalModal(idx) {
    currentEditIdx = idx;
    const item = db.lists[db.currentId].items[idx];
    document.getElementById('editTotalInput').value = (item.price * item.qty).toFixed(2);
    openModal('editTotalModal');
}

function saveTotal() {
    const val = parseFloat(document.getElementById('editTotalInput').value);
    if (!isNaN(val) && currentEditIdx !== null) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        save();
    }
    closeModal('editTotalModal');
}

function executeClear() {
    db.lists[db.currentId].items = [];
    closeModal('confirmModal');
    save();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// ========== Init ==========
window.onload = () => {
    render();
    
    // סגירת מודאלים בלחיצה בחוץ
    window.onclick = (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.classList.remove('active');
        }
    };
};

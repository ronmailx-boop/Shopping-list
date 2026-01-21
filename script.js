// ========== פונקציית מזעור הבר ==========
function toggleBottomBar(e) {
    if (e.target.closest('button')) return;
    const bottomBar = document.querySelector('.bottom-bar');
    if (bottomBar) {
        bottomBar.classList.toggle('minimized');
    }
}

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

// ========== לוגיקת האפליקציה ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists',
    lastSync: 0
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;

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

// --- פונקציות הוספה וניהול ---

function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (!name) return;
    db.lists[db.currentId].items.push({ name, price, qty: 1, checked: false });
    closeModal('inputForm');
    save();
}

function saveNewList() {
    const name = document.getElementById('newListNameInput').value.trim();
    const url = document.getElementById('newListUrlInput').value.trim();
    if (!name) return;
    const id = 'L' + Date.now();
    db.lists[id] = { name, url, items: [] };
    db.currentId = id;
    closeModal('newListModal');
    showPage('lists');
}

function importFromText() {
    const text = document.getElementById('importText').value;
    if (!text) return;
    const lines = text.split('\n');
    lines.forEach(line => {
        const cleanLine = line.replace(/^\d+[\s.)]*/, '').trim();
        if (cleanLine) {
            db.lists[db.currentId].items.push({ name: cleanLine, price: 0, qty: 1, checked: false });
        }
    });
    closeModal('importModal');
    save();
}

function changeQty(idx, delta) {
    const item = db.lists[db.currentId].items[idx];
    item.qty = Math.max(1, item.qty + delta);
    save();
}

function removeItem(idx) {
    db.lists[db.currentId].items.splice(idx, 1);
    save();
}

function executeClear() {
    db.lists[db.currentId].items = [];
    closeModal('confirmModal');
    save();
}

function prepareDeleteList(id) {
    listToDelete = id;
    openModal('deleteListModal');
}

function deleteFullList() {
    if (listToDelete && Object.keys(db.lists).length > 1) {
        delete db.lists[listToDelete];
        if (db.currentId === listToDelete) db.currentId = Object.keys(db.lists)[0];
        listToDelete = null;
        closeModal('deleteListModal');
        save();
    }
}

function openEditTotalModal(idx) {
    currentEditIdx = idx;
    document.getElementById('editTotalInput').value = db.lists[db.currentId].items[idx].price;
    openModal('editTotalModal');
}

function saveTotal() {
    const newPrice = parseFloat(document.getElementById('editTotalInput').value) || 0;
    db.lists[db.currentId].items[currentEditIdx].price = newPrice;
    closeModal('editTotalModal');
    save();
}

function saveListName() {
    const name = document.getElementById('editListNameInput').value.trim();
    const url = document.getElementById('editListUrlInput').value.trim();
    if (name) {
        db.lists[db.currentId].name = name;
        db.lists[db.currentId].url = url;
        closeModal('editListNameModal');
        save();
    }
}

// --- ניהול תצוגה וממשק ---

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
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

function toggleLock() {
    isLocked = !isLocked;
    render();
}

function showPage(p) { 
    activePage = p; 
    save(); 
}

function openModal(id) { 
    const m = document.getElementById(id);
    if(m) m.classList.add('active'); 
}

function closeModal(id) { 
    const m = document.getElementById(id); 
    if(m) m.classList.remove('active'); 
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    closeModal('settingsModal');
}

function preparePrint() {
    window.print();
    closeModal('settingsModal');
}

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (!el || activePage !== 'lists') return;
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = Sortable.create(el, {
        disabled: isLocked,
        animation: 150,
        onEnd: (evt) => {
            const items = db.lists[db.currentId].items;
            const [movedItem] = items.splice(evt.oldIndex, 1);
            items.splice(evt.newIndex, 0, movedItem);
            save();
        }
    });
}

function shareNative(type) {
    let text = "";
    if (type === 'list') {
        const list = db.lists[db.currentId];
        text = `*${list.name}*\n`;
        list.items.forEach(i => text += `${i.checked ? '✅' : '▫️'} ${i.name} - ₪${(i.price * i.qty).toFixed(2)}\n`);
    }
    if (navigator.share) {
        navigator.share({ title: 'Vplus', text: text });
    } else {
        alert("הדפדפן לא תומך בשיתוף");
    }
}

// --- Google Drive & Sync (חלקי/לדוגמה) ---
function syncToCloud() {
    console.log("Syncing to cloud...");
    document.getElementById('cloudIndicator').className = "w-2 h-2 bg-green-500";
}

// --- Render ---
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const statusTag = document.getElementById('statusTag');
    if (statusTag) statusTag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; 
            total += sub; 
            if (item.checked) paid += sub;
            const div = document.createElement('div'); 
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${idx + 1}. ${item.name}</div>
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
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0;
            l.items.forEach(i => lT += i.price * i.qty);
            const isSel = db.selectedInSummary.includes(id);
            if (isSel) total += lT;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                    <div class="flex-1 text-2xl font-bold px-4" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                    <button onclick="prepareDeleteList('${id}')" class="trash-btn">🗑️</button>
                </div>
                <div class="text-left font-black text-indigo-600 mt-2">₪${lT.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    }
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

window.addEventListener('DOMContentLoaded', () => {
    const bottomBar = document.querySelector('.bottom-bar');
    if (bottomBar) {
        bottomBar.addEventListener('click', toggleBottomBar);
        const interactiveElements = bottomBar.querySelectorAll('button, input');
        interactiveElements.forEach(el => el.addEventListener('click', (e) => e.stopPropagation()));
    }
    render();
});

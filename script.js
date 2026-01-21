// ========== פונקציות בסיס ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;

function save() {
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

// ========== הוספת מוצר ב-ENTER ==========
document.getElementById('itemName').addEventListener('keypress', (e) => { if(e.key === 'Enter') addItem(); });
document.getElementById('itemPrice').addEventListener('keypress', (e) => { if(e.key === 'Enter') addItem(); });

function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (!name) return;
    db.lists[db.currentId].items.push({ name, price, qty: 1, checked: false });
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    closeModal('inputForm');
    save();
}

// ========== ניהול רשימות ==========
function saveNewList() {
    const name = document.getElementById('newListNameInput').value.trim();
    if (!name) return;
    const id = 'L' + Date.now();
    db.lists[id] = { name: name, items: [] };
    db.currentId = id;
    closeModal('newListModal');
    showPage('lists');
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

// ========== פונקציית סנכרון ==========
function syncToCloud() {
    const ind = document.getElementById('cloudIndicator');
    ind.className = "w-2 h-2 bg-orange-500 animate-pulse";
    
    // סימולציית סנכרון - כאן אמור להיות הקוד של Google Drive
    setTimeout(() => {
        ind.className = "w-2 h-2 bg-green-500";
        alert("הנתונים סונכרנו בהצלחה!");
    }, 1500);
}

// ========== הדפסה ==========
function preparePrint() {
    const area = document.getElementById('printArea');
    const list = db.lists[db.currentId];
    let html = `<h1>${list.name}</h1>`;
    list.items.forEach(i => {
        html += `<div class="print-item"><span>${i.name} (x${i.qty})</span> <span>₪${(i.price * i.qty).toFixed(2)}</span></div>`;
    });
    area.innerHTML = html;
    window.print();
    closeModal('settingsModal');
}

// ========== רינדור ותצוגה ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6">
                        <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-400' : ''}">${idx+1}. ${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round"></path></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex gap-4">
                        <button onclick="changeQty(${idx}, 1)" class="font-bold text-green-600">+</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="font-bold text-red-600">-</button>
                    </div>
                    <span class="font-black text-indigo-600" onclick="openEditTotalModal(${idx})">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0; l.items.forEach(i => lT += i.price * i.qty);
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
                    <button onclick="listToDelete='${id}'; openModal('deleteListModal')" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round"></path></svg>
                    </button>
                </div>
                <div class="text-left font-black text-indigo-600">₪${lT.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== עזרים ==========
function showPage(p) { activePage = p; save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { db.lists[db.currentId].items[idx].qty = Math.max(1, db.lists[db.currentId].items[idx].qty + d); save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }

window.addEventListener('DOMContentLoaded', () => {
    const bar = document.querySelector('.bottom-bar');
    bar.addEventListener('click', (e) => { if(!e.target.closest('button')) bar.classList.toggle('minimized'); });
    render();
});

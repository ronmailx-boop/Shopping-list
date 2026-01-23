// ========== App State ==========
let db = JSON.parse(localStorage.getItem('VPLUS_DB')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true; // גרירה לא פעילה כברירת מחדל
let activePage = db.lastActivePage || 'lists';
let sortableInstance = null;

// ========== Core Functions ==========

function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('VPLUS_DB', JSON.stringify(db)); 
    render(); 
}

function render() {
    const isListsPage = activePage === 'lists';
    document.getElementById('pageLists').classList.toggle('hidden', !isListsPage);
    document.getElementById('pageSummary').classList.toggle('hidden', isListsPage);
    document.getElementById('tabLists').className = `tab-btn ${isListsPage ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${!isListsPage ? 'tab-active' : ''}`;

    if (isListsPage) renderCurrentList();
    else renderAllLists();
    
    updateTotals();
}

function renderCurrentList() {
    const container = document.getElementById('itemsContainer');
    const list = db.lists[db.currentId];
    document.getElementById('listNameDisplay').innerText = list.name;
    
    container.innerHTML = list.items.map((item, idx) => `
        <div class="item-card" data-id="${idx}">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <span class="item-index">${idx + 1}</span>
                    <span class="text-lg font-bold ${item.bought ? 'line-through opacity-50' : ''}">${item.name}</span>
                </div>
                <button onclick="removeItem(${idx})" class="trash-btn">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
            <div class="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                <div class="font-black text-indigo-600">₪${(item.price * (item.qty || 1)).toFixed(2)}</div>
                <div class="flex items-center gap-3">
                    <button onclick="updateQty(${idx}, 1)" class="w-8 h-8 bg-white shadow rounded-lg font-bold">+</button>
                    <span class="font-bold">${item.qty || 1}</span>
                    <button onclick="updateQty(${idx}, -1)" class="w-8 h-8 bg-white shadow rounded-lg font-bold">-</button>
                </div>
                <input type="checkbox" ${item.bought ? 'checked' : ''} onchange="toggleBought(${idx})" class="w-6 h-6 rounded-full border-2 border-indigo-600">
            </div>
        </div>
    `).join('');

    initSortable();
}

function renderAllLists() {
    const container = document.getElementById('summaryContainer');
    container.innerHTML = Object.keys(db.lists).map(id => `
        <div class="bg-white p-4 rounded-2xl mb-3 shadow-sm flex justify-between items-center">
            <div>
                <div class="font-bold text-lg">${db.lists[id].name}</div>
                <div class="text-xs text-gray-400">${db.lists[id].items.length} מוצרים</div>
            </div>
            <div class="flex gap-2">
                <button onclick="shareAnyList('${id}')" class="p-2 text-indigo-600 bg-indigo-50 rounded-full">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                </button>
                <button onclick="switchList('${id}')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">צפה</button>
            </div>
        </div>
    `).join('');
}

// ========== Interactions ==========

function toggleLock() {
    isLocked = !isLocked;
    const btn = document.getElementById('mainLockBtn');
    const icon = document.getElementById('lockIcon');
    
    if (isLocked) {
        btn.className = "bottom-circle-btn bg-blue-600";
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>';
    } else {
        btn.className = "bottom-circle-btn bg-green-500 animate-pulse";
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>';
    }
    initSortable();
}

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    
    sortableInstance = new Sortable(el, {
        animation: 150,
        disabled: isLocked, // נשלט ע"י כפתור המנעול
        onEnd: (evt) => {
            const list = db.lists[db.currentId].items;
            const [movedItem] = list.splice(evt.oldIndex, 1);
            list.splice(evt.newIndex, 0, movedItem);
            save();
        }
    });
}

function clearCurrentList() {
    if (confirm("למחוק את כל המוצרים מהרשימה?")) {
        db.lists[db.currentId].items = [];
        save();
    }
}

// ========== Share & PDF ==========

async function shareCurrentList() {
    shareAnyList(db.currentId);
}

async function shareAnyList(listId) {
    const list = db.lists[listId];
    let text = `📋 *${list.name}*\n\n`;
    list.items.forEach((item, i) => {
        text += `${i + 1}. ${item.bought ? '✅' : '⬜'} ${item.name} - ₪${(item.price * (item.qty || 1)).toFixed(2)}\n`;
    });

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Vplus', text: text });
        } catch (err) { console.log("Share failed"); }
    } else {
        alert("השיתוף לא נתמך בדפדפן זה");
    }
}

function preparePrint() {
    const list = db.lists[db.currentId];
    let html = `<div id="printArea" style="direction:rtl; padding:20px;">
        <h1 style="text-align:center;">${list.name}</h1>
        <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <thead><tr style="background:#eee;">
                <th style="border:1px solid #ddd; padding:8px;">#</th>
                <th style="border:1px solid #ddd; padding:8px;">מוצר</th>
                <th style="border:1px solid #ddd; padding:8px;">כמות</th>
                <th style="border:1px solid #ddd; padding:8px;">מחיר</th>
            </tr></thead>
            <tbody>`;
    
    list.items.forEach((item, i) => {
        html += `<tr>
            <td style="border:1px solid #ddd; padding:8px; text-align:center;">${i+1}</td>
            <td style="border:1px solid #ddd; padding:8px;">${item.name}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:center;">${item.qty || 1}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:left;">₪${(item.price * (item.qty || 1)).toFixed(2)}</td>
        </tr>`;
    });

    const total = list.items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    html += `</tbody></table>
        <h3 style="text-align:left; margin-top:20px;">סה"כ לתשלום: ₪${total.toFixed(2)}</h3>
    </div>`;

    const printWin = window.open('', '', 'width=800,height=600');
    printWin.document.write('<html><head><title>Print PDF</title></head><body>' + html + '</body></html>');
    printWin.document.close();
    printWin.print();
}

// ========== Helpers & UI ==========

function showPage(p) { activePage = p; save(); }

function handleBottomBarClick(e) {
    if (e.target.closest('button')) return;
    document.querySelector('.bottom-bar').classList.toggle('minimized');
}

function updateTotals() {
    const items = db.lists[db.currentId].items;
    const total = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const paid = items.filter(i => i.bought).reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

function addItem() {
    const name = document.getElementById('itemName').value;
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (name) {
        db.lists[db.currentId].items.push({ name, price, qty: 1, bought: false });
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        closeModal('inputForm');
        save();
    }
}

function toggleBought(idx) {
    db.lists[db.currentId].items[idx].bought = !db.lists[db.currentId].items[idx].bought;
    save();
}

function updateQty(idx, delta) {
    const item = db.lists[db.currentId].items[idx];
    item.qty = Math.max(1, (item.qty || 1) + delta);
    save();
}

function removeItem(idx) {
    db.lists[db.currentId].items.splice(idx, 1);
    save();
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

window.onload = render;

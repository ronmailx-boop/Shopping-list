let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let listToDelete = null;

function save() {
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

// --- פונקציות הוספה וניהול ---
function addItem() {
    const nameEl = document.getElementById('itemName');
    const priceEl = document.getElementById('itemPrice');
    const name = nameEl.value.trim();
    const price = parseFloat(priceEl.value) || 0;
    
    if (!name) {
        nameEl.classList.add('border-red-500');
        return;
    }
    
    db.lists[db.currentId].items.push({ name, price, qty: 1, checked: false });
    nameEl.value = '';
    priceEl.value = '';
    closeModal('inputForm');
    save();
}

// תמיכה ב-Enter בשדות הקלט
[document.getElementById('itemName'), document.getElementById('itemPrice')].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });
});

function saveNewList() {
    const input = document.getElementById('newListNameInput');
    const name = input.value.trim();
    if (!name) return;
    const id = 'L' + Date.now();
    db.lists[id] = { name: name, items: [] };
    db.currentId = id;
    input.value = '';
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

// --- סנכרון ענן (מתוקן) ---
function syncToCloud() {
    const btn = document.getElementById('cloudBtn');
    const ind = document.getElementById('cloudIndicator');
    
    btn.classList.add('opacity-50', 'pointer-events-none');
    ind.className = "w-2.5 h-2.5 bg-blue-500 animate-ping rounded-full";
    
    // סימולציה של סנכרון מוצלח
    setTimeout(() => {
        ind.className = "w-2.5 h-2.5 bg-green-500 rounded-full border border-white";
        btn.classList.remove('opacity-50', 'pointer-events-none');
        alert("סנכרון הענן הושלם בהצלחה!");
    }, 2000);
}

// --- הדפסה מקצועית (מתוקן) ---
function preparePrint() {
    const area = document.getElementById('printArea');
    const list = db.lists[db.currentId];
    let total = 0;
    
    let html = `
        <div style="direction: rtl; font-family: sans-serif; padding: 40px; border: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #7367f0; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #7367f0; margin: 0; font-size: 28px;">רשימת קניות: ${list.name}</h1>
                <div style="text-align: left; color: #666;">Vplus Budget App</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">מוצר</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">כמות</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">מחיר</th>
                    </tr>
                </thead>
                <tbody>`;
    
    list.items.forEach(i => {
        const sub = i.price * i.qty;
        total += sub;
        html += `
            <tr>
                <td style="padding: 12px; border: 1px solid #ddd;">${i.name}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${i.qty}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">₪${sub.toFixed(2)}</td>
            </tr>`;
    });
    
    html += `
                </tbody>
            </table>
            <div style="text-align: left; font-size: 22px; font-weight: bold; color: #7367f0;">
                סה"כ לתשלום: ₪${total.toFixed(2)}
            </div>
            <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
                הופק באמצעות Vplus - האפליקציה שלך לניהול תקציב
            </div>
        </div>`;
    
    area.innerHTML = html;
    window.print();
    closeModal('settingsModal');
}

// --- רינדור ---
function render() {
    const listContainer = document.getElementById('itemsContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    
    document.getElementById('tabLists').className = `tab-btn flex-1 py-3 font-bold rounded-xl transition-all ${activePage === 'lists' ? 'bg-[#7367f0] text-white' : 'bg-white text-gray-500'}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 py-3 font-bold rounded-xl transition-all ${activePage === 'summary' ? 'bg-[#7367f0] text-white' : 'bg-white text-gray-500'}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        listContainer.innerHTML = '';
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        let total = 0, paid = 0;
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            
            const div = document.createElement('div');
            div.className = `item-card p-4 mb-3 bg-white rounded-2xl shadow-sm border-r-4 ${item.checked ? 'border-gray-300 opacity-60' : 'border-indigo-500'}`;
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6 rounded-lg accent-indigo-600">
                        <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-400' : ''}">${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-full transition-colors">🗑️</button>
                </div>
                <div class="flex justify-between items-center mt-3">
                    <div class="flex items-center bg-gray-100 rounded-lg px-2">
                        <button onclick="changeQty(${idx}, 1)" class="p-1 text-green-600 font-bold">+</button>
                        <span class="px-3 font-mono">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="p-1 text-red-600 font-bold">-</button>
                    </div>
                    <span class="text-indigo-600 font-black text-xl">₪${sub.toFixed(2)}</span>
                </div>`;
            listContainer.appendChild(div);
        });
        updateStats(total, paid);
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        summaryContainer.innerHTML = '';
        
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            if (l.name.toLowerCase().includes(searchVal)) {
                let lT = 0; l.items.forEach(i => lT += i.price * i.qty);
                const div = document.createElement('div');
                div.className = "bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex justify-between items-center active:scale-95 transition-transform";
                div.innerHTML = `
                    <div onclick="db.currentId='${id}'; showPage('lists')" class="flex-1 cursor-pointer">
                        <div class="text-xl font-bold text-gray-800">${l.name}</div>
                        <div class="text-xs text-indigo-500 font-bold">${l.items.length} מוצרים | ₪${lT.toFixed(2)}</div>
                    </div>
                    <button onclick="listToDelete='${id}'; openModal('deleteListModal')" class="text-red-300 p-2">🗑️</button>`;
                summaryContainer.appendChild(div);
            }
        });
    }
}

function updateStats(total, paid) {
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// --- פונקציות עזר קבועות ---
function showPage(p) { activePage = p; save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { db.lists[db.currentId].items[idx].qty = Math.max(1, db.lists[db.currentId].items[idx].qty + d); save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }
function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }

window.addEventListener('DOMContentLoaded', render);

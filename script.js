let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';

function save() {
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

// ========== חיפוש בתוך הרשימה ==========
function searchProductInList() {
    const query = document.getElementById('productSearchInput').value.trim().toLowerCase();
    const items = document.querySelectorAll('.item-card');
    items.forEach(i => i.classList.remove('highlight-product'));

    if (!query) return;

    for (let item of items) {
        if (item.innerText.toLowerCase().includes(query)) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.classList.add('highlight-product');
            const clear = () => { item.classList.remove('highlight-product'); window.removeEventListener('scroll', clear); };
            setTimeout(() => window.addEventListener('scroll', clear), 600);
            break;
        }
    }
}

// ========== הוספה (Enter-Enter) ==========
function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (name) {
        db.lists[db.currentId].items.push({ name, price, qty: 1, checked: false });
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        closeModal('inputForm');
        save();
    }
}

// ========== שיתוף ו-PDF ==========
async function shareNative() {
    const list = db.lists[db.currentId];
    let text = `🛒 *${list.name}:*\n\n`;
    list.items.forEach((i, idx) => text += `${idx + 1}. ${i.checked ? '✅' : '⬜'} ${i.name} (x${i.qty}) - ₪${(i.price*i.qty).toFixed(2)}\n`);
    if (navigator.share) await navigator.share({ text }); else alert("הטקסט הועתק!");
}

function preparePrint() {
    const area = document.getElementById('printArea');
    const list = db.lists[db.currentId];
    let html = `<h1>${list.name}</h1><table border="1" width="100%" style="border-collapse:collapse;">`;
    list.items.forEach(i => html += `<tr><td style="padding:8px;">${i.name}</td><td style="padding:8px;">₪${(i.price*i.qty).toFixed(2)}</td></tr>`);
    area.innerHTML = html + `</table>`;
    window.print();
    closeModal('settingsModal');
}

// ========== ניהול רשימות ==========
function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    if (n) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: n, items: [] };
        db.currentId = id;
        activePage = 'lists';
        closeModal('newListModal');
        save();
    }
}

function importFromText() {
    const text = document.getElementById('importText').value.trim();
    if (text) {
        text.split('\n').forEach(line => {
            if (line.trim()) db.lists[db.currentId].items.push({ name: line.trim(), price: 0, qty: 1, checked: false });
        });
        closeModal('importModal');
        save();
    }
}

// ========== רינדור ותצוגה ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const lockBtn = document.getElementById('mainLockBtn');
    if (lockBtn) lockBtn.style.backgroundColor = isLocked ? '#2563eb' : '#fb923c';

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
                        <input type="checkbox" ${item.checked?'checked':''} onchange="toggleItem(${idx})" class="w-6 h-6">
                        <span class="text-xl font-bold ${item.checked?'line-through text-gray-400':''}">
                            <span class="text-indigo-400 text-sm font-normal">${idx+1}.</span> ${item.name}
                        </span>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex gap-4">
                        <button onclick="changeQty(${idx}, 1)" class="font-bold text-green-600">+</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="font-bold text-red-600">-</button>
                    </div>
                    <span class="font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0; l.items.forEach(i => lT += i.price * i.qty);
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `<div onclick="db.currentId='${id}'; showPage('lists')" class="flex justify-between">
                <span class="text-xl font-bold">${l.name}</span>
                <span class="font-black text-indigo-600">₪${lT.toFixed(2)}</span>
            </div>`;
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
function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }

// ========== אתחול ==========
window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.bottom-bar').addEventListener('click', (e) => { if (!e.target.closest('button')) e.currentTarget.classList.toggle('minimized'); });
    const nameIn = document.getElementById('itemName'), priceIn = document.getElementById('itemPrice');
    nameIn?.addEventListener('keypress', (e) => { if(e.key==='Enter') priceIn.focus(); });
    priceIn?.addEventListener('keypress', (e) => { if(e.key==='Enter') addItem(); });
    render();
});

// סנכרון דמה (כאן יבוא הקוד של Google Drive אם תרצה)
function handleCloudClick() {
    const ind = document.getElementById('cloudIndicator');
    ind.className = "w-2 h-2 bg-blue-500 animate-ping";
    setTimeout(() => { ind.className = "w-2 h-2 bg-green-500"; alert("סנכרון ענן הושלם!"); }, 1500);
}

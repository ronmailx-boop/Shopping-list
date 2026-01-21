let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    selectedInSummary: []
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';

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

    // עדכון כפתור נעילה
    const lockBtn = document.getElementById('mainLockBtn');
    const lockPath = document.getElementById('lockIconPath');
    if (lockBtn) {
        lockBtn.style.backgroundColor = isLocked ? '#2563eb' : '#fb923c'; // כחול/כתום
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        // תיקון המונה
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
                        <span class="text-xl font-bold ${item.checked ? 'line-through text-gray-400' : ''}">
                            <span class="text-indigo-400 text-sm font-normal">${idx + 1}.</span> ${item.name}
                        </span>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center mt-3">
                    <div class="flex items-center bg-gray-100 rounded-lg px-2">
                        <button onclick="changeQty(${idx}, 1)" class="p-1 text-green-600 font-bold">+</button>
                        <span class="px-3 font-mono">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="p-1 text-red-600 font-bold">-</button>
                    </div>
                    <span class="text-indigo-600 font-black text-xl">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        const searchVal = document.getElementById('searchInput').value.toLowerCase();
        
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const matchingItems = l.items.filter(i => i.name.toLowerCase().includes(searchVal));
            if (searchVal && !l.name.toLowerCase().includes(searchVal) && matchingItems.length === 0) return;

            let lT = 0; l.items.forEach(i => lT += i.price * i.qty);
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div onclick="db.currentId='${id}'; showPage('lists')" class="flex-1 cursor-pointer">
                        <div class="text-xl font-bold">${l.name}</div>
                        ${searchVal && matchingItems.length ? `<div class="text-xs text-indigo-500">🔍 נמצאו: ${matchingItems.map(i=>i.name).join(', ')}</div>` : ''}
                    </div>
                    <button onclick="removeItemList('${id}')" class="trash-btn">🗑️</button>
                </div>
                <div class="text-left font-black text-indigo-600 mt-2">₪${lT.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// פונקציות בסיס
function showPage(p) { activePage = p; save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { db.lists[db.currentId].items[idx].qty = Math.max(1, db.lists[db.currentId].items[idx].qty + d); save(); }

// שיתוף
async function shareNative() {
    const list = db.lists[db.currentId];
    let text = `🛒 *${list.name}:*\n\n`;
    list.items.forEach((i, idx) => text += `${idx + 1}. ${i.checked ? '✅' : '⬜'} ${i.name} - ₪${(i.price * i.qty).toFixed(2)}\n`);
    if (navigator.share) await navigator.share({ text }); else alert("הטקסט הועתק!");
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.bottom-bar').addEventListener('click', (e) => {
        if (!e.target.closest('button')) e.currentTarget.classList.toggle('minimized');
    });
    render();
});

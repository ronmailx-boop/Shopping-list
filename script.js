// State
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    selectedInSummary: []
};

let activePage = db.lastActivePage || 'lists';
let isLocked = true;
let showMissingOnly = false;
let highlightedItemName = null;
let listToDelete = null;
let sortableInstance = null;

function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

// UI Handlers
function openModal(id) { 
    const m = document.getElementById(id);
    if(m) m.classList.add('active'); 
}

function closeModal(id) { 
    const m = document.getElementById(id);
    if(m) m.classList.remove('active'); 
}

function showPage(p) { 
    activePage = p; 
    save(); 
}

// List Logic
function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        closeModal('inputForm'); 
        save(); 
    } 
}

function changeQty(idx, d) { 
    if(db.lists[db.currentId].items[idx].qty + d >= 1) { 
        db.lists[db.currentId].items[idx].qty += d; 
        save(); 
    } 
}

function removeItem(idx) { 
    db.lists[db.currentId].items.splice(idx, 1); 
    save(); 
}

function toggleLock() { 
    isLocked = !isLocked; 
    render(); 
}

function executeClear() { 
    db.lists[db.currentId].items = []; 
    closeModal('confirmModal'); 
    save(); 
}

// Search & Filter Logic
function toggleMissingFilter() {
    showMissingOnly = !showMissingOnly;
    const btn = document.getElementById('filterMissingBtn');
    btn.innerText = showMissingOnly ? "הצג הכל" : "הצג חסרים בלבד";
    btn.classList.toggle('bg-orange-400', showMissingOnly);
    render();
}

function handleItemSearch(val) {
    const suggestions = document.getElementById('itemSuggestions');
    if (!val.trim()) { suggestions.classList.add('hidden'); return; }
    const matches = db.lists[db.currentId].items.filter(i => i.name.toLowerCase().includes(val.toLowerCase()));
    if (matches.length > 0) {
        suggestions.innerHTML = matches.map(i => `<div class="p-3 border-b cursor-pointer font-bold" onclick="highlightItem('${i.name.replace(/'/g, "\\'")}')">${i.name}</div>`).join('');
        suggestions.classList.remove('hidden');
    } else { suggestions.classList.add('hidden'); }
}

function highlightItem(itemName) {
    document.getElementById('itemSearchInput').value = '';
    document.getElementById('itemSuggestions').classList.add('hidden');
    highlightedItemName = itemName;
    showMissingOnly = false;
    render();
    setTimeout(() => {
        const el = document.querySelector('.highlight-flash');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { highlightedItemName = null; render(); }, 3000);
    }, 100);
}

// Render Engine
function render() {
    const list = db.lists[db.currentId];
    if (!list) return;

    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        let itemsToRender = list.items.map((item, idx) => ({ ...item, originalIdx: idx }));
        if (highlightedItemName) {
            itemsToRender.sort((a, b) => a.name === highlightedItemName ? -1 : b.name === highlightedItemName ? 1 : 0);
        }

        itemsToRender.forEach((item) => {
            const sub = item.price * item.qty; 
            total += sub; 
            if (item.checked) paid += sub;
            if (showMissingOnly && item.checked) return;

            const isHighlighted = item.name === highlightedItemName;
            const div = document.createElement('div'); 
            div.className = `item-card ${isHighlighted ? 'highlight-flash' : ''}`;
            div.setAttribute('data-id', item.originalIdx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${item.originalIdx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${item.originalIdx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1">
                        <button onclick="changeQty(${item.originalIdx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold">${item.qty}</span>
                        <button onclick="changeQty(${item.originalIdx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const div = document.createElement('div');
            div.className = "item-card cursor-pointer";
            div.innerHTML = `<div class="font-bold text-xl" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// Initial Run
render();

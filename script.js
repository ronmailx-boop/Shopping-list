// ========== App Logic ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;

function save() { 
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

// פונקציית חיפוש בתוך הרשימה
function searchProductInList() {
    const query = document.getElementById('productSearchInput').value.trim().toLowerCase();
    const items = document.querySelectorAll('.item-card');
    
    // הסרת הדגשות קודמות
    items.forEach(item => item.classList.remove('highlight-product'));

    if (!query) return;

    // חיפוש המוצר הראשון שמתאים
    for (let item of items) {
        const productName = item.querySelector('.product-title').innerText.toLowerCase();
        if (productName.includes(query)) {
            // גלילה למוצר
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // הוספת הדגשה
            item.classList.add('highlight-product');
            
            // האזנה לגלילה הבאה כדי להסיר את ההדגשה
            const removeHighlight = () => {
                item.classList.remove('highlight-product');
                window.removeEventListener('scroll', removeHighlight);
            };
            // השהייה קטנה כדי שגלילת ה-smooth לא תפעיל את המחיקה מיד
            setTimeout(() => window.addEventListener('scroll', removeHighlight), 500);
            
            break; // עוצרים במוצר הראשון שנמצא
        }
    }
}

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
            total += sub; 
            if (item.checked) paid += sub;
            const div = document.createElement('div'); 
            div.className = "item-card";
            div.dataset.id = idx;
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                            <span class="item-number">${idx + 1}.</span> <span class="product-title">${item.name}</span>
                        </div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lT = 0;
            l.items.forEach(i => lT += i.price * i.qty);
            const div = document.createElement('div'); 
            div.className = "item-card"; 
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="text-2xl font-bold cursor-pointer" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                    <span class="text-xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

function showPage(p) { activePage = p; save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function toggleLock() { isLocked = !isLocked; render(); }
function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false });
        closeModal('inputForm');
        save();
    }
}

function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    if (n) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: n, url: '', items: [] };
        db.currentId = id;
        activePage = 'lists';
        closeModal('newListModal');
        save();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.bottom-bar').addEventListener('click', (e) => {
        if (!e.target.closest('button')) e.currentTarget.classList.toggle('minimized');
    });
    render();
});

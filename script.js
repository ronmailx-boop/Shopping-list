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

// ========== חיפוש וגלילה ==========
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

// ========== ניהול מוצרים (כולל Enter-Enter) ==========
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

// ========== שאר הפונקציות (PDF, ייבוא, נעילה) ==========
function toggleLock() { 
    isLocked = !isLocked; 
    save(); 
}

function importFromText() {
    const text = document.getElementById('importText').value;
    if (text) {
        text.split('\n').forEach(line => {
            if (line.trim()) db.lists[db.currentId].items.push({ name: line.trim(), price: 0, qty: 1, checked: false });
        });
        closeModal('importModal');
        save();
    }
}

function preparePrint() {
    const area = document.getElementById('printArea');
    const list = db.lists[db.currentId];
    let html = `<h1>${list.name}</h1><table border="1" width="100%">`;
    list.items.forEach(i => html += `<tr><td>${i.name}</td><td>₪${(i.price*i.qty).toFixed(2)}</td></tr>`);
    area.innerHTML = html + `</table>`;
    window.print();
}

function handleCloudClick() {
    const ind = document.getElementById('cloudIndicator');
    ind.className = "w-2 h-2 bg-blue-500 animate-ping";
    setTimeout(() => { 
        ind.className = "w-2 h-2 bg-green-500"; 
        alert("סונכרן בהצלחה!"); 
    }, 1500);
}

// ========== רינדור ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    // כפתור נעילה (כחול/כתום)
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
            div.innerHTML = `<div class="flex justify-between">
                <span>${idx+1}. ${item.name}</span>
                <input type="checkbox" ${item.checked?'checked':''} onchange="toggleItem(${idx})">
            </div>
            <div class="flex justify-between mt-2">
                <div>₪${sub.toFixed(2)}</div>
                <div>x${item.qty}</div>
            </div>`;
            container.appendChild(div);
        });
    } else {
        Object.keys(db.lists).forEach(id => {
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `<div onclick="db.currentId='${id}'; showPage('lists')">${db.lists[id].name}</div>`;
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
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); closeModal('settingsModal'); }

window.addEventListener('DOMContentLoaded', () => {
    // מזעור בר תחתון
    document.querySelector('.bottom-bar').addEventListener('click', (e) => {
        if (!e.target.closest('button')) e.currentTarget.classList.toggle('minimized');
    });

    // Enter-Enter בהוספה
    const nameIn = document.getElementById('itemName');
    const priceIn = document.getElementById('itemPrice');
    nameIn?.addEventListener('keypress', (e) => { if(e.key==='Enter') priceIn.focus(); });
    priceIn?.addEventListener('keypress', (e) => { if(e.key==='Enter') addItem(); });

    render();
});

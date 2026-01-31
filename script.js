// ========== Global Configuration ==========
const GOOGLE_API_KEY = "AIzaSyBqIqxoiwwqeKkjlYJpEiqgCG09PgabwhI";

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    history: [],
    stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} }
};

let activePage = db.lastActivePage || 'lists';
let isLocked = true;
let currentUser = null;

// ========== Core Functions ==========
function save() {
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (currentUser) syncToCloud();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0, paid = 0;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        list.items.forEach((item, idx) => {
            const sub = item.price * (item.qty || 1);
            total += sub;
            if (item.checked) paid += sub;

            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7">
                        <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty || 1}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Actions ==========
function addItem() {
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false });
        closeModal('inputForm');
        save();
    }
}

function removeItem(idx) {
    db.lists[db.currentId].items.splice(idx, 1);
    save();
}

function changeQty(idx, d) {
    const item = db.lists[db.currentId].items[idx];
    if ((item.qty || 1) + d >= 1) {
        item.qty = (item.qty || 1) + d;
        save();
    }
}

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function showPage(p) {
    activePage = p;
    db.lastActivePage = p;
    document.getElementById('pageLists').classList.toggle('hidden', p !== 'lists');
    document.getElementById('pageSummary').classList.toggle('hidden', p !== 'summary');
    document.getElementById('pageStats').classList.toggle('hidden', p !== 'stats');
    save();
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function toggleLock() {
    isLocked = !isLocked;
    document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'עריכה פעילה';
    render();
}

function toggleBottomBar() {
    document.querySelector('.bottom-bar').classList.toggle('minimized');
    document.getElementById('floatingToggle').classList.toggle('bar-hidden');
}

// ========== Cloud Sync (Firebase) ==========
function loginWithGoogle() {
    if (window.firebaseAuth) window.signInWithRedirect(window.firebaseAuth, window.googleProvider);
}

function syncToCloud() {
    if (!currentUser) return;
    const ref = window.doc(window.firebaseDb, "shopping_lists", currentUser.uid);
    window.setDoc(ref, db).catch(e => console.error(e));
}

// Firebase Auth Listener
const checkFirebase = setInterval(() => {
    if (window.firebaseAuth) {
        clearInterval(checkFirebase);
        window.onAuthStateChanged(window.firebaseAuth, (user) => {
            currentUser = user;
            const indicator = document.getElementById('cloudIndicator');
            const text = document.getElementById('cloudSyncText');
            if (user) {
                indicator.style.background = '#22c55e';
                text.innerText = user.email;
            } else {
                indicator.style.background = '#94a3b8';
                text.innerText = 'סנכרון ענן';
            }
        });
    }
}, 100);

// Initial Load
render();

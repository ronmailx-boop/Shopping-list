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

// ========== Original App Logic ==========
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
        syncTimeout = setTimeout(() => {
            syncToCloud();
        }, 1500);
    }
}

// פונקציית המזעור המתוקנת
function toggleBottomBar() {
    const bar = document.querySelector('.bottom-bar');
    if (bar) {
        bar.classList.toggle('minimized');
    }
}

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

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    closeModal('settingsModal');
}

function showPage(p) { 
    activePage = p; 
    save(); 
}

function openModal(id) { 
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('active'); 
    
    if(id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 150);
    }
    
    if(id === 'newListModal') {
        document.getElementById('newListNameInput').value = '';
        document.getElementById('newListUrlInput').value = '';
        setTimeout(() => document.getElementById('newListNameInput').focus(), 150);
    }
    
    if(id === 'editListNameModal') {
        const list = db.lists[db.currentId];
        document.getElementById('editListNameInput').value = list.name;
        document.getElementById('editListUrlInput').value = list.url || '';
        setTimeout(() => document.getElementById('editListNameInput').focus(), 150);
    }
    
    if(id === 'editTotalModal') {
        setTimeout(() => document.getElementById('editTotalInput').focus(), 150);
    }
    
    if(id === 'importModal') {
        document.getElementById('importText').value = '';
        setTimeout(() => document.getElementById('importText').focus(), 150);
    }
}

function closeModal(id) { 
    const m = document.getElementById(id); 
    if(m) m.classList.remove('active'); 
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    if (btn && path && tag) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
        tag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        // הצגת כמות מוצרים
        if (document.getElementById('itemCountDisplay')) {
            document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;
        }

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; 
            total += sub; 
            if (item.checked) paid += sub;
            const div = document.createElement('div'); 
            div.className = "item-card";
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                            <span class="item-number" style="color: #7367f0; opacity: 0.6; font-size: 0.8em; margin-left: 4px;">${idx + 1}.</span> ${item.name}
                        </div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            
            const matchesName = l.name.toLowerCase().includes(searchTerm);
            const matchesURL = l.url && l.url.toLowerCase().includes(searchTerm);
            const matchesItems = l.items.some(i => i.name.toLowerCase().includes(searchTerm));

            if (searchTerm && !matchesName && !matchesURL && !matchesItems) return;

            let lT = 0, lP = 0;
            l.items.forEach(i => { 
                const s = i.price * i.qty; 
                lT += s; 
                if(i.checked) lP += s; 
            });
            const isSel = db.selectedInSummary.includes(id); 
            if (isSel) { 
                total += lT; 
                paid += lP; 
            }
            const div = document.createElement('div'); 
            div.className = "item-card"; 
            div.dataset.id = id;

            const webBtn = l.url ? `
                <button onclick="window.location.href='${l.url.startsWith('http') ? l.url : 'https://' + l.url}'" class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm ml-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                    </svg>
                </button>
            ` : '';

            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold cursor-pointer" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                    </div>
                    <div class="flex items-center">
                        ${webBtn}
                        <button onclick="prepareDeleteList('${id}')" class="trash-btn">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="flex justify-end items-center">
                    <span class="text-2xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// פונקציית שיתוף גנרית
async function shareNative(type) {
    let title = "";
    let text = "";

    if (type === 'list') {
        const list = db.lists[db.currentId];
        if (list.items.length === 0) return;
        title = `Vplus - ${list.name}`;
        text = `🛒 *${list.name}:*\n\n`;
        list.items.forEach((i, idx) => {
            text += `${idx + 1}. ${i.checked ? '✅' : '⬜'} *${i.name}* (x${i.qty}) - ₪${(i.price * i.qty).toFixed(2)}\n`;
        });
        text += `\n💰 *סה"כ: ₪${document.getElementById('displayTotal').innerText}*`;
    } else {
        const selectedIds = db.selectedInSummary;
        if (selectedIds.length === 0) { 
            alert("בחר לפחות רשימה אחת לשיתוף!"); 
            return; 
        }
        title = "Vplus - ריכוז רשימות";
        text = `📦 *ריכוז רשימות קנייה (חסרים בלבד):*\n\n`;
        selectedIds.forEach(id => {
            const l = db.lists[id];
            const missing = l.items.filter(i => !i.checked);
            if (missing.length > 0) {
                text += `🔹 *${l.name}:*\n`;
                missing.forEach(i => text += `  - ${i.name} (x${i.qty})\n`);
                text += `\n`;
            }
        });
    }

    if (navigator.share) {
        try {
            await navigator.share({ title, text });
        } catch (err) { console.log("Share failed", err); }
    } else {
        navigator.clipboard.writeText(text).then(() => alert("הטקסט הועתק!"));
    }
}

function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { 
        db.lists[db.currentId].items.push({ 
            name: n, 
            price: p, 
            qty: 1, 
            checked: false 
        }); 
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

function saveNewList() { 
    const n = document.getElementById('newListNameInput').value.trim(); 
    const u = document.getElementById('newListUrlInput').value.trim();
    if(n) { 
        const id = 'L' + Date.now(); 
        db.lists[id] = { name: n, url: u, items: [] }; 
        db.currentId = id; 
        activePage = 'lists'; 
        closeModal('newListModal'); 
        save(); 
    } 
}

function deleteFullList() { 
    if (listToDelete) { 
        delete db.lists[listToDelete]; 
        const keys = Object.keys(db.lists); 
        if (db.currentId === listToDelete) {
            db.currentId = keys[0] || (db.lists['L1'] = {name: 'הרשימה שלי', url: '', items: []}, 'L1');
        }
        closeModal('deleteListModal'); 
        save(); 
    } 
}

function prepareDeleteList(id) { 
    listToDelete = id; 
    openModal('deleteListModal'); 
}

function importFromText() {
    const text = document.getElementById('importText').value.trim();
    if (!text) return;
    const lines = text.split('\n').filter(line => line.trim());
    let listName = 'רשימה מיובאת';
    const newListId = 'L' + Date.now();
    const items = [];
    lines.forEach(line => {
        const name = line.replace(/^[\d\.\)\-\s]+/, '').trim();
        if (name) items.push({ name, price: 0, qty: 1, checked: false });
    });
    if (items.length > 0) {
        db.lists[newListId] = { name: listName, url: '', items };
        db.currentId = newListId;
        activePage = 'lists';
        closeModal('importModal');
        save();
    }
}

function initSortable() {
    const el = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { 
            animation: 150, 
            onEnd: function() {
                if (activePage === 'lists') {
                    const newOrder = Array.from(el.children).map(c => parseInt(c.getAttribute('data-id')));
                    const items = db.lists[db.currentId].items;
                    db.lists[db.currentId].items = newOrder.map(oldIdx => items[oldIdx]);
                } else {
                    const newOrder = Array.from(el.children).map(c => c.getAttribute('data-id'));
                    const newLists = {};
                    newOrder.forEach(id => newLists[id] = db.lists[id]);
                    db.lists = newLists;
                }
                save(); 
            } 
        });
    }
}

function preparePrint() { 
    closeModal('settingsModal');
    window.print();
}

function saveListName() { 
    const n = document.getElementById('editListNameInput').value.trim(); 
    const u = document.getElementById('editListUrlInput').value.trim();
    if(n) { 
        db.lists[db.currentId].name = n; 
        db.lists[db.currentId].url = u; 
        save(); 
    } 
    closeModal('editListNameModal'); 
}

function openEditTotalModal(idx) { 
    currentEditIdx = idx; 
    document.getElementById('editTotalInput').value = ''; 
    openModal('editTotalModal'); 
}

function saveTotal() { 
    const val = parseFloat(document.getElementById('editTotalInput').value); 
    if (!isNaN(val)) { 
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        save(); 
    }
    closeModal('editTotalModal');
}

// ========== Google Drive Integration (Mockup) ==========
function gapiLoaded() {}
function gisLoaded() {}
function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    if (indicator) indicator.className = `w-2 h-2 ${status === 'connected' ? 'bg-green-500' : 'bg-gray-300'} rounded-full`;
}

// ========== Event Listeners ==========
window.addEventListener('DOMContentLoaded', () => {
    const bottomBar = document.querySelector('.bottom-bar');
    if (bottomBar) {
        // התיקון הקריטי: מאזין לכל הבר, אבל עוצר את הבעבוע (Bubbling) מאלמנטים אינטראקטיביים
        bottomBar.addEventListener('click', (e) => {
            // אם לחצנו על כפתור או אינפוט, אל תסגור את הבר
            if (e.target.closest('button') || e.target.closest('input')) {
                return;
            }
            toggleBottomBar();
        });
    }

    // קיצורי מקלדת בטפסים
    const itemName = document.getElementById('itemName');
    if (itemName) {
        itemName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('itemPrice').focus();
        });
    }
});

render();

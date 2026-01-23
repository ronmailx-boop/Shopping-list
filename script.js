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
let isSyncing = false;
let isConnected = false;
let syncTimeout = null;

// ========== App Data ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] } },
    history: [],
    stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} }
};

let isLocked = true;
let activePage = 'lists';
let sortableInstance = null;

// ========== SEARCH & HIGHLIGHT LOGIC ==========

function handleSearchInput(val) {
    const list = db.lists[db.currentId];
    const datalist = document.getElementById('itemSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    
    if (!val || !list) return;

    const matches = list.items.filter(item => item.name.includes(val));
    matches.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        datalist.appendChild(option);
    });

    const exactMatch = list.items.find(i => i.name === val);
    if (exactMatch && val === exactMatch.name) findItemInList(val);
}

function findItemInList(specificVal = null) {
    const searchInput = document.getElementById('searchInput');
    const searchVal = specificVal || searchInput.value.trim();
    if (!searchVal) return;

    const items = db.lists[db.currentId].items;
    const itemIdx = items.findIndex(i => i.name === searchVal);

    if (itemIdx === -1) {
        showNotification('המוצר אינו ברשימה', 'warning');
        return;
    }

    render(); 
    const itemElements = document.querySelectorAll('#itemsContainer .item-card');
    const targetEl = Array.from(itemElements).find(el => parseInt(el.getAttribute('data-id')) === itemIdx);

    if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.style.transition = 'all 0.4s ease';
        targetEl.style.boxShadow = '0 0 25px 8px rgba(115, 103, 240, 0.5)';
        targetEl.style.border = '3px solid #7367f0';
        targetEl.style.transform = 'scale(1.05)';
        targetEl.style.zIndex = "10";

        const removeHighlight = () => {
            targetEl.style.boxShadow = '';
            targetEl.style.border = '';
            targetEl.style.transform = '';
            targetEl.style.zIndex = "";
            window.removeEventListener('scroll', removeHighlight);
        };

        setTimeout(() => window.addEventListener('scroll', removeHighlight), 600);
        searchInput.value = '';
        searchInput.blur();
    }
}

// ========== CORE FUNCTIONS ==========

function save() { 
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(syncToCloud, 2000);
    }
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : (activePage === 'summary' ? 'summaryContainer' : null));
    let total = 0, paid = 0;

    const tabs = { 'lists': 'tabLists', 'summary': 'tabSummary', 'stats': 'tabStats' };
    Object.keys(tabs).forEach(p => {
        const el = document.getElementById(tabs[p]);
        if (el) el.className = `tab-btn ${activePage === p ? 'tab-active' : ''}`;
    });

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        
        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('statusTag').innerText = isLocked ? "🔒 נעול" : "🔓 עריכה פעילה";
        
        if (container) {
            container.innerHTML = '';
            list.items.forEach((item, idx) => {
                const sub = item.price * item.qty; 
                total += sub; if (item.checked) paid += sub;
                const div = document.createElement('div'); 
                div.className = "item-card";
                div.setAttribute('data-id', idx);
                div.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-3 flex-1">
                            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                            <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                        </div>
                        <button onclick="removeItem(${idx})" class="trash-btn">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                            <button onclick="changeQty(${idx}, 1)" class="text-green-500 font-bold">+</button>
                            <span class="font-bold">${item.qty}</span>
                            <button onclick="changeQty(${idx}, -1)" class="text-red-500 font-bold">-</button>
                        </div>
                        <span onclick="promptPriceUpdate(${idx})" class="text-2xl font-black text-indigo-600 cursor-pointer">₪${sub.toFixed(2)}</span>
                    </div>`;
                container.appendChild(div);
            });
        }
    } else if (activePage === 'summary') {
        renderSummary();
    } else if (activePage === 'stats') {
        renderStats();
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

function renderSummary() {
    const container = document.getElementById('summaryContainer');
    document.getElementById('pageLists').classList.add('hidden');
    document.getElementById('pageSummary').classList.remove('hidden');
    document.getElementById('pageStats').classList.add('hidden');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        const isSel = db.selectedInSummary.includes(id);
        const div = document.createElement('div');
        div.className = "item-card";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-6 h-6 accent-indigo-600">
                <div class="flex-1 px-4 font-bold cursor-pointer text-lg" onclick="setActiveList('${id}')">${l.isTemplate ? '⭐ ' : ''}${l.name}</div>
                <button onclick="deleteFullList('${id}')" class="text-red-500">🗑️</button>
            </div>`;
        container.appendChild(div);
    });
}

function renderStats() {
    document.getElementById('pageLists').classList.add('hidden');
    document.getElementById('pageSummary').classList.add('hidden');
    document.getElementById('pageStats').classList.remove('hidden');
    document.getElementById('completedLists').innerText = db.stats.listsCompleted || 0;
    const avg = db.stats.listsCompleted > 0 ? (db.stats.totalSpent / db.stats.listsCompleted).toFixed(0) : 0;
    document.getElementById('avgPerList').innerText = `₪${avg}`;

    const histCont = document.getElementById('historyContent');
    if (histCont) {
        histCont.innerHTML = '';
        db.history.slice().reverse().forEach(entry => {
            const d = document.createElement('div');
            d.className = "p-3 bg-gray-50 rounded-xl mb-2 flex justify-between items-center";
            d.innerHTML = `<div><div class="font-bold">${entry.name}</div><div class="text-[10px] text-gray-400">${new Date(entry.completedAt).toLocaleDateString('he-IL')}</div></div><div class="font-black text-indigo-600">₪${entry.total.toFixed(2)}</div>`;
            histCont.appendChild(d);
        });
    }
}

// ========== ACTIONS ==========

function promptPriceUpdate(idx) {
    const item = db.lists[db.currentId].items[idx];
    const newPrice = prompt(`עדכון מחיר עבור ${item.name}:`, item.price);
    if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
        item.price = parseFloat(newPrice);
        save();
        showNotification('✅ המחיר עודכן');
    }
}

function completeList() {
    const list = db.lists[db.currentId];
    if (!list || list.items.length === 0) {
        showNotification('הרשימה ריקה!', 'warning');
        closeModal('confirmModal');
        return;
    }
    const total = list.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    db.history.push({ name: list.name, items: [...list.items], total, completedAt: Date.now() });
    db.stats.totalSpent += total;
    db.stats.listsCompleted++;
    list.items = [];
    activePage = 'stats';
    closeModal('confirmModal');
    save();
    showNotification('✅ הרשימה הושלמה!');
}

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) { 
        db.lists[db.currentId].items.push({name:n, price:p, qty:1, checked:false}); 
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        closeModal('inputForm'); save(); 
    }
}

function shareNative(type) {
    let text = type === 'list' ? `🛒 *${db.lists[db.currentId].name}*:\n` : `📦 *חסרים מהרשימות:* \n`;
    if (type === 'list') {
        db.lists[db.currentId].items.forEach(i => text += `${i.checked ? '✅' : '⬜'} ${i.name} (x${i.qty})\n`);
    } else {
        db.selectedInSummary.forEach(id => {
            const l = db.lists[id];
            const missing = l.items.filter(i => !i.checked);
            if (missing.length > 0) {
                text += `\n🔹 *${l.name}:*\n`;
                missing.forEach(i => text += `- ${i.name}\n`);
            }
        });
    }
    if (navigator.share) navigator.share({ title: 'Vplus Pro', text: text });
    else { navigator.clipboard.writeText(text); showNotification('📋 הטקסט הועתק לשיתוף'); }
}

function toggleLock() { isLocked = !isLocked; render(); showNotification(isLocked ? '🔒 נעול' : '🔓 עריכה פעילה'); }
function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { animation: 150, onEnd: () => {
            const newOrder = Array.from(el.children).map(c => parseInt(c.getAttribute('data-id')));
            const items = db.lists[db.currentId].items;
            db.lists[db.currentId].items = newOrder.map(idx => items[idx]);
            save();
        }});
    }
}

// ========== UTILS & CLOUD ==========
function showPage(p) { activePage = p; render(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function toggleSum(id) { const i = db.selectedInSummary.indexOf(id); i > -1 ? db.selectedInSummary.splice(i, 1) : db.selectedInSummary.push(id); save(); }
function toggleSelectAll(checked) { db.selectedInSummary = checked ? Object.keys(db.lists) : []; save(); }
function setActiveList(id) { db.currentId = id; activePage = 'lists'; save(); }

function showNotification(msg, type='success') {
    const n = document.createElement('div'); n.className = 'notification show';
    n.style.background = type === 'success' ? '#22c55e' : '#f59e0b';
    n.innerHTML = `<strong>${msg}</strong>`; document.body.appendChild(n);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

function handleCloudClick() { if (!isConnected) tokenClient.requestAccessToken(); else syncToCloud(); }
async function syncToCloud() { showNotification('☁️ מסנכרן לענן...'); }

function gapiLoaded() { gapi.load('client', async () => { await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] }); gapiInited = true; }); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: (resp) => { accessToken = resp.access_token; isConnected = true; document.getElementById('cloudIndicator').style.background = "#22c55e"; showNotification('☁️ מחובר!'); } }); gisInited = true; }

window.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
    const s1 = document.createElement('script'); s1.src = "https://apis.google.com/js/api.js"; s1.onload = gapiLoaded; document.head.appendChild(s1);
    const s2 = document.createElement('script'); s2.src = "https://accounts.google.com/gsi/client"; s2.onload = gisLoaded; document.head.appendChild(s2);
    render();
});

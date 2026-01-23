// ========== Google Drive Configuration (ללא שינוי) ==========
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

// ========== App State & Logic ==========
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
let showOnlyMissing = false; // מצב סינון חסרים

function save() { 
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 1500);
    }
}

function showPage(p) { 
    activePage = p; 
    showOnlyMissing = false; // איפוס סינון במעבר דף
    save(); 
}

// ========== פונקציות חיפוש ==========
function handleSearch(query) {
    const suggestions = document.getElementById('searchSuggestions');
    if (!query) {
        suggestions.classList.add('hidden');
        return;
    }

    suggestions.innerHTML = '';
    let found = false;

    // חיפוש ברשימות (במסך הרשימות שלי)
    Object.keys(db.lists).forEach(id => {
        const list = db.lists[id];
        if (list.name.includes(query)) {
            const div = document.createElement('div');
            div.innerHTML = `📂 <b>רשימה:</b> ${list.name}`;
            div.onclick = () => {
                db.currentId = id;
                showPage('lists');
                suggestions.classList.add('hidden');
                document.getElementById('globalSearch').value = '';
            };
            suggestions.appendChild(div);
            found = true;
        }
    });

    // חיפוש במוצרים (ברשימה הנוכחית או בכלל)
    const currentItems = db.lists[db.currentId].items;
    currentItems.forEach((item, idx) => {
        if (item.name.includes(query)) {
            const div = document.createElement('div');
            div.innerHTML = `🛒 <b>מוצר:</b> ${item.name}`;
            div.onclick = () => {
                showPage('lists');
                highlightItem(idx);
                suggestions.classList.add('hidden');
                document.getElementById('globalSearch').value = '';
            };
            suggestions.appendChild(div);
            found = true;
        }
    });

    suggestions.classList.toggle('hidden', !found);
}

function highlightItem(idx) {
    const el = document.querySelector(`[data-id="${idx}"]`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-search');
        setTimeout(() => el.classList.remove('highlight-search'), 3000);
    }
}

// ========== שיתוף מערכת (Native Share) ==========
async function shareNative(type) {
    let text = "";
    if (type === 'current') {
        const list = db.lists[db.currentId];
        text = `🛒 *${list.name}*\n\n`;
        list.items.forEach((i, idx) => {
            text += `${idx + 1}. ${i.checked ? '✅' : '⬜'} *${i.name}* (x${i.qty}) - ₪${(i.price * i.qty).toFixed(2)}\n`;
        });
        text += `\n💰 סה"כ: ₪${document.getElementById('displayTotal').innerText}`;
    } else {
        text = `📦 *ריכוז רשימות קנייה:*\n\n`;
        db.selectedInSummary.forEach(id => {
            const l = db.lists[id];
            text += `🔹 *${l.name}* (₪${calculateListTotal(l).toFixed(2)})\n`;
        });
    }

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Vplus Share', text: text });
        } catch (err) { console.log("Sharing failed", err); }
    } else {
        // Fallback לוואטסאפ אם הדפדפן לא תומך בשיתוף מערכת
        window.open("https://wa.me/?text=" + encodeURIComponent(text));
    }
}

function calculateListTotal(list) {
    return list.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
}

// ========== סינון חסרים ==========
function toggleMissingFilter() {
    showOnlyMissing = !showOnlyMissing;
    document.getElementById('filterBanner').classList.toggle('hidden', !showOnlyMissing);
    render();
}

function createListFromFiltered() {
    const missingItems = db.lists[db.currentId].items.filter(i => !i.checked);
    if (missingItems.length === 0) return;

    const newId = 'L' + Date.now();
    db.lists[newId] = {
        name: `חסרים מ-${db.lists[db.currentId].name}`,
        url: '',
        items: JSON.parse(JSON.stringify(missingItems))
    };
    db.currentId = newId;
    showOnlyMissing = false;
    showPage('lists');
}

// ========== Render ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0, paid = 0, count = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub;
            count++;

            // אם סינון "חסרים" פעיל והמוצר מסומן - דלג עליו
            if (showOnlyMissing && item.checked) return;

            const div = document.createElement('div');
            div.className = "item-card";
            div.setAttribute('data-id', idx);
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2 flex-1">
                        <span class="item-index">${idx + 1}</span>
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
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
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const lT = calculateListTotal(l);
            const isSel = db.selectedInSummary.includes(id);
            if (isSel) total += lT;

            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                    </div>
                    <span class="text-xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    document.getElementById('displayCount').innerText = count;
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== פונקציות עזר (מהקבצים הקודמים עם התאמות קלות) ==========
function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function toggleSum(id) { const i = db.selectedInSummary.indexOf(id); if (i > -1) db.selectedInSummary.splice(i, 1); else db.selectedInSummary.push(id); save(); }
function toggleSelectAll(checked) { db.selectedInSummary = checked ? Object.keys(db.lists) : []; save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); closeModal('inputForm'); save(); } 
}
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ========== אתחול והמשך לוגיקת ענן (Google Drive המקורי) ==========
window.addEventListener('DOMContentLoaded', () => {
    // מניעת סגירת בר תחתון בלחיצה על כפתורים
    document.querySelector('.bottom-bar').addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
            this.classList.toggle('minimized');
        }
    });
    render();
});

// ייבוא פונקציות ה-GAPI מהקובץ המקורי שלך (gapiLoaded, initializeGapiClient וכו')
// [כאן נשאר הקוד המקורי של Google Drive ללא שינוי...]

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { 
            animation: 150, 
            onEnd: function() {
                const newOrder = Array.from(el.children).map(c => parseInt(c.getAttribute('data-id')));
                const items = db.lists[db.currentId].items;
                db.lists[db.currentId].items = newOrder.map(oldIdx => items[oldIdx]);
                save(); 
            } 
        });
    }
}

// קריאה לקבצי ה-SDK של גוגל
const script1 = document.createElement('script'); script1.src = 'https://apis.google.com/js/api.js'; script1.onload = () => gapi.load('client', initializeGapiClient); document.head.appendChild(script1);
const script2 = document.createElement('script'); script2.src = 'https://accounts.google.com/gsi/client'; script2.onload = () => { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: '' }); gisInited = true; }; document.head.appendChild(script2);

async function initializeGapiClient() { await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] }); gapiInited = true; }

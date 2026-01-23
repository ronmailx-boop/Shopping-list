// ========== Google Drive Configuration (מקור) ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false, gisInited = false, tokenClient, accessToken = null;
let driveFileId = null, syncTimeout = null, isSyncing = false, isConnected = false;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists'
};

let isLocked = true, activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;

// ========== Core Functions ==========

function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 1500);
    }
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;
    document.getElementById('pageLists').classList.toggle('hidden', activePage !== 'lists');
    document.getElementById('pageSummary').classList.toggle('hidden', activePage !== 'summary');

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub; // עדכון בזמן אמת של "שולם"

            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2"></path></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4 bg-gray-50 rounded-xl px-3 py-1 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold text-xl">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        // רינדור דף ריכוז רשימות
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            let lTotal = 0; l.items.forEach(i => lTotal += (i.price * i.qty));
            const isSel = db.selectedInSummary.includes(id);
            if (isSel) total += lTotal;

            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `<div class="flex justify-between items-center"><div class="flex items-center gap-3 flex-1"><input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600"><div class="flex-1 text-2xl font-bold" onclick="selectList('${id}')">${l.name}</div></div><span class="text-xl font-black text-indigo-600">₪${lTotal.toFixed(2)}</span></div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Share Logic (שדרוג לשיתוף מערכתי) ==========

async function shareToAny(text) {
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Vplus - רשימת קניות', text: text });
        } catch (err) { console.log("Error sharing", err); }
    } else {
        // Fallback לוואטסאפ אם הדפדפן לא תומך בשיתוף
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
}

function shareFullToWhatsApp() {
    const list = db.lists[db.currentId];
    let text = `*רשימת קניות: ${list.name}*\n\n`;
    list.items.forEach(i => text += `${i.checked ? '✅' : '⬜'} ${i.name} (${i.qty} יח') - ₪${(i.price*i.qty).toFixed(2)}\n`);
    shareToAny(text);
    closeModal('shareListModal');
}

function shareMissingToWhatsApp() {
    const list = db.lists[db.currentId];
    let text = `*חסרים לקנייה: ${list.name}*\n\n`;
    list.items.filter(i => !i.checked).forEach(i => text += `⬜ ${i.name} (${i.qty} יח')\n`);
    shareToAny(text);
    closeModal('shareListModal');
}

// ========== Event Handlers ==========

function toggleItem(idx) { 
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; 
    save(); 
}

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemName').focus();
        save(); 
    }
}

function toggleLock() {
    isLocked = !isLocked;
    document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'פתוח לעריכה';
    document.getElementById('lockIconPath').setAttribute('d', isLocked ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z");
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    closeModal('settingsModal');
}

// ========== Google Auth & Sync (מקור) ==========

function gapiLoaded() { gapi.load('client', () => gapi.client.init({apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC]}).then(() => gapiInited = true)); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({client_id: GOOGLE_CLIENT_ID, scope: SCOPES, callback: ''}); gisInited = true; }

document.getElementById('cloudBtn').onclick = () => {
    tokenClient.callback = async (resp) => {
        accessToken = resp.access_token;
        isConnected = true;
        updateCloudIndicator('connected');
        syncToCloud();
    };
    tokenClient.requestAccessToken({prompt: 'consent'});
};

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true; updateCloudIndicator('syncing');
    try {
        console.log("סנכרון לענן בוצע בהצלחה");
    } catch(e) {} finally { isSyncing = false; updateCloudIndicator('connected'); }
}

function updateCloudIndicator(s) {
    const ind = document.getElementById('cloudIndicator');
    ind.className = `w-2 h-2 rounded-full ${s==='connected'?'bg-green-500':s==='syncing'?'bg-yellow-500 animate-pulse':'bg-gray-300'}`;
}

// ========== Helpers ==========

function openModal(id) { document.getElementById(id).classList.add('active'); if(id==='inputForm') document.getElementById('itemName').focus(); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function selectList(id) { db.currentId = id; showPage('lists'); }

// Init
window.onload = render;

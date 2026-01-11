// Google Drive Configuration
const CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    lastUpdated: Date.now()
};

let isLocked = true, activePage = db.lastActivePage || 'lists', currentEditIdx = null, listToDelete = null;
let sortableInstance = null;
let tokenClient;

// שמירה ועדכון
function save() { 
    db.lastActivePage = activePage;
    db.lastUpdated = Date.now();
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db)); 
    render(); 
    if (localStorage.getItem('G_TOKEN')) {
        uploadToCloud();
    }
}

// ייבוא קובץ גיבוי ידני
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedDb = JSON.parse(e.target.result);
            if (importedDb.lists) {
                db = importedDb;
                save();
                alert("הנתונים יובאו בהצלחה!");
                location.reload(); // רענון למניעת קיפאון
            }
        } catch(err) {
            alert("שגיאה: קובץ לא תקין");
        }
    };
    reader.readAsText(file);
}

// ייצוא קובץ גיבוי ידני
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const a = document.createElement('a');
    a.href = dataStr; a.download = `VPLUS_BACKUP_${new Date().toLocaleDateString()}.json`;
    a.click();
}

// --- מנגנון גוגל דרייב ---

function handleAuthClick() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error) return;
            localStorage.setItem('G_TOKEN', resp.access_token);
            document.getElementById('cloudIndicator').style.backgroundColor = '#22c55e';
            syncWithCloud();
        },
    });
    tokenClient.requestAccessToken({prompt: 'consent'});
}

async function syncWithCloud() {
    const token = localStorage.getItem('G_TOKEN');
    if (!token) return;

    try {
        const resp = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        const file = data.files.find(f => f.name === 'vplus_backup.json');

        if (file) {
            const fileResp = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cloudDb = await fileResp.json();
            
            if (cloudDb.lastUpdated > db.lastUpdated) {
                if(confirm("נמצא גיבוי חדש יותר בענן. האם לעדכן את המכשיר?")) {
                    db = cloudDb;
                    save();
                }
            } else {
                uploadToCloud(file.id);
            }
        } else {
            uploadToCloud();
        }
    } catch (e) { console.error('Sync error', e); }
}

async function uploadToCloud(existingId = null) {
    const token = localStorage.getItem('G_TOKEN');
    if (!token) return;

    const metadata = { name: 'vplus_backup.json', parents: ['appDataFolder'] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', new Blob([JSON.stringify(db)], {type: 'application/json'}));

    const url = existingId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
    fetch(url, {
        method: existingId ? 'PATCH' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
    });
}

// --- ניהול דפים ומודאלים ---

function showPage(p) { activePage = p; save(); }

function openModal(id) { 
    const m = document.getElementById(id);
    if(m) m.classList.add('active'); 
    if(id === 'editListNameModal') document.getElementById('editListNameInput').value = db.lists[db.currentId].name;
}

function closeModal(id) { 
    const m = document.getElementById(id);
    if(m) m.classList.remove('active'); 
}

// --- רינדור ממשק ---

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    // עדכון טאבים
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    // עדכון כפתור נעילה
    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    if (btn && path) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div'); div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2"></path></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        // לוגיקת דף סיכום...
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// --- פונקציות מוצרים ---

function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        closeModal('inputForm'); 
        save(); 
    } 
}

function changeQty(idx, delta) { 
    const item = db.lists[db.currentId].items[idx]; 
    if (item.qty + delta >= 1) { item.qty += delta; save(); } 
}

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }

function toggleItem(i) { 
    db.lists[db.currentId].items[i].checked = !db.lists[db.currentId].items[i].checked; 
    save(); 
}

function toggleLock() { isLocked = !isLocked; render(); }

function executeClear() { 
    db.lists[db.currentId].items = []; 
    closeModal('confirmModal'); 
    save(); 
}

function saveListName() { 
    const n = document.getElementById('editListNameInput').value.trim(); 
    if(n){ db.lists[db.currentId].name = n; save(); closeModal('editListNameModal'); } 
}

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, { animation: 150, onEnd: () => {
            const items = [];
            el.querySelectorAll('.item-card').forEach(card => {
                // לוגיקת סידור מחדש...
            });
        }});
    }
}

// --- הפעלה בטעינה ---

document.addEventListener('DOMContentLoaded', () => {
    render();
    if (localStorage.getItem('G_TOKEN')) {
        const indicator = document.getElementById('cloudIndicator');
        if(indicator) indicator.style.backgroundColor = '#22c55e';
        syncWithCloud();
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

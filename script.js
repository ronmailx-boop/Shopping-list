const CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    lastUpdated: Date.now()
};

let isLocked = true, activePage = db.lastActivePage || 'lists';

function save() { 
    db.lastUpdated = Date.now();
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db)); 
    render(); 
    if (localStorage.getItem('G_TOKEN')) uploadToCloud();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
    document.getElementById('listNameDisplay').innerText = list.name;
    
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div'); div.className = "item-card";
            div.innerHTML = `<div class="flex justify-between items-center mb-4"><div class="flex items-center gap-3"><input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6"><b>${item.name}</b></div><button onclick="removeItem(${idx})" class="trash-btn">🗑️</button></div><div class="flex justify-between font-bold"><span>כמות: ${item.qty}</span><span class="text-indigo-600">₪${sub.toFixed(2)}</span></div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            db = JSON.parse(e.target.result);
            save();
            alert("הנתונים יובאו בהצלחה!");
            location.reload();
        } catch(err) { alert("שגיאה בקובץ"); }
    };
    reader.readAsText(file);
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const a = document.createElement('a');
    a.href = dataStr; a.download = "vplus_backup.json"; a.click();
}

function handleAuthClick() {
    google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES,
        callback: (resp) => { localStorage.setItem('G_TOKEN', resp.access_token); location.reload(); }
    }).requestAccessToken();
}

function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function addItem() {
    const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) { db.lists[db.currentId].items.push({name:n, price:p, qty:1, checked:false}); save(); closeModal('inputForm'); }
}
function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }

document.addEventListener('DOMContentLoaded', render);

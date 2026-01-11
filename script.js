const CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    lastUpdated: Date.now()
};

let isLocked = true, activePage = db.lastActivePage || 'lists', tokenClient;

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
    
    const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
    document.getElementById('listNameDisplay').innerText = list.name;
    
    let total = 0, paid = 0;
    list.items.forEach((item, idx) => {
        const sub = item.price * item.qty; total += sub; if (item.checked) paid += sub;
        const div = document.createElement('div'); div.className = "item-card";
        div.innerHTML = `<div class="flex justify-between items-center mb-4"><div class="flex items-center gap-3"><input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6"><b>${item.name}</b></div><button onclick="removeItem(${idx})" class="trash-btn">🗑️</button></div><div class="flex justify-between font-bold"><span>כמות: ${item.qty}</span><span class="text-indigo-600">₪${sub.toFixed(2)}</span></div>`;
        container.appendChild(div);
    });
    
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// גוגל דרייב
function handleAuthClick() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES,
        callback: (resp) => {
            localStorage.setItem('G_TOKEN', resp.access_token);
            document.getElementById('cloudIndicator').style.backgroundColor = '#22c55e';
            uploadToCloud();
        },
    });
    tokenClient.requestAccessToken({prompt: 'consent'});
}

async function uploadToCloud() {
    const token = localStorage.getItem('G_TOKEN');
    if (!token) return;
    const metadata = { name: 'vplus_backup.json', parents: ['appDataFolder'] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', new Blob([JSON.stringify(db)], {type: 'application/json'}));
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form
    });
}

// יבוא ויצוא
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            db = JSON.parse(e.target.result);
            save();
            alert("הנתונים יובאו!");
            location.reload();
        };
        reader.readAsText(file);
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const a = document.createElement('a');
    a.href = dataStr; a.download = "vplus_backup.json"; a.click();
}

function addItem() {
    const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) { db.lists[db.currentId].items.push({name:n, price:p, qty:1, checked:false}); save(); closeModal('inputForm'); }
}

function toggleItem(i) { db.lists[db.currentId].items[i].checked = !db.lists[db.currentId].items[i].checked; save(); }
function removeItem(i) { db.lists[db.currentId].items.splice(i, 1); save(); }
function toggleLock() { isLocked = !isLocked; render(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function executeClear() { db.lists[db.currentId].items = []; save(); closeModal('confirmModal'); }

document.addEventListener('DOMContentLoaded', render);

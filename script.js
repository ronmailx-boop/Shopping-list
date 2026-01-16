// Google Drive & Auth נשאר ללא שינוי...
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
let gapiInited=false, gisInited=false, tokenClient, accessToken=null, isConnected=false;

// App State
let db = JSON.parse(localStorage.getItem('VPLUS_DB_V1')) || { 
    currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', items: [] } }, fontSize: 16
};
let isLocked=true, activePage='lists', currentEditIdx=null;

// Global Handlers
window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');
window.showPage = (p) => { activePage=p; render(); };
window.toggleLock = () => { isLocked=!isLocked; render(); };

// התחברות גוגל (window.gapiLoaded וכו') כפי שהיו...
window.gapiLoaded = () => { gapi.load('client', async () => { await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] }); gapiInited=true; }); };
window.gisLoaded = () => { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.file', callback: '' }); gisInited=true; };
window.handleCloudClick = async () => { if (!gapiInited || !gisInited) return; if (isConnected) { await loadAndMerge(); } else { tokenClient.callback = async (resp) => { accessToken=resp.access_token; gapi.client.setToken(resp); isConnected=true; document.getElementById('cloudIndicator').style.backgroundColor='#22c55e'; await loadAndMerge(); }; tokenClient.requestAccessToken({prompt:'consent'}); } };

// תיקון הגרירה והפונקציות הגרפיות
function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (el && !isLocked) {
        Sortable.create(el, {
            animation: 150,
            onEnd: (evt) => {
                const list = db.lists[db.currentId].items;
                const item = list.splice(evt.oldIndex, 1)[0];
                list.splice(evt.newIndex, 0, item);
                window.save();
            }
        });
    }
}

// פונקציית הפס הדק להסתרת הבר
document.addEventListener('DOMContentLoaded', () => {
    const dragHandle = document.getElementById('dragHandle');
    const bottomBar = document.getElementById('bottomBar');
    if (dragHandle && bottomBar) {
        dragHandle.onclick = () => {
            bottomBar.classList.toggle('hidden');
        };
    }
});

function render() {
    document.getElementById('pageLists').classList.toggle('hidden', activePage!=='lists');
    document.getElementById('pageSummary').classList.toggle('hidden', activePage!=='summary');
    document.getElementById('tabLists').className = `tab-btn flex-1 ${activePage==='lists'?'tab-active':''}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 ${activePage==='summary'?'tab-active':''}`;

    const container = document.getElementById(activePage==='lists'?'itemsContainer':'summaryContainer');
    container.innerHTML = '';
    let total=0, paid=0;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'פתוח לעריכה';
        list.items.forEach((item, idx) => {
            const s = item.price*item.qty; total+=s; if(item.checked) paid+=s;
            const div = document.createElement('div');
            div.className = "item-card bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100";
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked?'checked':''} onchange="window.toggleItem(${idx})" class="w-7 h-7">
                        <div class="font-bold ${item.checked?'line-through text-gray-300':''}" style="font-size:${db.fontSize}px">${item.name}</div>
                    </div>
                    ${!isLocked ? `<button onclick="window.removeItem(${idx})" class="text-red-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>` : ''}
                </div>
                <div class="flex justify-between mt-3 items-center">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
                        <button onclick="window.changeQty(${idx}, 1)" class="font-bold text-green-600 text-xl">+</button>
                        <span>${item.qty}</span>
                        <button onclick="window.changeQty(${idx}, -1)" class="font-bold text-red-600 text-xl">-</button>
                    </div>
                    <span onclick="window.openEditTotalModal(${idx})" class="font-black text-indigo-600 cursor-pointer">₪${s.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
        initSortable();
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total-paid).toFixed(2);
}

// פונקציות שמירה ושאר הלוגיקה זהות...
window.save = () => { localStorage.setItem('VPLUS_DB_V1', JSON.stringify(db)); render(); if(isConnected) syncToCloud(); };
window.addItem = () => { const n=document.getElementById('itemName').value, p=parseFloat(document.getElementById('itemPrice').value)||0; if(n){ db.lists[db.currentId].items.push({name:n, price:p, qty:1, checked:false}); window.save(); window.closeModal('inputForm'); } };
window.toggleItem = (i) => { db.lists[db.currentId].items[i].checked=!db.lists[db.currentId].items[i].checked; window.save(); };
window.removeItem = (i) => { db.lists[db.currentId].items.splice(i,1); window.save(); };
window.changeQty = (i,d) => { if(db.lists[db.currentId].items[i].qty+d>0){ db.lists[db.currentId].items[i].qty+=d; window.save(); } };
window.updateFontSize = (v) => { db.fontSize=v; render(); };
window.saveListName = () => { const n=document.getElementById('editListNameInput').value; if(n){ db.lists[db.currentId].name=n; window.save(); window.closeModal('editListNameModal'); } };
window.saveNewList = () => { const n=document.getElementById('newListNameInput').value; if(n){ const id='L'+Date.now(); db.lists[id]={name:n, items:[]}; db.currentId=id; activePage='lists'; window.save(); window.closeModal('newListModal'); } };
window.executeClear = () => { db.lists[db.currentId].items=[]; window.save(); window.closeModal('confirmModal'); };
window.openEditTotalModal = (i) => { currentEditIdx=i; window.openModal('editTotalModal'); };
window.saveTotal = () => { const v=parseFloat(document.getElementById('editTotalInput').value); if(v){ const item=db.lists[db.currentId].items[currentEditIdx]; item.price=v/item.qty; window.save(); window.closeModal('editTotalModal'); } };

// WhatsApp & Sync Logic...
window.onload = render;

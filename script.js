// ========== Google Drive Config ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 

let gapiInited = false, gisInited = false, tokenClient, accessToken = null, isConnected = false;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', selectedInSummary: [], lists: { 'L1': { name: 'הרשימה שלי', items: [] } }, fontSize: 16
};
let isLocked = true, activePage = 'lists', currentEditIdx = null;

// ========== Global Functions (For HTML) ==========
window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');
window.showPage = (p) => { activePage = p; render(); };
window.toggleLock = () => { isLocked = !isLocked; render(); };

// ========== Google Auth (תיקון הסנכרון) ==========
window.gapiLoaded = () => {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
        gapiInited = true;
    });
};

window.gisLoaded = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.file', callback: ''
    });
    gisInited = true;
};

window.handleCloudClick = async () => {
    if (!gapiInited || !gisInited) { alert("טוען חיבור לגוגל..."); return; }
    if (isConnected) { await loadAndMerge(); alert("סונכרן בהצלחה!"); } 
    else {
        tokenClient.callback = async (resp) => {
            if (resp.error) return;
            accessToken = resp.access_token;
            gapi.client.setToken(resp);
            isConnected = true;
            document.getElementById('cloudIndicator').style.backgroundColor = '#22c55e';
            await loadAndMerge();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
};

// ========== Render Logic (תיקון הכפתורים והגרפיקה) ==========
function render() {
    document.getElementById('pageLists').classList.toggle('hidden', activePage !== 'lists');
    document.getElementById('pageSummary').classList.toggle('hidden', activePage !== 'summary');
    
    document.getElementById('tabLists').className = `tab-btn flex-1 ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn flex-1 ${activePage === 'summary' ? 'tab-active' : ''}`;

    let total = 0, paid = 0;
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    container.innerHTML = '';

    if (activePage === 'lists') {
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'פתוח לעריכה';
        
        // תיקון צבע מנעול
        const lockBtn = document.getElementById('mainLockBtn');
        lockBtn.style.backgroundColor = isLocked ? '#4285F4' : '#fb923c';

        list.items.forEach((item, idx) => {
            const s = item.price * item.qty; total += s; if(item.checked) paid += s;
            const div = document.createElement('div');
            div.className = "item-card bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3";
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="window.toggleItem(${idx})" class="w-7 h-7">
                        <div class="font-bold ${item.checked ? 'line-through text-gray-300' : ''}" style="font-size:${db.fontSize}px">${item.name}</div>
                    </div>
                    ${!isLocked ? `<button onclick="window.removeItem(${idx})" class="trash-btn">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>` : ''}
                </div>
                <div class="flex justify-between mt-3 items-center">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
                        <button onclick="window.changeQty(${idx}, 1)" class="font-bold text-green-600 text-2xl">+</button>
                        <span class="font-bold qty-display w-6 text-center">${item.qty}</span>
                        <button onclick="window.changeQty(${idx}, -1)" class="font-bold text-red-600 text-2xl">-</button>
                    </div>
                    <span onclick="window.openEditTotalModal(${idx})" class="font-black text-indigo-600 cursor-pointer">₪${s.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    } else {
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id]; let lt = 0;
            l.items.forEach(i => lt += (i.price*i.qty));
            const isSel = db.selectedInSummary.includes(id); if(isSel) total += lt;
            const div = document.createElement('div');
            div.className = "bg-white p-4 rounded-2xl shadow-sm mb-3 flex justify-between items-center";
            div.innerHTML = `<div class="flex items-center gap-4">
                <input type="checkbox" ${isSel ? 'checked' : ''} onchange="window.toggleSum('${id}')" class="w-7 h-7">
                <span class="font-bold" onclick="window.switchToList('${id}')">${l.name}</span>
            </div><div class="font-bold text-indigo-600">₪${lt.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Actions ==========
window.save = () => { localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db)); render(); if(isConnected) syncToCloud(); };
window.addItem = () => {
    const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) { db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); window.save(); closeModal('inputForm'); }
};
window.toggleItem = (i) => { db.lists[db.currentId].items[i].checked = !db.lists[db.currentId].items[i].checked; window.save(); };
window.removeItem = (i) => { db.lists[db.currentId].items.splice(i, 1); window.save(); };
window.changeQty = (i, d) => { if(db.lists[db.currentId].items[i].qty + d > 0) { db.lists[db.currentId].items[i].qty += d; window.save(); } };
window.updateFontSize = (v) => { db.fontSize = v; document.getElementById('fontSizeValue').innerText = v; render(); };
window.toggleSum = (id) => { const i = db.selectedInSummary.indexOf(id); if(i>-1) db.selectedInSummary.splice(i,1); else db.selectedInSummary.push(id); window.save(); };
window.toggleSelectAll = (checked) => { db.selectedInSummary = checked ? Object.keys(db.lists) : []; window.save(); };
window.switchToList = (id) => { db.currentId = id; activePage = 'lists'; render(); };

// WhatsApp & PDF
window.shareFullToWhatsApp = () => { /* לוגיקת וואטסאפ זהה */ };
window.preparePrint = () => {
    closeModal('settingsModal');
    const area = document.getElementById('printArea');
    let grand = 0, html = `<div dir="rtl" style="padding:40px; font-family:sans-serif;"><h1>דוח Vplus</h1>`;
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id]; let sum = 0;
        html += `<h3>${l.name}</h3><table border="1" style="width:100%; border-collapse:collapse;">`;
        l.items.forEach(i => { const s=i.price*i.qty; sum+=s; html+=`<tr><td>${i.name}</td><td>${i.qty}</td><td>₪${s.toFixed(2)}</td></tr>`; });
        html += `</table><p>סה"כ: ₪${sum.toFixed(2)}</p><br>`; grand+=sum;
    });
    html += `<h2>סה"כ כללי: ₪${grand.toFixed(2)}</h2></div>`;
    area.innerHTML = html;
    setTimeout(() => { window.print(); }, 500);
};

// ... שאר לוגיקת הענן ...
window.onload = render;

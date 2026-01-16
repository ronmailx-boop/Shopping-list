// ========== Google Config ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
let gapiInited = false, gisInited = false, tokenClient, accessToken = null, isConnected = false;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', selectedInSummary: [], lists: { 'L1': { name: 'הרשימה שלי', items: [] } }, fontSize: 16
};
let isLocked = true, activePage = 'lists', currentEditIdx = null, sortableInstance = null;

// ========== Auth ==========
function gapiLoaded() { gapi.load('client', async () => { await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] }); gapiInited = true; }); }
function gisLoaded() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.file', callback: '' }); gisInited = true; }
async function handleCloudClick() {
    if (!gapiInited || !gisInited) return;
    if (isConnected) { await loadAndMerge(); } 
    else {
        tokenClient.callback = async (resp) => {
            accessToken = resp.access_token; gapi.client.setToken(resp); isConnected = true;
            document.getElementById('cloudIndicator').style.backgroundColor = '#22c55e';
            await loadAndMerge();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

// ========== UI Logic ==========
function toggleBottomBar(e) {
    if (e.target.closest('button')) return;
    document.getElementById('bottomBarElement').classList.toggle('collapsed');
}

function updateFontSize(val) {
    db.fontSize = parseInt(val);
    document.getElementById('fontSizeValue').innerText = val;
    document.documentElement.style.setProperty('--base-font-size', val + 'px');
    save();
}

function initSortable() {
    const el = document.getElementById('itemsContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (!isLocked && activePage === 'lists') {
        sortableInstance = Sortable.create(el, {
            animation: 150,
            onEnd: (evt) => {
                const list = db.lists[db.currentId].items;
                const item = list.splice(evt.oldIndex, 1)[0];
                list.splice(evt.newIndex, 0, item);
                save();
            }
        });
    }
}

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
        
        // צבע מנעול: כחול בנעילה, כתום בפתיחה
        const lockBtn = document.getElementById('mainLockBtn');
        lockBtn.style.backgroundColor = isLocked ? '#4285F4' : '#fb923c';
        document.getElementById('lockIconPath').setAttribute('d', isLocked ? 
            'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 
            'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');

        list.items.forEach((item, idx) => {
            const s = item.price * item.qty; total += s; if(item.checked) paid += s;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7">
                        <div class="item-name font-bold ${item.checked ? 'line-through text-gray-300' : ''}" style="font-size:${db.fontSize}px">${item.name}</div>
                    </div>
                    ${!isLocked ? `<button onclick="removeItem(${idx})" class="trash-btn"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>` : ''}
                </div>
                <div class="flex justify-between mt-3 items-center">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
                        <button onclick="changeQty(${idx}, 1)" class="font-bold text-green-600 text-2xl">+</button>
                        <span class="font-bold qty-display w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="font-bold text-red-600 text-2xl">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${idx})" class="font-black text-indigo-600 text-2xl">₪${s.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
        initSortable();
    } else {
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id]; let lt = 0;
            l.items.forEach(i => lt += (i.price*i.qty));
            const isSel = db.selectedInSummary.includes(id); if(isSel) total += lt;
            const div = document.createElement('div');
            div.className = "item-card flex-row justify-between items-center";
            div.innerHTML = `<div class="flex items-center gap-4">
                <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7">
                <span class="font-bold text-xl" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</span>
            </div><div class="font-bold text-indigo-600">₪${lt.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    }
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// ========== Actions ==========
function save() { localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db)); render(); if(isConnected) syncToCloud(); }
function addItem() { const n = document.getElementById('itemName').value, p = parseFloat(document.getElementById('itemPrice').value)||0; if(n){ db.lists[db.currentId].items.push({name:n, price:p, qty:1, checked:false}); save(); closeModal('inputForm'); document.getElementById('itemName').value=''; document.getElementById('itemPrice').value=''; } }
function toggleItem(i) { db.lists[db.currentId].items[i].checked = !db.lists[db.currentId].items[i].checked; save(); }
function removeItem(i) { db.lists[db.currentId].items.splice(i,1); save(); }
function changeQty(i, d) { if(db.lists[db.currentId].items[i].qty + d > 0) { db.lists[db.currentId].items[i].qty += d; save(); } }
function toggleLock() { isLocked = !isLocked; render(); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showPage(p) { activePage = p; render(); }

// PDF Print Professional
function preparePrint() {
    closeModal('settingsModal');
    const area = document.getElementById('printArea');
    let grand = 0, html = `<div dir="rtl" style="padding:40px; font-family:sans-serif; color:#333;"><h1 style="text-align:center; color:#7367f0; margin-bottom:30px; border-bottom:2px solid #7367f0; padding-bottom:10px;">דוח קניות Vplus</h1>`;
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id]; let sum = 0;
        html += `<h2 style="background:#f3f2fe; padding:12px; border-right:6px solid #7367f0; margin-top:20px;">${l.name}</h2><table style="width:100%; border-collapse:collapse; margin-top:10px;">`;
        l.items.forEach(i => { const s=i.price*i.qty; sum+=s; html+=`<tr><td style="border-bottom:1px solid #eee; padding:12px;">${i.name}</td><td style="border-bottom:1px solid #eee; padding:12px; text-align:center;">${i.qty}</td><td style="border-bottom:1px solid #eee; padding:12px; text-align:left; font-weight:bold;">₪${s.toFixed(2)}</td></tr>`; });
        html += `</table><p style="text-align:left; font-weight:black; font-size:18px; color:#7367f0; margin-top:10px;">סה"כ רשימה: ₪${sum.toFixed(2)}</p>`; grand+=sum;
    });
    html += `<div style="margin-top:50px; text-align:center; padding:20px; border:3px double #7367f0; border-radius:15px;"><h2 style="margin:0;">סה"כ לתשלום כללי: ₪${grand.toFixed(2)}</h2></div></div>`;
    area.innerHTML = html;
    setTimeout(() => { window.print(); area.innerHTML=''; }, 500);
}

// ... WhatsApp & Cloud functions as before ...
async function syncToCloud() { /* לוגיקה זהה */ }
async function loadAndMerge() { /* לוגיקה זהה */ }

window.onload = () => {
    document.getElementById('fontSizeSlider').value = db.fontSize;
    document.getElementById('fontSizeValue').innerText = db.fontSize;
    document.documentElement.style.setProperty('--base-font-size', db.fontSize + 'px');
    render();
};

// ========== Google Drive Configuration ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Vplus_Budget_Data';
const FILE_NAME = 'budget_data.json';

let gapiInited = false, gisInited = false, tokenClient, accessToken = null;
let isSyncing = false, isConnected = false, syncTimeout = null;

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists',
    selectedInSummary: []
};

let activePage = db.lastActivePage || 'lists';
let isLocked = true;
let showMissingOnly = false;
let highlightedItemName = null;
let sortableInstance = null;
let currentEditIdx = null;

// ========== Core Functions ==========
function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncToCloud(), 2000);
    }
}

function openModal(id) { 
    const m = document.getElementById(id);
    if(m) {
        m.classList.add('active');
        if(id === 'inputForm') {
            document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = '';
            setTimeout(() => document.getElementById('itemName').focus(), 150);
        }
    }
}

function closeModal(id) { 
    const m = document.getElementById(id); 
    if(m) m.classList.remove('active'); 
}

function showPage(p) { activePage = p; save(); }

function toggleBottomBar(e) {
    if (e.target.closest('button') || e.target.closest('input')) return;
    document.getElementById('bottomBar').classList.toggle('minimized');
}

function toggleLock() { 
    isLocked = !isLocked; 
    render(); 
}

// ========== Item Logic ==========
function addItem() { 
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0; 
    if (n) { 
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false }); 
        closeModal('inputForm'); 
        save(); 
    } 
}

function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function changeQty(idx, d) { 
    if(db.lists[db.currentId].items[idx].qty + d >= 1) { 
        db.lists[db.currentId].items[idx].qty += d; 
        save(); 
    } 
}

// ========== Summary Page Logic (Selection) ==========
function toggleListSelection(id) {
    const idx = db.selectedInSummary.indexOf(id);
    if (idx === -1) db.selectedInSummary.push(id);
    else db.selectedInSummary.splice(idx, 1);
    save();
}

function toggleSelectAll(checked) {
    if (checked) db.selectedInSummary = Object.keys(db.lists);
    else db.selectedInSummary = [];
    save();
}

// ========== PDF & Sharing ==========
function preparePrint() { 
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    
    let grandTotal = 0;
    let htmlContent = `
        <div style="direction:rtl; font-family:sans-serif; padding:20px;">
            <h1 style="text-align:center; color:#7367f0; margin-bottom:10px;">Vplus - דוח תקציב חכם</h1>
            <p style="text-align:center; color:#666; margin-bottom:30px;">הופק בתאריך: ${new Date().toLocaleDateString('he-IL')}</p>`;
    
    Object.keys(db.lists).forEach(id => {
        const l = db.lists[id];
        let lTotal = 0;
        htmlContent += `
            <div style="margin-bottom:30px; border:1px solid #eee; border-radius:15px; padding:15px;">
                <h2 style="color:#7367f0; border-bottom:2px solid #7367f0; padding-bottom:5px;">${l.name}</h2>
                <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                    <thead>
                        <tr style="background:#f8f9fa;">
                            <th style="text-align:right; padding:10px; border-bottom:1px solid #ddd;">מוצר</th>
                            <th style="text-align:center; padding:10px; border-bottom:1px solid #ddd;">כמות</th>
                            <th style="text-align:left; padding:10px; border-bottom:1px solid #ddd;">סה"כ</th>
                        </tr>
                    </thead>
                    <tbody>`;
        l.items.forEach(i => {
            const s = i.price * i.qty; lTotal += s;
            htmlContent += `
                <tr>
                    <td style="padding:10px; border-bottom:1px solid #eee;">${i.name}</td>
                    <td style="text-align:center; padding:10px; border-bottom:1px solid #eee;">${i.qty}</td>
                    <td style="text-align:left; padding:10px; border-bottom:1px solid #eee;">₪${s.toFixed(2)}</td>
                </tr>`;
        });
        htmlContent += `
                    </tbody>
                </table>
                <div style="text-align:left; margin-top:10px; font-weight:bold; font-size:1.1em;">סה"כ לרשימה: ₪${lTotal.toFixed(2)}</div>
            </div>`;
        grandTotal += lTotal;
    });
    
    htmlContent += `
            <div style="text-align:center; margin-top:40px; padding:20px; background:#7367f0; color:white; border-radius:15px;">
                <h2 style="margin:0;">סה"כ כללי לתשלום: ₪${grandTotal.toFixed(2)}</h2>
            </div>
        </div>`;
    
    printArea.innerHTML = htmlContent;
    setTimeout(() => { window.print(); }, 500);
}

function shareNative(type) {
    let text = "";
    if (type === 'list') {
        const l = db.lists[db.currentId];
        text = `🛒 *${l.name}*\n` + l.items.map(i => `${i.checked ? '✅':'⬜'} ${i.name} (x${i.qty})`).join('\n');
    } else {
        text = "📋 *סיכום רשימות Vplus:*\n";
        db.selectedInSummary.forEach(id => {
            const l = db.lists[id];
            text += `\n🔹 ${l.name}`;
        });
    }
    if (navigator.share) navigator.share({ text });
    else { navigator.clipboard.writeText(text); alert("הטקסט הועתק ללוח"); }
}

// ========== Render ==========
function render() {
    const list = db.lists[db.currentId];
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('listNameDisplay').innerText = list.name;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            if (showMissingOnly && item.checked) return;

            const div = document.createElement('div');
            div.className = `item-card ${item.name === highlightedItemName ? 'highlight-flash' : ''}`;
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked':''} onchange="toggleItem(${idx})" class="w-7 h-7">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                            <span class="item-number">${idx + 1}.</span> ${item.name}
                        </div>
                    </div>
                    <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
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
        Object.keys(db.lists).forEach(id => {
            const l = db.lists[id];
            const isSelected = db.selectedInSummary.includes(id);
            const div = document.createElement('div');
            div.className = "item-card flex flex-row items-center gap-4 cursor-pointer";
            div.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleListSelection('${id}')" class="w-7 h-7 accent-indigo-600">
                <div class="flex-1 font-bold text-xl" onclick="db.currentId='${id}'; showPage('lists')">${l.name}</div>
                <div class="text-gray-400">⬅️</div>`;
            container.appendChild(div);
        });
        document.getElementById('selectAllLists').checked = db.selectedInSummary.length === Object.keys(db.lists).length;
    }

    // Update Bottom Bar
    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);

    // Lock Button Style
    const lockBtn = document.getElementById('mainLockBtn');
    const lockPath = document.getElementById('lockIconPath');
    lockBtn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-500'}`;
    lockPath.setAttribute('d', isLocked ? 
        'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 
        'M8 11V7a4 4 1 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    document.getElementById('statusTag').innerText = isLocked ? "נעול" : "עריכה פעילה (גרירה)";

    // Sortable Initialization
    if (sortableInstance) sortableInstance.destroy();
    if (!isLocked && activePage === 'lists') {
        sortableInstance = new Sortable(container, {
            animation: 150,
            onEnd: (evt) => {
                const items = db.lists[db.currentId].items;
                const [movedItem] = items.splice(evt.oldIndex, 1);
                items.splice(evt.newIndex, 0, movedItem);
                save();
            }
        });
    }
}

// ========== Initialize ==========
window.onload = () => {
    document.getElementById('bottomBar').addEventListener('click', toggleBottomBar);
    render();
};

// ========== הגדרות גוגל דרייב ==========
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
let isConnected = false;

// ========== מצב האפליקציה (Database) ==========
let db = JSON.parse(localStorage.getItem('VPLUS_DB_V1')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    fontSize: 16
};

let isLocked = true;
let activePage = 'lists';

// ========== פונקציות אתחול גלובליות (חשוב מאוד!) ==========
window.gapiLoaded = function() {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
        console.log("GAPI loaded");
    });
};

window.gisLoaded = function() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', 
    });
    gisInited = true;
    console.log("GIS loaded");
};

// ========== לוגיקת כפתור הסנכרון ==========
window.handleCloudClick = async function() {
    console.log("Cloud button clicked");
    
    if (!gapiInited || !gisInited) {
        alert("המערכת עדיין בטעינה, אנא המתן מספר שניות.");
        return;
    }

    if (isConnected) {
        // אם כבר מחובר, בצע טעינה ומיזוג נתונים
        await loadAndMerge();
    } else {
        // בקשת התחברות
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) throw (resp);
            accessToken = resp.access_token;
            gapi.client.setToken(resp); 
            isConnected = true;
            
            // עדכון חזותי שהסנכרון פעיל
            const indicator = document.getElementById('cloudIndicator');
            if(indicator) indicator.style.backgroundColor = '#22c55e'; 
            
            await loadAndMerge();
            render();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
};

// ========== פעולות מול Google Drive ==========
async function findOrCreateFolder() {
    const resp = await gapi.client.drive.files.list({ 
        q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false` 
    });
    if (resp.result.files.length > 0) return resp.result.files[0].id;
    const folder = await gapi.client.drive.files.create({ 
        resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' } 
    });
    return folder.result.id;
}

async function syncToCloud() {
    if (!accessToken) return;
    try {
        const folderId = await findOrCreateFolder();
        const fileList = await gapi.client.drive.files.list({ 
            q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false` 
        });
        const fileId = fileList.result.files.length > 0 ? fileList.result.files[0].id : null;
        const content = JSON.stringify(db);

        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: content
            });
        } else {
            const metadata = { name: FILE_NAME, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: form
            });
        }
        console.log("Synced successfully");
    } catch (e) { console.error('Sync failed:', e); }
}

async function loadAndMerge() {
    try {
        const folderId = await findOrCreateFolder();
        const res = await gapi.client.drive.files.list({ 
            q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false` 
        });
        if (res.result.files.length > 0) {
            const fileId = res.result.files[0].id;
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const cloudDb = await response.json();
            db = cloudDb; // מחליף את הנתונים המקומיים בנתוני הענן
            save();
        }
    } catch (e) { console.error('Load failed:', e); }
}

// ========== לוגיקה פנימית ורינדור (מותאם ל-style.css שלך) ==========
function save() { 
    localStorage.setItem('VPLUS_DB_V1', JSON.stringify(db));
    render();
    if (isConnected) syncToCloud();
}

function render() {
    // החלפת עמודים
    document.getElementById('pageLists').classList.toggle('hidden', activePage !== 'lists');
    document.getElementById('pageSummary').classList.toggle('hidden', activePage !== 'summary');
    
    // סגנון טאבים
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    const list = db.lists[db.currentId] || { name: 'הרשימה שלי', items: [] };
    document.getElementById('listNameDisplay').innerText = list.name;
    document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'פתוח לעריכה';

    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    
    let total = 0, paid = 0;

    list.items.forEach((item, idx) => {
        const sub = item.price * item.qty;
        total += sub;
        if (item.checked) paid += sub;

        const div = document.createElement('div');
        div.className = "item-card bg-white";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6">
                    <span class="${item.checked ? 'line-through text-gray-400' : ''}" style="font-size:${db.fontSize}px">${item.name}</span>
                </div>
                ${!isLocked ? `<button onclick="removeItem(${idx})" class="text-red-500">🗑️</button>` : ''}
            </div>
            <div class="flex justify-between mt-3">
                <div class="flex items-center gap-2 bg-gray-100 rounded-lg px-2">
                    <button onclick="changeQty(${idx}, 1)" class="text-xl font-bold text-green-600">+</button>
                    <span class="font-bold">${item.qty}</span>
                    <button onclick="changeQty(${idx}, -1)" class="text-xl font-bold text-red-600">-</button>
                </div>
                <span class="font-bold text-indigo-600">₪${sub.toFixed(2)}</span>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// פונקציות עזר שנקראות מה-HTML
window.toggleItem = (idx) => { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); };
window.removeItem = (idx) => { db.lists[db.currentId].items.splice(idx, 1); save(); };
window.changeQty = (idx, d) => { 
    if(db.lists[db.currentId].items[idx].qty + d > 0) {
        db.lists[db.currentId].items[idx].qty += d; save(); 
    }
};
window.toggleLock = () => { isLocked = !isLocked; render(); };
window.showPage = (p) => { activePage = p; render(); };
window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');

window.addItem = () => {
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) {
        db.lists[db.currentId].items.push({name: n, price: p, qty: 1, checked: false});
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        window.closeModal('inputForm');
        save();
    }
};

window.onload = () => {
    console.log("App started");
    render();
};

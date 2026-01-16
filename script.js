// Google Drive Config
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

// App State
let db = JSON.parse(localStorage.getItem('VPLUS_DB_V1')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    fontSize: 16
};
let isLocked = true;
let activePage = 'lists';

// Auth Functions (Global)
window.gapiLoaded = function() {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
    });
};

window.gisLoaded = function() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', 
    });
    gisInited = true;
};

window.handleCloudClick = async function() {
    if (!gapiInited || !gisInited) {
        alert("המערכת בטעינה, נסה שוב בעוד רגע...");
        return;
    }
    if (isConnected) {
        await loadAndMerge();
    } else {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) throw (resp);
            accessToken = resp.access_token;
            gapi.client.setToken(resp); 
            isConnected = true;
            document.getElementById('cloudIndicator').style.backgroundColor = '#22c55e';
            await loadAndMerge();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
};

// Cloud Sync Logic
async function findOrCreateFolder() {
    const resp = await gapi.client.drive.files.list({ q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false` });
    if (resp.result.files.length > 0) return resp.result.files[0].id;
    const folder = await gapi.client.drive.files.create({ resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' } });
    return folder.result.id;
}

async function syncToCloud() {
    if (!accessToken) return;
    try {
        const folderId = await findOrCreateFolder();
        const fileList = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false` });
        const fileId = fileList.result.files.length > 0 ? fileList.result.files[0].id : null;
        const content = JSON.stringify(db);
        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: content
            });
        } else {
            const metadata = { name: FILE_NAME, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form
            });
        }
    } catch (e) { console.error('Sync failed', e); }
}

async function loadAndMerge() {
    try {
        const folderId = await findOrCreateFolder();
        const res = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false` });
        if (res.result.files.length > 0) {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${res.result.files[0].id}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
            db = await response.json();
            save();
        }
    } catch (e) { console.error('Load failed', e); }
}

// UI Logic
function save() { 
    localStorage.setItem('VPLUS_DB_V1', JSON.stringify(db));
    render();
    if (isConnected) syncToCloud();
}

window.render = function() {
    document.getElementById('pageLists').classList.toggle('hidden', activePage !== 'lists');
    document.getElementById('pageSummary').classList.toggle('hidden', activePage !== 'summary');
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
        total += sub; if (item.checked) paid += sub;
        const div = document.createElement('div');
        div.className = "item-card bg-white p-4 mb-3 rounded-2xl shadow-sm";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6">
                    <span class="${item.checked ? 'line-through text-gray-400' : ''}" style="font-size:${db.fontSize}px">${item.name}</span>
                </div>
                ${!isLocked ? `<button onclick="removeItem(${idx})" class="text-red-500">🗑️</button>` : ''}
            </div>
            <div class="

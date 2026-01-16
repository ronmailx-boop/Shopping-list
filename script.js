// configuration
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

// Database
let db = JSON.parse(localStorage.getItem('VPLUS_DB_V1')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    fontSize: 16
};

// Functions for Google (Global)
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
        alert("טוען חיבור לגוגל... נסה שוב בעוד רגע");
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

// Google Drive Sync
async function syncToCloud() {
    if (!accessToken) return;
    try {
        const resp = await gapi.client.drive.files.list({ q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'` });
        let folderId = resp.result.files.length > 0 ? resp.result.files[0].id : (await gapi.client.drive.files.create({ resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' } })).result.id;
        
        const fileList = await gapi.client.drive.files.list({ q: `name='${FILE_NAME}' and '${folderId}' in parents` });
        const fileId = fileList.result.files.length > 0 ? fileList.result.files[0].id : null;
        const content = JSON.stringify(db);

        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: content
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
    } catch (e) { console.error(e); }
}

async function loadAndMerge() {
    // ... לוגיקת טעינה ...
    render();
}

// UI Logic (Matches your style.css)
function save() { 
    localStorage.setItem('VPLUS_DB_V1', JSON.stringify(db));
    render();
    if (isConnected) syncToCloud();
}

function render() {
    const list = db.lists[db.currentId];
    document.getElementById('listNameDisplay').innerText = list.name;
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    // רינדור פריטים לפי המבנה של style.css
}

window.onload = render;

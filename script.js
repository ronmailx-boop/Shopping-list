// Google Config
const CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

// שימוש ב-Key המקורי מהקובץ התקין שלך
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists',
    lastUpdated: Date.now()
};

let isLocked = true, activePage = db.lastActivePage || 'lists', currentEditIdx = null, listToDelete = null;
let tokenClient;

// עדכון פונקציית save המקורית שלך
function save() { 
    db.lastActivePage = activePage;
    db.lastUpdated = Date.now();
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db)); 
    render(); 
    if (localStorage.getItem('G_TOKEN')) uploadToCloud();
}

// --- הוספת מנגנון גוגל ---

function handleAuthClick() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES,
        callback: async (resp) => {
            if (resp.error) return;
            localStorage.setItem('G_TOKEN', resp.access_token);
            document.getElementById('cloudIndicator').style.backgroundColor = '#22c55e';
            syncWithCloud();
        },
    });
    tokenClient.requestAccessToken({prompt: 'consent'});
}

async function uploadToCloud() {
    const token = localStorage.getItem('G_TOKEN');
    if (!token) return;
    const metadata = { name: 'vplus_backup.json', parents: ['appAppDataFolder'] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({name:'vplus_backup.json', parents:['appDataFolder']})], {type: 'application/json'}));
    form.append('file', new Blob([JSON.stringify(db)], {type: 'application/json'}));
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form
    });
}

// פונקציות יבוא ויצוא שביקשת
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            db = JSON.parse(e.target.result);
            save();
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

// שאר הפונקציות (render, addItem וכו') - העתק אותן בדיוק מה-script.js התקין שלך
// ...

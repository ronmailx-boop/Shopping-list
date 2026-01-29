// ========== Google Drive Configuration ==========
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
let isSyncing = false;
let isConnected = false;

// ========== App Data & Versioning ==========
const APP_VERSION = '1.0.0'; // הגרסה הרשמית לחנות
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: { 'L1': { name: 'הרשימה שלי', url: '', budget: 0, items: [] } },
    history: [],
    templates: [],
    lastActivePage: 'lists',
    stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} }
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';

// ========== Core Functions ==========
function save() {
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (isConnected && !isSyncing) syncToCloud();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container && activePage !== 'stats') return;

    // עדכון טאבים
    ['tabLists', 'tabSummary', 'tabStats'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = `tab-btn ${id.toLowerCase().includes(activePage) ? 'tab-active' : ''}`;
    });

    if (activePage === 'lists') {
        renderListsPage(container);
    } else if (activePage === 'summary') {
        renderSummaryPage(container);
    } else if (activePage === 'stats') {
        renderStats();
    }
}

function renderListsPage(container) {
    const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
    container.innerHTML = '';
    list.items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = "item-card";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6">
                <span class="flex-1 px-3 ${item.checked ? 'line-through opacity-50' : ''}">${item.name}</span>
                <span class="font-bold">₪${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

// ========== UI & Modals ==========
function openModal(id) { 
    const m = document.getElementById(id);
    if (m) m.classList.add('active'); 
}

function closeModal(id) { 
    const m = document.getElementById(id);
    if (m) m.classList.remove('active'); 
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function showPage(p) {
    activePage = p;
    save();
}

// ========== Google Drive Sync ==========
async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        // לוגיקת העלאה לדרייב המקורית שלך...
    } catch (err) { console.error(err); }
    finally { isSyncing = false; updateCloudIndicator('connected'); }
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    if (indicator) indicator.className = `w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`;
}

// ========== Initialization ==========
window.addEventListener('DOMContentLoaded', () => {
    // טעינת Dark Mode
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');

    // עדכון גרסה בתצוגה
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) versionDisplay.innerText = APP_VERSION;

    render();
});

// טעינת סקריפטים של גוגל
const script1 = document.createElement('script'); script1.src = 'https://apis.google.com/js/api.js'; script1.onload = () => gapi.load('client', () => gapi.client.init({apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC]})); document.head.appendChild(script1);
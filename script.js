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

// ========== Categories ==========
const CATEGORIES = {
    'פירות וירקות': '#22c55e', 'בשר ודגים': '#ef4444', 'חלב וביצים': '#3b82f6',
    'לחם ומאפים': '#f59e0b', 'שימורים': '#8b5cf6', 'חטיפים': '#ec4899',
    'משקאות': '#06b6d4', 'ניקיון': '#10b981', 'היגיינה': '#6366f1', 'אחר': '#6b7280'
};

// ========== App Data ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] } },
    history: [],
    stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} }
};

let isLocked = true;
let activePage = 'lists';
let currentEditIdx = null;
let sortableInstance = null;

// ========== SEARCH & HIGHLIGHT LOGIC ==========

function handleSearchInput(val) {
    const list = db.lists[db.currentId];
    const datalist = document.getElementById('itemSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    
    if (!val || !list) return;

    // סינון מוצרים שקיימים ברשימה הנוכחית
    const matches = list.items.filter(item => item.name.includes(val));
    matches.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        datalist.appendChild(option);
    });

    // בדיקה אם המשתמש בחר ערך מדויק מהרשימה
    const exactMatch = list.items.find(i => i.name === val);
    if (exactMatch) {
        findItemInList(val);
    }
}

function findItemInList(specificVal = null) {
    const searchInput = document.getElementById('searchInput');
    const searchVal = specificVal || searchInput.value.trim();
    if (!searchVal) return;

    const items = db.lists[db.currentId].items;
    const itemIdx = items.findIndex(i => i.name === searchVal);

    if (itemIdx === -1) {
        showNotification('המוצר אינו ברשימה', 'warning');
        return;
    }

    const itemElements = document.querySelectorAll('#itemsContainer .item-card');
    const targetEl = Array.from(itemElements).find(el => parseInt(el.getAttribute('data-id')) === itemIdx);

    if (targetEl) {
        // גלילה חלקה למרכז המסך
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // החלת סגנון הדגשה
        targetEl.style.transition = 'all 0.4s ease';
        targetEl.style.boxShadow = '0 0 25px 8px rgba(115, 103, 240, 0.5)';
        targetEl.style.border = '3px solid #7367f0';
        targetEl.style.transform = 'scale(1.05)';
        targetEl.style.zIndex = "10";

        // פונקציה להסרת ההדגשה בגלילה
        const removeHighlight = () => {
            targetEl.style.boxShadow = '';
            targetEl.style.border = '';
            targetEl.style.transform = '';
            targetEl.style.zIndex = "";
            window.removeEventListener('scroll', removeHighlight);
        };

        // הוספת מאזין גלילה לאחר סיום האנימציה הראשונית
        setTimeout(() => {
            window.addEventListener('scroll', removeHighlight);
        }, 600);
        
        searchInput.value = ''; // ניקוי השדה
        searchInput.blur(); // הורדת המקלדת
    }
}

// ========== CORE FUNCTIONS ==========

function save() { 
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    let total = 0, paid = 0;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        if (container) {
            container.innerHTML = '';
            list.items.forEach((item, idx) => {
                const sub = item.price * item.qty; 
                total += sub; if (item.checked) paid += sub;
                
                const div = document.createElement('div'); 
                div.className = "item-card";
                div.setAttribute('data-id', idx);
                div.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-3 flex-1">
                            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                            <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</div>
                        </div>
                        <button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                            <button onclick="changeQty(${idx}, 1)" class="text-green-500 font-bold">+</button>
                            <span class="font-bold">${item.qty}</span>
                            <button onclick="changeQty(${idx}, -1)" class="text-red-500 font-bold">-</button>
                        </div>
                        <span class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                    </div>`;
                container.appendChild(div);
            });
        }
    } else if (activePage === 'summary') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        // לוגיקת רינדור רשימות (מקוצר למען הבהירות)
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

function completeList() {
    const list = db.lists[db.currentId];
    if (!list || list.items.length === 0) {
        showNotification('הרשימה ריקה!', 'warning');
        closeModal('confirmModal');
        return;
    }
    const total = list.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    db.history.push({ name: list.name, items: [...list.items], total, completedAt: Date.now() });
    db.stats.listsCompleted++;
    list.items = []; 
    closeModal('confirmModal');
    activePage = 'stats';
    save();
    showNotification('✅ הרשימה הושלמה ונשמרה!');
}

function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function showPage(p) { activePage = p; save(); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showNotification(m, t='success') { /* לוגיקת נוטיפיקציה */ }

function addItem() {
    const n = document.getElementById('itemName').value;
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if(n) { db.lists[db.currentId].items.push({name:n, price:p, qty:1, checked:false}); closeModal('inputForm'); save(); }
}

// ========== INITIALIZATION ==========
window.onload = () => render();

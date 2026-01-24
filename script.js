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
let driveFileId = null;
let syncTimeout = null;
let isSyncing = false;
let isConnected = false;

// ========== Categories ==========
const CATEGORIES = {
    'פירות וירקות': '#22c55e',
    'בשר ודגים': '#ef4444',
    'חלב וביצים': '#3b82f6',
    'לחם ומאפים': '#f59e0b',
    'שימורים': '#8b5cf6',
    'חטיפים': '#ec4899',
    'משקאות': '#06b6d4',
    'ניקיון': '#10b981',
    'היגיינה': '#6366f1',
    'אחר': '#6b7280'
};

// ========== App Data ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: {
        'L1': {
            name: 'הרשימה שלי',
            url: '',
            budget: 0,
            isTemplate: false,
            items: []
        }
    },
    history: [],
    templates: [],
    lastActivePage: 'lists',
    lastSync: 0,
    stats: {
        totalSpent: 0,
        listsCompleted: 0,
        monthlyData: {}
    }
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;
let monthlyChart = null;

// ========== Core Functions ==========
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    
    if (isConnected && !isSyncing) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncToCloud();
        }, 1500);
    }
}

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function toggleSum(id) {
    const i = db.selectedInSummary.indexOf(id);
    if (i > -1) db.selectedInSummary.splice(i, 1);
    else db.selectedInSummary.push(id);
    save();
}

function toggleSelectAll(checked) {
    db.selectedInSummary = checked ? Object.keys(db.lists) : [];
    save();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    const text = document.getElementById('darkModeText');
    if (text) {
        text.textContent = document.body.classList.contains('dark-mode') ? 'מצב יום ☀️' : 'מצב לילה 🌙';
    }
}

function showPage(p) {
    activePage = p;
    save();
}

function openModal(id) {
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('active');
    
    if(id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemCategory').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 150);
    }
    
    if(id === 'newListModal') {
        document.getElementById('newListNameInput').value = '';
        document.getElementById('newListUrlInput').value = '';
        document.getElementById('newListBudget').value = '';
        document.getElementById('newListTemplate').checked = false;
        setTimeout(() => document.getElementById('newListNameInput').focus(), 150);
    }
    
    if(id === 'editListNameModal') {
        const list = db.lists[db.currentId];
        document.getElementById('editListNameInput').value = list.name;
        document.getElementById('editListUrlInput').value = list.url || '';
        document.getElementById('editListBudget').value = list.budget || '';
        setTimeout(() => document.getElementById('editListNameInput').focus(), 150);
    }
    
    if(id === 'editTotalModal') {
        setTimeout(() => document.getElementById('editTotalInput').focus(), 150);
    }
    
    if(id === 'importModal') {
        document.getElementById('importText').value = '';
        setTimeout(() => document.getElementById('importText').focus(), 150);
    }
    
    if(id === 'historyModal') {
        renderHistory();
    }
    
    if(id === 'templatesModal') {
        renderTemplates();
    }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if(m) m.classList.remove('active');
}

function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.background = type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#ef4444';
    notif.style.color = 'white';
    notif.innerHTML = `<strong>${message}</strong>`;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ========== Search Functionality ==========
// Item Search in current list
const itemSearchInput = document.getElementById('itemSearchInput');
const itemSearchSuggestions = document.getElementById('itemSearchSuggestions');

if (itemSearchInput) {
    itemSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        const list = db.lists[db.currentId];
        
        if (!query || !list) {
            itemSearchSuggestions.classList.remove('active');
            itemSearchSuggestions.innerHTML = '';
            return;
        }
        
        const matches = list.items
            .map((item, idx) => ({item, idx}))
            .filter(({item}) => item.name.toLowerCase().includes(query));
        
        if (matches.length === 0) {
            itemSearchSuggestions.classList.remove('active');
            itemSearchSuggestions.innerHTML = '';
            return;
        }
        
        itemSearchSuggestions.innerHTML = matches
            .map(({item, idx}) => `
                <div class="suggestion-item" onclick="highlightAndScrollToItem(${idx})">
                    ${item.name}
                </div>
            `)
            .join('');
        
        itemSearchSuggestions.classList.add('active');
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!itemSearchInput.contains(e.target) && !itemSearchSuggestions.contains(e.target)) {
            itemSearchSuggestions.classList.remove('active');
        }
    });
}

function highlightAndScrollToItem(idx) {
    itemSearchSuggestions.classList.remove('active');
    itemSearchInput.value = '';
    
    const itemCards = document.querySelectorAll('.item-card');
    if (!itemCards[idx]) return;
    
    // Remove previous highlights
    itemCards.forEach(card => card.classList.remove('highlighted'));
    
    // Add highlight and scroll
    itemCards[idx].classList.add('highlighted');
    itemCards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight on scroll
    let scrollTimeout;
    const removeHighlight = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            itemCards[idx].classList.remove('highlighted');
            window.removeEventListener('scroll', removeHighlight);
        }, 300);
    };
    
    setTimeout(() => {
        window.addEventListener('scroll', removeHighlight);
    }, 1000);
}

// List Search in summary page
const listSearchInput = document.getElementById('listSearchInput');
const listSearchSuggestions = document.getElementById('listSearchSuggestions');

if (listSearchInput) {
    listSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (!query) {
            listSearchSuggestions.classList.remove('active');
            listSearchSuggestions.innerHTML = '';
            return;
        }
        
        const matches = Object.entries(db.lists)
            .filter(([id, list]) => list.name.toLowerCase().includes(query));
        
        if (matches.length === 0) {
            listSearchSuggestions.classList.remove('active');
            listSearchSuggestions.innerHTML = '';
            return;
        }
        
        listSearchSuggestions.innerHTML = matches
            .map(([id, list]) => `
                <div class="suggestion-item" onclick="highlightAndScrollToList('${id}')">
                    ${list.name}
                </div>
            `)
            .join('');
        
        listSearchSuggestions.classList.add('active');
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!listSearchInput.contains(e.target) && !listSearchSuggestions.contains(e.target)) {
            listSearchSuggestions.classList.remove('active');
        }
    });
}

function highlightAndScrollToList(listId) {
    listSearchSuggestions.classList.remove('active');
    listSearchInput.value = '';
    
    const listCheckboxes = document.querySelectorAll('.list-checkbox');
    const targetCheckbox = Array.from(listCheckboxes).find(checkbox => {
        const input = checkbox.querySelector('input[type="checkbox"]');
        return input && input.value === listId;
    });
    
    if (!targetCheckbox) return;
    
    // Remove previous highlights
    listCheckboxes.forEach(checkbox => checkbox.classList.remove('highlighted'));
    
    // Add highlight and scroll
    targetCheckbox.classList.add('highlighted');
    targetCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight on scroll
    let scrollTimeout;
    const removeHighlight = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            targetCheckbox.classList.remove('highlighted');
            window.removeEventListener('scroll', removeHighlight);
        }, 300);
    };
    
    setTimeout(() => {
        window.addEventListener('scroll', removeHighlight);
    }, 1000);
}
// ========== Render Function ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : activePage === 'summary' ? 'summaryContainer' : null);
    let total = 0, paid = 0;
    
    // Update tabs
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;
    document.getElementById('tabStats').className = `tab-btn ${activePage === 'stats' ? 'tab-active' : ''}`;
    
    // Update lock button
    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    
    if (btn && path && tag) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
        tag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";
    }
    
    // Show/hide pages
    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        
        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;
        
        if (container) {
            container.innerHTML = '';
            list.items.forEach((item, idx) => {
                const sub = item.price * item.qty;
                total += sub;
                if (item.checked) paid += sub;
                
                const categoryBadge = item.category ? `<span class="category-badge" style="background:${CATEGORIES[item.category] || '#6b7280'}">${item.category}</span>` : '';
                
                const div = document.createElement('div');
                div.className = "item-card";
                div.setAttribute('data-id', idx);
                div.innerHTML = `
                    <div class="item-top">
                        <div class="checkbox ${item.checked ? 'checked' : ''}" onclick="toggleItem(${idx})"></div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-actions">
                            <button class="item-btn edit-btn" onclick="editItem(${idx})">✏️</button>
                            <button class="item-btn delete-btn" onclick="deleteItem(${idx})">🗑️</button>
                        </div>
                    </div>
                    <div class="item-bottom">
                        <div class="item-price">
                            ${categoryBadge}
                            <span style="margin-right: 8px;">₪${item.price.toFixed(2)} × ${item.qty}</span>
                        </div>
                        <div class="item-subtotal">₪${sub.toFixed(2)}</div>
                    </div>
                `;
                container.appendChild(div);
            });
            
            if (list.items.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🛒</div>
                        <p>הרשימה ריקה</p>
                        <p style="font-size: 14px; margin-top: 10px;">לחץ על "➕ מוצר" להתחיל</p>
                    </div>
                `;
            }
            
            // Initialize Sortable
            if (sortableInstance) {
                sortableInstance.destroy();
            }
            
            if (!isLocked && list.items.length > 0) {
                sortableInstance = new Sortable(container, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    onEnd: function(evt) {
                        const item = list.items.splice(evt.oldIndex, 1)[0];
                        list.items.splice(evt.newIndex, 0, item);
                        save();
                    }
                });
            }
        }
        
        // Budget warning with overage amount
        const warning = document.getElementById('budgetWarning');
        if (warning && list.budget > 0 && total > list.budget) {
            const overage = (total - list.budget).toFixed(2);
            warning.innerHTML = `⚠️ חריגה מתקציב! חרגת ב-₪${overage}`;
            warning.classList.remove('hidden');
        } else if (warning) {
            warning.classList.add('hidden');
        }
        
    } else if (activePage === 'summary') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        document.getElementById('pageStats').classList.add('hidden');
        
        let summaryTotal = 0, summaryPaid = 0;
        
        if (container) {
            container.innerHTML = '';
            Object.entries(db.lists).forEach(([id, list]) => {
                let listTotal = 0, listPaid = 0;
                list.items.forEach(item => {
                    const sub = item.price * item.qty;
                    listTotal += sub;
                    if (item.checked) listPaid += sub;
                });
                
                if (db.selectedInSummary.includes(id)) {
                    summaryTotal += listTotal;
                    summaryPaid += listPaid;
                }
                
                const div = document.createElement('div');
                div.className = 'list-checkbox';
                div.innerHTML = `
                    <input type="checkbox" value="${id}" ${db.selectedInSummary.includes(id) ? 'checked' : ''} onchange="toggleSum('${id}')">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${list.name}</div>
                        <div style="font-size: 13px; color: #6b7280;">
                            סה"כ: ₪${listTotal.toFixed(2)} | שולם: ₪${listPaid.toFixed(2)}
                        </div>
                    </div>
                    <button class="icon-btn" onclick="switchToList('${id}')" style="width: 36px; height: 36px; font-size: 16px;">👁️</button>
                `;
                container.appendChild(div);
            });
        }
        
        document.getElementById('summaryTotal').innerText = `₪${summaryTotal.toFixed(2)}`;
        document.getElementById('summaryPaid').innerText = `₪${summaryPaid.toFixed(2)}`;
        document.getElementById('summaryRemaining').innerText = `₪${(summaryTotal - summaryPaid).toFixed(2)}`;
        
        // Update select all checkbox
        const selectAll = document.getElementById('selectAllLists');
        if (selectAll) {
            selectAll.checked = db.selectedInSummary.length === Object.keys(db.lists).length;
        }
        
    } else if (activePage === 'stats') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.remove('hidden');
        
        renderStats();
    }
}

// ========== Item Management ==========
function addOrUpdateItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const category = document.getElementById('itemCategory').value;
    
    if (!name) {
        showNotification('נא להזין שם מוצר', 'error');
        return;
    }
    
    const list = db.lists[db.currentId];
    
    if (currentEditIdx !== null) {
        list.items[currentEditIdx].name = name;
        list.items[currentEditIdx].price = price;
        list.items[currentEditIdx].category = category;
        currentEditIdx = null;
        showNotification('המוצר עודכן בהצלחה!');
    } else {
        list.items.push({
            name,
            price,
            qty: 1,
            category,
            checked: false
        });
        showNotification('המוצר נוסף בהצלחה!');
    }
    
    save();
    closeModal('inputForm');
}

function editItem(idx) {
    const item = db.lists[db.currentId].items[idx];
    currentEditIdx = idx;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = item.category || '';
    openModal('inputForm');
}

function deleteItem(idx) {
    if (confirm('האם למחוק מוצר זה?')) {
        db.lists[db.currentId].items.splice(idx, 1);
        save();
        showNotification('המוצר נמחק');
    }
}

function importList() {
    const text = document.getElementById('importText').value.trim();
    if (!text) {
        showNotification('נא להזין טקסט', 'error');
        return;
    }
    
    const lines = text.split('
').filter(l => l.trim());
    const list = db.lists[db.currentId];
    
    lines.forEach(line => {
        const match = line.match(/^(.+?)s*[-–—:]s*(d+(?:.d+)?)/);
        if (match) {
            list.items.push({
                name: match[1].trim(),
                price: parseFloat(match[2]),
                qty: 1,
                category: '',
                checked: false
            });
        } else {
            list.items.push({
                name: line.trim(),
                price: 0,
                qty: 1,
                category: '',
                checked: false
            });
        }
    });
    
    save();
    closeModal('importModal');
    showNotification(`${lines.length} מוצרים יובאו בהצלחה!`);
}

// ========== List Management ==========
function createNewList() {
    const name = document.getElementById('newListNameInput').value.trim();
    const url = document.getElementById('newListUrlInput').value.trim();
    const budget = parseFloat(document.getElementById('newListBudget').value) || 0;
    const isTemplate = document.getElementById('newListTemplate').checked;
    
    if (!name) {
        showNotification('נא להזין שם רשימה', 'error');
        return;
    }
    
    const newId = 'L' + Date.now();
    db.lists[newId] = {
        name,
        url,
        budget,
        isTemplate,
        items: []
    };
    
    if (isTemplate) {
        db.templates.push(newId);
    }
    
    db.currentId = newId;
    save();
    closeModal('newListModal');
    showPage('lists');
    showNotification('רשימה חדשה נוצרה!');
}

function switchToList(id) {
    db.currentId = id;
    showPage('lists');
    save();
}

function saveListName() {
    const name = document.getElementById('editListNameInput').value.trim();
    const url = document.getElementById('editListUrlInput').value.trim();
    const budget = parseFloat(document.getElementById('editListBudget').value) || 0;
    
    if (!name) {
        showNotification('נא להזין שם רשימה', 'error');
        return;
    }
    
    db.lists[db.currentId].name = name;
    db.lists[db.currentId].url = url;
    db.lists[db.currentId].budget = budget;
    
    save();
    closeModal('editListNameModal');
    showNotification('הרשימה עודכנה!');
}

function confirmDeleteList() {
    if (listToDelete) {
        delete db.lists[listToDelete];
        if (db.currentId === listToDelete) {
            db.currentId = Object.keys(db.lists)[0] || 'L1';
        }
        listToDelete = null;
        save();
        closeModal('deleteListModal');
        showNotification('הרשימה נמחקה');
    }
}

function completeList() {
    const list = db.lists[db.currentId];
    let total = 0;
    
    list.items.forEach(item => {
        total += item.price * item.qty;
    });
    
    // Save to history with full item details
    db.history.push({
        listName: list.name,
        items: JSON.parse(JSON.stringify(list.items)), // Deep copy
        total: total,
        completedAt: Date.now()
    });
    
    // Update stats
    db.stats.totalSpent += total;
    db.stats.listsCompleted += 1;
    
    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    if (!db.stats.monthlyData[monthKey]) {
        db.stats.monthlyData[monthKey] = 0;
    }
    db.stats.monthlyData[monthKey] += total;
    
    // Clear list
    list.items = [];
    
    save();
    closeModal('completeModal');
    showNotification('הרשימה הושלמה ונשמרה להיסטוריה! 🎉');
}

function toggleLock() {
    isLocked = !isLocked;
    render();
}
// ========== History & Templates ==========
function renderHistory() {
    const container = document.getElementById('historyContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (db.history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <p>אין רשימות בהיסטוריה</p>
            </div>
        `;
        return;
    }
    
    db.history.slice().reverse().forEach((entry, idx) => {
        const realIdx = db.history.length - 1 - idx;
        const div = document.createElement('div');
        div.className = 'mb-3 p-3 bg-gray-50 rounded-xl';
        
        const date = new Date(entry.completedAt);
        const dateStr = date.toLocaleDateString('he-IL');
        const timeStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        
        // Create items summary
        const itemsSummary = entry.items.map(item => {
            const sub = item.price * item.qty;
            return `<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <span>${item.name} ${item.qty > 1 ? `(×${item.qty})` : ''}</span>
                <span style="font-weight: 600;">₪${sub.toFixed(2)}</span>
            </div>`;
        }).join('');
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <div style="font-weight: 600; font-size: 16px;">${entry.listName}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                        ${dateStr} | ${timeStr}
                    </div>
                    <div style="font-size: 13px; color: #667eea; margin-top: 4px;">
                        ${entry.items.length} מוצרים
                    </div>
                </div>
                <div style="text-align: left;">
                    <div style="font-size: 20px; font-weight: bold; color: #22c55e;">₪${entry.total.toFixed(2)}</div>
                </div>
            </div>
            <div style="max-height: 200px; overflow-y: auto; background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                ${itemsSummary}
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary" onclick="restoreFromHistory(${realIdx})" style="flex: 1;">
                    שחזר רשימה
                </button>
                <button class="btn btn-danger" onclick="deleteHistory(${realIdx})" style="flex: 0 0 auto; padding: 14px 20px;">
                    🗑️
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function restoreFromHistory(idx) {
    const entry = db.history[idx];
    const newId = 'L' + Date.now();
    
    db.lists[newId] = {
        name: entry.listName + ' (משוחזר)',
        url: '',
        budget: 0,
        isTemplate: false,
        items: JSON.parse(JSON.stringify(entry.items)) // Deep copy
    };
    
    db.currentId = newId;
    save();
    closeModal('historyModal');
    showPage('lists');
    showNotification('הרשימה שוחזרה בהצלחה!');
}

function deleteHistory(idx) {
    if (confirm('האם למחוק רשימה זו מההיסטוריה?')) {
        db.history.splice(idx, 1);
        save();
        renderHistory();
        showNotification('הרשימה נמחקה מההיסטוריה');
    }
}

function showCompletedLists() {
    const modal = document.getElementById('completedListsModal');
    const content = document.getElementById('completedListsContent');
    
    if (!modal || !content) return;
    
    if (db.history.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>אין רשימות שהושלמו</p>
            </div>
        `;
    } else {
        content.innerHTML = db.history.slice().reverse().map((entry, idx) => {
            const date = new Date(entry.completedAt);
            const dateStr = date.toLocaleDateString('he-IL');
            return `
                <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">${entry.listName}</div>
                            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${dateStr}</div>
                        </div>
                        <div style="font-size: 18px; font-weight: bold; color: #22c55e;">₪${entry.total.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.add('active');
}

function renderTemplates() {
    const container = document.getElementById('templatesContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    const templates = Object.entries(db.lists).filter(([id, list]) => list.isTemplate);
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <p>אין תבניות שמורות</p>
            </div>
        `;
        return;
    }
    
    templates.forEach(([id, template]) => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200';
        
        let total = 0;
        template.items.forEach(item => {
            total += item.price * item.qty;
        });
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <div style="font-weight: 600; font-size: 16px;">⭐ ${template.name}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                        ${template.items.length} מוצרים | סה"כ: ₪${total.toFixed(2)}
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary" onclick="useTemplate('${id}')" style="flex: 1;">
                    שימוש בתבנית
                </button>
                <button class="btn btn-danger" onclick="deleteTemplate('${id}')" style="flex: 0 0 auto; padding: 14px 20px;">
                    🗑️
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function useTemplate(templateId) {
    const template = db.lists[templateId];
    const newId = 'L' + Date.now();
    
    db.lists[newId] = {
        name: template.name,
        url: template.url || '',
        budget: template.budget || 0,
        isTemplate: false,
        items: JSON.parse(JSON.stringify(template.items))
    };
    
    db.currentId = newId;
    save();
    closeModal('templatesModal');
    showPage('lists');
    showNotification('תבנית נוצרה כרשימה חדשה!');
}

function deleteTemplate(id) {
    if (confirm('האם למחוק תבנית זו?')) {
        db.lists[id].isTemplate = false;
        const idx = db.templates.indexOf(id);
        if (idx > -1) db.templates.splice(idx, 1);
        save();
        renderTemplates();
        showNotification('התבנית נמחקה');
    }
}

// ========== Statistics ==========
function renderStats() {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    
    const monthSpent = db.stats.monthlyData[currentMonth] || 0;
    const listsCompleted = db.stats.listsCompleted;
    const avgList = listsCompleted > 0 ? db.stats.totalSpent / listsCompleted : 0;
    
    document.getElementById('statMonthSpent').innerText = `₪${monthSpent.toFixed(2)}`;
    document.getElementById('statListsCompleted').innerText = listsCompleted;
    document.getElementById('statAvgList').innerText = `₪${avgList.toFixed(0)}`;
    
    // Monthly chart
    const months = Object.keys(db.stats.monthlyData).sort().slice(-6);
    const values = months.map(m => db.stats.monthlyData[m] || 0);
    
    const chartCanvas = document.getElementById('monthlyChart');
    if (chartCanvas) {
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        if (months.length > 0) {
            monthlyChart = new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: months.map(m => {
                        const [year, month] = m.split('-');
                        return `${month}/${year}`;
                    }),
                    datasets: [{
                        label: 'הוצאות חודשיות (₪)',
                        data: values,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₪' + value;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            chartCanvas.parentElement.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 40px;">אין מספיק נתונים</p>';
        }
    }
    
    // Popular items
    const itemCount = {};
    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            itemCount[item.name] = (itemCount[item.name] || 0) + 1;
        });
    });
    
    db.history.forEach(entry => {
        entry.items.forEach(item => {
            itemCount[item.name] = (itemCount[item.name] || 0) + 1;
        });
    });
    
    const popularItems = Object.entries(itemCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const popularContainer = document.getElementById('popularItemsList');
    if (popularContainer) {
        if (popularItems.length > 0) {
            popularContainer.innerHTML = popularItems.map(([name, count]) => `
                <div class="popular-item">
                    <span style="font-weight: 600;">${name}</span>
                    <span style="color: #667eea; font-weight: 600;">${count} פעמים</span>
                </div>
            `).join('');
        } else {
            popularContainer.innerHTML = '<p style="text-align: center; color: #9ca3af;">אין נתונים</p>';
        }
    }
}

// ========== Export/Import Data ==========
function exportData() {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vplus-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('הגיבוי הורד בהצלחה!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm('האם לשחזר את הנתונים? פעולה זו תדרוס את הנתונים הקיימים!')) {
                db = imported;
                localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
                location.reload();
            }
        } catch (err) {
            showNotification('שגיאה בקריאת הקובץ', 'error');
        }
    };
    reader.readAsText(file);
}

function printList() {
    const list = db.lists[db.currentId];
    let total = 0;
    
    const printContent = `
        <html dir="rtl">
        <head>
            <title>${list.name}</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                h1 { color: #667eea; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                th { background: #667eea; color: white; }
                .total { font-size: 20px; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>${list.name}</h1>
            <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
            <table>
                <tr>
                    <th>מוצר</th>
                    <th>קטגוריה</th>
                    <th>כמות</th>
                    <th>מחיר יחידה</th>
                    <th>סה"כ</th>
                </tr>
                ${list.items.map(i => {
                    const s = i.price * i.qty;
                    total += s;
                    return `<tr>
                        <td>${i.name}</td>
                        <td>${i.category || '-'}</td>
                        <td>${i.qty}</td>
                        <td>₪${i.price.toFixed(2)}</td>
                        <td>₪${s.toFixed(2)}</td>
                    </tr>`;
                }).join('')}
            </table>
            <div class="total">סה"כ: ₪${total.toFixed(2)}</div>
        </body>
        </html>
    `;
    
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.print();
}
// ========== Google Drive Sync ==========
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('GAPI initialized');
    } catch (err) {
        console.error('GAPI init error:', err);
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
                accessToken = tokenResponse.access_token;
                isConnected = true;
                document.getElementById('syncBtn').textContent = '☁️ מחובר';
                showNotification('התחברת בהצלחה!');
                syncToCloud();
            }
        },
    });
    gisInited = true;
    console.log('GIS initialized');
}

async function syncToCloud() {
    if (!gapiInited || !gisInited) {
        showNotification('מערכת הענן לא מוכנה', 'warning');
        return;
    }

    if (!accessToken) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
    }

    if (isSyncing) return;

    isSyncing = true;
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.textContent = '⏳ מסנכרן...';
        syncBtn.classList.add('syncing');
    }

    try {
        // Find or create folder
        let folderId = await findFolder();
        if (!folderId) {
            folderId = await createFolder();
        }

        // Find or create file
        if (!driveFileId) {
            driveFileId = await findFile(folderId);
        }

        const dataStr = JSON.stringify(db);

        if (driveFileId) {
            // Update existing file
            await gapi.client.request({
                path: `/upload/drive/v3/files/${driveFileId}`,
                method: 'PATCH',
                params: { uploadType: 'media' },
                body: dataStr,
            });
        } else {
            // Create new file
            const metadata = {
                name: FILE_NAME,
                mimeType: 'application/json',
                parents: [folderId],
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([dataStr], { type: 'application/json' }));

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
                body: form,
            });

            const result = await response.json();
            driveFileId = result.id;
        }

        showNotification('סונכרן בהצלחה! ☁️');
        isConnected = true;
        
        if (syncBtn) {
            syncBtn.textContent = '✓ מסונכרן';
        }
    } catch (err) {
        console.error('Sync error:', err);
        showNotification('שגיאה בסנכרון', 'error');
        isConnected = false;
    } finally {
        isSyncing = false;
        setTimeout(() => {
            if (syncBtn) {
                syncBtn.textContent = '☁️ סנכרון ענן';
                syncBtn.classList.remove('syncing');
            }
        }, 2000);
    }
}

async function findFolder() {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)',
        });
        return response.result.files.length > 0 ? response.result.files[0].id : null;
    } catch (err) {
        console.error('Find folder error:', err);
        return null;
    }
}

async function createFolder() {
    try {
        const response = await gapi.client.drive.files.create({
            resource: {
                name: FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });
        return response.result.id;
    } catch (err) {
        console.error('Create folder error:', err);
        return null;
    }
}

async function findFile(folderId) {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)',
        });
        return response.result.files.length > 0 ? response.result.files[0].id : null;
    } catch (err) {
        console.error('Find file error:', err);
        return null;
    }
}

// Load Google APIs
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;
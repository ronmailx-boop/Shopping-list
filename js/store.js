// ============================================================
//  store.js  —  ניהול מצב (State), שמירה וטעינה
//  מייבא מ: constants.js
//  מיובא על-ידי: services.js, importers.js, ui.js, app.js
// ============================================================

// ============================================================
//  שפה
// ============================================================
let currentLang = localStorage.getItem('appLanguage') || 'he';

function t(key) {
    return translations[currentLang]?.[key] || translations['he'][key] || key;
}

// ============================================================
//  מסד הנתונים הראשי (State)
// ============================================================
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: {
        'L1': { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] }
    },
    history: [],
    templates: [],
    lastActivePage: 'lists',
    lastSync: 0,
    stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} },
    customCategories: [],
    categoryMemory: {}
};

// Backwards compatibility
if (!db.customCategories) db.customCategories = [];
if (!db.categoryMemory)   db.categoryMemory = {};

// ============================================================
//  משתני מצב גלובליים
// ============================================================
let isLocked             = true;
let activePage           = db.lastActivePage || 'lists';
let currentEditIdx       = null;
let listToDelete         = null;
let sortableInstance     = null;
let monthlyChart         = null;
let categoryDoughnutChart = null;
let highlightedItemIndex = null;
let highlightedListId    = null;
let categorySortEnabled  = localStorage.getItem('categorySortEnabled') === 'true' || false;

// undo-check state
let lastCheckedItem  = null;
let lastCheckedIdx   = null;
let lastCheckedState = null;

// undo-delete state
let deletedItem      = null;
let deletedItemIndex = null;
let deleteTimeout    = null;
let undoNotification = null;

// undo-check notification ref
let undoCheckNotification = null;
let undoCheckTimeout      = null;

// clipboard import
let pendingImportText = null;
let detectedListType  = null;

// sync state
let unsubscribeSnapshot = null;
let isSyncing           = false;
let isConnected         = false;
let currentUser         = null;
let syncTimeout         = null;

// note / edit helpers
let currentNoteItemIndex = null;
let currentEditItemIndex = null;
let currentEditField     = null;

// demo
let isDemoMode = false;

// ============================================================
//  Setters — פונקציות לעדכון משתנים מיוצאים
//  (ES6 modules: imports הם read-only; משתמשים ב-setters)
// ============================================================
function setDb(newDb)                       { db = newDb; }
function setActivePage(p)                   { activePage = p; }
function setCurrentLang(l)                  { currentLang = l; }
function setIsLocked(v)                     { isLocked = v; }
function setCurrentEditIdx(v)               { currentEditIdx = v; }
function setListToDelete(v)                 { listToDelete = v; }
function setSortableInstance(v)             { sortableInstance = v; }
function setMonthlyChart(v)                 { monthlyChart = v; }
function setCategoryDoughnutChart(v)        { categoryDoughnutChart = v; }
function setHighlightedItemIndex(v)         { highlightedItemIndex = v; }
function setHighlightedListId(v)            { highlightedListId = v; }
function setCategorySortEnabled(v)          { categorySortEnabled = v; }
function setLastCheckedItem(v)              { lastCheckedItem = v; }
function setLastCheckedIdx(v)               { lastCheckedIdx = v; }
function setLastCheckedState(v)             { lastCheckedState = v; }
function setDeletedItem(v)                  { deletedItem = v; }
function setDeletedItemIndex(v)             { deletedItemIndex = v; }
function setDeleteTimeout(v)                { deleteTimeout = v; }
function setUndoNotification(v)             { undoNotification = v; }
function setUndoCheckNotification(v)        { undoCheckNotification = v; }
function setUndoCheckTimeout(v)             { undoCheckTimeout = v; }
function setPendingImportText(v)            { pendingImportText = v; }
function setDetectedListType(v)             { detectedListType = v; }
function setUnsubscribeSnapshot(v)          { unsubscribeSnapshot = v; }
function setIsSyncing(v)                    { isSyncing = v; }
function setIsConnected(v)                  { isConnected = v; }
function setCurrentUser(v)                  { currentUser = v; }
function setSyncTimeout(v)                  { syncTimeout = v; }
function setCurrentNoteItemIndex(v)         { currentNoteItemIndex = v; }
function setCurrentEditItemIndex(v)         { currentEditItemIndex = v; }
function setCurrentEditField(v)             { currentEditField = v; }
function setIsDemoMode(v)                   { isDemoMode = v; }

// ============================================================
//  save()  —  שמירה ל-localStorage + render + sync
// ============================================================
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));

    if (typeof window.render === 'function') window.render();

    if (typeof window.updateNotificationBadge === 'function') {
        window.updateNotificationBadge();
    }

    if (isConnected && currentUser) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            if (typeof window.syncToCloud === 'function') window.syncToCloud();
        }, 1500);
    }
}

// ============================================================
//  exportData / importData
// ============================================================
function exportData() {
    const dataStr  = JSON.stringify(db, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url  = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `vplus_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    if (typeof window.showNotification === 'function') window.showNotification('💾 הנתונים יוצאו בהצלחה!');
    if (typeof window.closeModal === 'function') window.closeModal('settingsModal');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm('האם לשחזר את כל הנתונים? פעולה זו תדרוס את הנתונים הנוכחיים!')) {
                db = importedData;
                save();
                if (typeof window.showNotification === 'function') window.showNotification('✅ הנתונים שוחזרו בהצלחה!');
                if (typeof window.closeModal === 'function') window.closeModal('settingsModal');
            }
        } catch (err) {
            alert('שגיאה בקריאת הקובץ.');
        }
    };
    reader.readAsText(file);
}

// ============================================================
//  קטגוריות — זיהוי ולמידה
// ============================================================
function detectCategory(productName) {
    if (!productName) return 'אחר';
    const nameLower = productName.toLowerCase().trim();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword.toLowerCase())) return category;
        }
    }
    return 'אחר';
}

function getLearnedCategory(productName) {
    if (!productName || !db.categoryMemory) return null;
    return db.categoryMemory[productName.toLowerCase().trim()] || null;
}

// ============================================================
//  sortItemsByStatusAndCategory
// ============================================================
function sortItemsByStatusAndCategory(items) {
    const categoryOrder = [
        'פירות וירקות', 'בשר ודגים', 'חלב וביצים', 'לחם ומאפים',
        'שימורים', 'חטיפים', 'משקאות', 'ניקיון', 'היגיינה', 'אחר'
    ];
    return items.slice().sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        const idxA = categoryOrder.indexOf(a.category || 'אחר');
        const idxB = categoryOrder.indexOf(b.category || 'אחר');
        const ordA = idxA === -1 ? categoryOrder.length : idxA;
        const ordB = idxB === -1 ? categoryOrder.length : idxB;
        return ordA - ordB;
    });
}

// ============================================================
//  toggleItem / undoCheck / toggleSum / toggleSelectAll
// ============================================================
function toggleItem(idx) {
    const item = db.lists[db.currentId].items[idx];
    const previousState = item.checked;
    item.checked = !item.checked;

    lastCheckedItem  = item;
    lastCheckedIdx   = idx;
    lastCheckedState = previousState;

    db.lists[db.currentId].items = sortItemsByStatusAndCategory(db.lists[db.currentId].items);
    save();

    if (typeof window._showToast === 'function') {
        window._showToast({
            message: `${item.checked ? '✅' : '◻️'} "${item.name}" ${item.checked ? 'סומן' : 'הסימון הוסר'}`,
            type: 'success',
            undoCallback: undoCheck,
            duration: 5000
        });
    }
}

function undoCheck() {
    if (lastCheckedItem === null) return;
    const items = db.lists[db.currentId].items;
    const item  = items.find(i => i === lastCheckedItem);
    if (item) {
        item.checked = lastCheckedState;
        db.lists[db.currentId].items = sortItemsByStatusAndCategory(items);
        save();
        if (typeof window.render === 'function') window.render();
    }
    lastCheckedItem  = null;
    lastCheckedIdx   = null;
    lastCheckedState = null;
    if (typeof window.showNotification === 'function') window.showNotification('✅ הסימון בוטל');
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

// ============================================================
//  Dark Mode / showPage / toggleCategorySorting
// ============================================================
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
    if (p === 'lists' || p === 'summary') {
        if (typeof window.openSmartBar === 'function') window.openSmartBar();
        if (typeof window.updateExpandedTabs === 'function') window.updateExpandedTabs(p);
    }
    save();
}

function toggleCategorySorting() {
    categorySortEnabled = !categorySortEnabled;
    localStorage.setItem('categorySortEnabled', categorySortEnabled ? 'true' : 'false');

    const pill = document.getElementById('categorySortPill');
    if (pill) {
        pill.style.background   = categorySortEnabled ? '#7367f0' : '';
        pill.style.color        = categorySortEnabled ? 'white'   : '';
        pill.style.borderColor  = categorySortEnabled ? '#7367f0' : '';
    }
    const btn = document.getElementById('categorySortText');
    if (btn) btn.textContent = '🔤 מיון';

    if (categorySortEnabled) {
        db.lists[db.currentId].items = sortItemsByStatusAndCategory(db.lists[db.currentId].items);
    }
    save();
    if (typeof window.showNotification === 'function') {
        window.showNotification(categorySortEnabled ? '✅ מיון לפי קטגוריות מופעל' : '✅ מיון ידני מופעל');
    }
    if (typeof window.render === 'function') window.render();
}

// ============================================================
//  שפה — החלפה ועדכון UI
// ============================================================
function confirmLanguageChange() {
    const selector = document.getElementById('languageSelector');
    const newLang  = selector.value;
    if (newLang === currentLang) {
        if (typeof window.showNotification === 'function')
            window.showNotification('✓ ' + t('language') + ' ' + selector.options[selector.selectedIndex].text);
        return;
    }
    changeLanguage(newLang);
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLanguage', lang);

    const html = document.documentElement;
    if (lang === 'he') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'he');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', lang);
    }

    updateUILanguage();

    // Reset voice recognition
    if (typeof window.recognition !== 'undefined') window.recognition = null;

    if (typeof window.render === 'function') window.render();

    const selector = document.getElementById('languageSelector');
    if (selector && typeof window.showNotification === 'function') {
        window.showNotification('✓ ' + t('language') + ' ' + selector.options[selector.selectedIndex].text);
    }
}

function updateUILanguage() {
    const ids = {
        settingsModalTitle:        t('settingsTitle'),
        languageLabel:             t('language'),
        totalListLabel:            t('totalList'),
        paidInListLabel:           t('paidInList'),
        remainingToPayLabel:       t('remainingToPay'),
        completedListsCountLabel:  t('completedListsCount'),
        avgPerListLabel:           t('avgPerList'),
        popularItemsTitle:         t('popularItems'),
        categoryExpensesTitle:     t('categoryExpenses'),
        historyStatsTitle:         t('history'),
        viewCompletedListsBtn:     t('viewCompletedLists'),
        selectAllLabel:            t('selectAll'),
    };
    for (const [id, text] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    const confirmLangBtn = document.getElementById('confirmLangBtn');
    if (confirmLangBtn) {
        const labels = { he: 'אשר שינוי שפה', en: 'Confirm Language Change', ru: 'Подтвердить Изменение Языка', ro: 'Confirmă Schimbarea Limbii' };
        confirmLangBtn.innerHTML = '✓ ' + (labels[currentLang] || labels.he);
    }

    const darkModeText = document.getElementById('darkModeText');
    if (darkModeText) {
        darkModeText.textContent = document.body.classList.contains('dark-mode') ? t('lightMode') : t('darkMode');
    }

    const categorySortText = document.getElementById('categorySortText');
    if (categorySortText) {
        categorySortText.textContent = categorySortEnabled ? t('categorySortBtn') : t('manualSortBtn');
    }

    const langSelector = document.getElementById('languageSelector');
    if (langSelector) langSelector.value = currentLang;

    const tabStatsEl = document.getElementById('tabStats');
    if (tabStatsEl) tabStatsEl.textContent = t('statistics');

    const tabBankEl2 = document.getElementById('tabBank');
    if (tabBankEl2) tabBankEl2.textContent = '🏦 פיננסי';

    const listSearchInput = document.getElementById('listSearchInput');
    if (listSearchInput) listSearchInput.placeholder = t('searchPlaceholder');

    updateModalTexts();
    updateCategoryOptions();
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('itemCategory');
    if (!categorySelect) return;
    const currentValue = categorySelect.value;
    const categories   = categoryTranslations[currentLang] || categoryTranslations['he'];
    const options = categorySelect.options;
    if (options[0]) options[0].textContent = t('selectCategory');
    let optionIndex = 1;
    for (const hebrewKey in categories) {
        if (options[optionIndex]) {
            options[optionIndex].textContent = categories[hebrewKey];
            optionIndex++;
        }
    }
    categorySelect.value = currentValue;
}

function updateModalTexts() {
    // Statistics
    const el = (id) => document.getElementById(id);
    if (el('monthlyStatsTitle'))   el('monthlyStatsTitle').textContent   = t('monthlyStats');
    if (el('monthlyExpensesLabel')) el('monthlyExpensesLabel').textContent = t('monthlyExpenses');

    const qs = (sel) => document.querySelector(sel);

    // Add Item Modal
    if (qs('#addItemModal h2'))          qs('#addItemModal h2').textContent          = t('addItemTitle');
    if (el('itemName'))                  el('itemName').placeholder                  = t('productName');
    if (el('itemPrice'))                 el('itemPrice').placeholder                 = t('price');
    const catSel = el('itemCategory');
    if (catSel?.options.length > 0)      catSel.options[0].textContent               = t('selectCategory');

    // Import Modal
    if (qs('#importModal h2'))           qs('#importModal h2').textContent           = t('importTitle');
    if (el('importText'))                el('importText').placeholder                = t('importPlaceholder');

    // New List Modal
    if (qs('#newListModal h2'))          qs('#newListModal h2').textContent          = t('newListTitle');
    if (el('newListName'))               el('newListName').placeholder               = t('listName');
    if (el('newListUrl'))                el('newListUrl').placeholder                = t('websiteUrl');
    if (el('newListBudget'))             el('newListBudget').placeholder             = t('budget');

    // Receipt Scan Modal
    if (el('scanReceiptModalTitle'))     el('scanReceiptModalTitle').textContent     = t('scanReceiptTitle');
    if (el('scanReceiptDesc'))           el('scanReceiptDesc').textContent           = t('scanReceiptDesc');
    if (qs('#receiptScanModal h2'))      qs('#receiptScanModal h2').textContent      = t('scanReceiptTitle');
    if (el('scanBtn'))                   el('scanBtn').textContent                   = t('scan');

    // Confirm / Delete / Edit modals
    if (qs('#confirmModal h2'))          qs('#confirmModal h2').textContent          = t('completeListTitle');
    if (qs('#confirmModal p'))           qs('#confirmModal p').textContent           = t('completeListMsg');
    if (qs('#deleteListModal h2'))       qs('#deleteListModal h2').textContent       = t('deleteListTitle');
    if (qs('#editListNameModal h2'))     qs('#editListNameModal h2').textContent     = t('editListTitle');
    if (el('editListNameInput'))         el('editListNameInput').placeholder         = t('listName');
    if (el('editListUrlInput'))          el('editListUrlInput').placeholder          = t('websiteUrl');
    if (el('editListBudget'))            el('editListBudget').placeholder            = t('budget');
    if (qs('#editTotalModal h2'))        qs('#editTotalModal h2').textContent        = t('updatePriceTitle');

    // History / Templates / Completed
    if (qs('#historyModal h2'))          qs('#historyModal h2').textContent          = t('historyTitle');
    if (qs('#templatesModal h2'))        qs('#templatesModal h2').textContent        = t('templatesTitle');
    if (qs('#completedListsModal h2'))   qs('#completedListsModal h2').textContent   = t('completedListsTitle');

    // Translate Modal
    if (qs('#translateModal h2'))        qs('#translateModal h2').textContent        = t('translateListTitle');
    if (qs('#translateModal p'))         qs('#translateModal p').textContent         = t('translateDesc');

    // Common button texts
    const btnMap = {
        [t('add')]:     ['הוסף','Add','Добавить','Adaugă'],
        [t('cancel')]:  ['ביטול','Cancel','Отмена','Anulează'],
        [t('save')]:    ['שמור','Save','Сохранить','Salvează'],
        [t('create')]:  ['צור','Create','Создать','Creează'],
        [t('delete')]:  ['מחק','Delete','Удалить','Șterge'],
        [t('complete')]:['השלם','Complete','Завершить','Finalizează'],
        [t('update')]:  ['עדכן','Update','Обновить','Actualizează'],
        [t('close')]:   ['סגור','Close','Закрыть','Închide'],
        [t('importBtn')]:['ייבא','Import','Импортировать','Importă'],
    };
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim();
        for (const [newText, variants] of Object.entries(btnMap)) {
            if (variants.includes(text)) { btn.textContent = newText; break; }
        }
    });
}

// ============================================================
//  Demo Mode
// ============================================================
function loadDemoMode() {
    isDemoMode = true;
    localStorage.setItem('vplus_demo_mode', 'true');
    db = JSON.parse(JSON.stringify(DEMO_DATA));
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    const existing = JSON.parse(localStorage.getItem('vplus_notifications') || '[]');
    localStorage.setItem('vplus_notifications', JSON.stringify([
        ...DEMO_NOTIFICATIONS,
        ...existing.filter(n => !n.isDemo)
    ]));
    showDemoBanner();
    if (typeof window.render === 'function') window.render();
}

function exitDemoMode() {
    Object.keys(db.lists).forEach(id => { if (db.lists[id].isDemo) delete db.lists[id]; });
    if (Object.keys(db.lists).length === 0) {
        db.lists['L1'] = { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] };
        db.currentId = 'L1';
    } else {
        db.currentId = Object.keys(db.lists)[0];
    }
    const notifs = JSON.parse(localStorage.getItem('vplus_notifications') || '[]');
    localStorage.setItem('vplus_notifications', JSON.stringify(notifs.filter(n => !n.isDemo)));
    isDemoMode = false;
    localStorage.removeItem('vplus_demo_mode');
    const banner = document.getElementById('demoBanner');
    if (banner) {
        banner.remove();
        const appHeader = document.querySelector('.top-bar, header, #topBar, [class*="top-bar"]');
        if (appHeader) appHeader.style.marginTop = '';
    }
    save();
}

function showDemoBanner() {
    if (document.getElementById('demoBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'demoBanner';
    const div = document.createElement('div');
    div.id = 'demoBannerInner';
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9000;background:linear-gradient(135deg,#f59e0b,#f97316);padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px rgba(245,158,11,0.4);font-family:system-ui,sans-serif;';
    div.innerHTML = '<span style="font-size:20px;">🎯</span><div style="flex:1;"><div style="font-size:12px;font-weight:900;color:white;">מצב דמו פעיל</div><div style="font-size:10px;color:rgba(255,255,255,0.8);">אלו נתוני דוגמה — חקור בחופשיות!</div></div><button onclick="exitDemoMode()" style="background:rgba(255,255,255,0.25);border:1.5px solid rgba(255,255,255,0.4);color:white;font-size:10px;font-weight:800;padding:5px 14px;border-radius:99px;cursor:pointer;font-family:system-ui,sans-serif;">יציאה מדמו</button>';
    banner.appendChild(div);
    document.body.insertBefore(banner, document.body.firstChild);
    const appHeader = document.querySelector('.top-bar, header, #topBar, [class*="top-bar"]');
    if (appHeader) appHeader.style.marginTop = '48px';
}

function checkFirstRunDemo() {
    if (localStorage.getItem('vplus_demo_mode') === 'true') {
        isDemoMode = true;
        showDemoBanner();
        return;
    }
    const alreadySeen = localStorage.getItem('vplus_demo_seen');
    const saved = localStorage.getItem('BUDGET_FINAL_V28');
    let hasRealData = false;
    if (saved) {
        const d = JSON.parse(saved);
        hasRealData = Object.values(d.lists || {}).some(l => l.items?.length > 0 && !l.isDemo);
    }
    if (!alreadySeen && !hasRealData) {
        setTimeout(showDemoPrompt, 1200);
    }
}

function showDemoPrompt() {
    const overlay = document.createElement('div');
    overlay.id = 'demoPromptOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.6);display:flex;align-items:flex-end;font-family:system-ui,sans-serif;';
    const sheet = document.createElement('div');
    sheet.style.cssText = 'background:white;border-radius:28px 28px 0 0;width:100%;padding:28px 20px 40px;animation:demoSheetIn 0.4s cubic-bezier(0.34,1.56,0.64,1);';
    sheet.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:6px;">
            <button onclick="document.getElementById('demoPromptOverlay').remove();localStorage.setItem('vplus_demo_seen','true');"
                style="background:rgba(0,0,0,0.06);border:none;border-radius:50%;width:32px;height:32px;font-size:20px;cursor:pointer;color:#888;">×</button>
        </div>
        <div style="width:40px;height:4px;background:#e5e7eb;border-radius:99px;margin:0 auto 20px;"></div>
        <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:48px;margin-bottom:12px;">🎯</div>
            <div style="font-size:20px;font-weight:900;color:#1e1b4b;margin-bottom:6px;">ברוך הבא ל-Vplus Pro!</div>
            <div style="font-size:13px;color:#6b7280;line-height:1.6;">רוצה לראות איך האפליקציה נראית<br>עם נתונים אמיתיים לפני שתתחיל?</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <button onclick="document.getElementById('demoPromptOverlay').remove();localStorage.setItem('vplus_demo_seen','true');loadDemoMode();"
                style="background:linear-gradient(135deg,#7367f0,#9055ff);color:white;border:none;border-radius:18px;padding:16px;font-size:15px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif;box-shadow:0 6px 20px rgba(115,103,240,0.4);">
                🎯 כן! הראה לי מצב דמו</button>
            <button onclick="document.getElementById('demoPromptOverlay').remove();localStorage.setItem('vplus_demo_seen','true');"
                style="background:#f3f4f6;color:#6b7280;border:none;border-radius:18px;padding:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;">
                לא תודה, אתחיל עם רשימה ריקה</button>
        </div>
        <style>@keyframes demoSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>`;
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
}

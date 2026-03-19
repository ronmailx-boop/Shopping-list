// ============================================================
//  app.js  —  Entry point — מייבא, מחבר ומאתחל
//  מייבא מ: כולם
// ============================================================

import { CATEGORIES, categoryTranslations, WIZ } from './constants.js';
import {
    db, activePage, isLocked, currentLang,
    currentEditIdx, listToDelete, categorySortEnabled,
    deletedItem, deletedItemIndex, deleteTimeout,
    pendingImportText, detectedListType,
    isDemoMode, currentUser, isConnected, syncTimeout,
    currentNoteItemIndex,
    setActivePage, setIsLocked, setCurrentEditIdx, setListToDelete,
    setDeletedItem, setDeletedItemIndex, setDeleteTimeout,
    setPendingImportText, setDetectedListType,
    setCurrentNoteItemIndex, setSyncTimeout,
    save, t, detectCategory, getLearnedCategory,
    toggleItem, undoCheck, toggleSum, toggleSelectAll,
    toggleDarkMode, showPage, toggleCategorySorting,
    confirmLanguageChange, changeLanguage,
    exportData, importData,
    loadDemoMode, exitDemoMode, checkFirstRunDemo,
    showDemoBanner
} from './store.js';

import {
    startFirebaseWatcher, initFirebaseAuth,
    loginWithGoogle, logoutFromCloud,
    syncToCloud, updateCloudIndicator, showDetailedError,
    normalizeItem, mergeCloudWithLocal,
    initNotificationSystem, _scheduleAllReminders,
    checkUrgentPayments, snoozeUrgentAlert, closeUrgentAlert,
    initServiceWorkerListener, checkNotificationUrlParam,
    loadGithubToken, saveGithubToken, updateGithubTokenStatus,
    showFinProgress, hideFinProgress, setFinStage,
    runFinancialFetch, startCreditCardFetch, startBankFetch,
    importFinancialTransactions, selectCreditCompany, selectBank,
    openCustomSnooze, applyCustomSnooze,
    getReminderMilliseconds, computeNextAlertTime, formatReminderText,
    initItemAlertTime, updateAppBadge
} from './services.js';

import {
    importFromText, checkClipboardOnStartup, toggleClipboardAutoOpen,
    showClipboardImportModal, openManualImport, updateDetectedTypeFromInput,
    detectListType, changeDetectedType, acceptClipboardImport,
    dismissClipboardImport, importTextToList, initClipboardListeners,
    initVoiceRecognition, startVoiceInput, stopVoiceInput, parseVoiceInput,
    startVoiceAction, initVoiceAction,
    performTranslation, translateText,
    processReceipt, createListFromReceipt,
    parseAppointmentText, parseShoppingListText, parseGeneralListText
} from './importers.js';

import {
    render, openModal, closeModal,
    showNotification, _showToast, _showLnbToast,
    handleLnbUndo, handleToastUndo,
    scrollToListTop, scrollToCheckedItems,
    searchInList, clearListSearch, searchInSummary,
    showAutocompleteSuggestions, selectAutocompleteSuggestion, hideAutocompleteSuggestions,
    generateItemMetadataHTML, adjustContentPadding, initSortable,
    renderStats, renderMonthlyChart, renderCategoryDoughnutChart,
    renderPopularItems, renderHistory, renderTemplates,
    renderCompletedLists, showCompletedListsModal,
    navigateMonth, getSelectedMonthKey, getMonthLabel,
    updateNotificationBadge, openNotificationCenter,
    dismissNotification, dismissAllNotifications,
    showUrgentAlertModal, goToItemFromAlert, jumpToItem,
    toggleCompactMode, handleCompactPlus, closeCompactActions,
    toggleCompactStats, _restoreCompactTabs,
    toggleListEditMode, toggleItemEditMode, reorderLists,
    setupListDrag, setupItemDrag,
    toggleListActionsPanel, openListActionsPanel, closeListActionsPanel,
    adjustListNameBarPosition, initListNameBarListeners, updatePlusBtnLabel,
    preparePrint,
    compactMode, expandedItemIdx, listEditMode, itemEditMode,
    setExpandedItemIdx, setListEditMode, setItemEditMode,
    getProductHistory
} from './ui.js';

// ============================================================
//  Local state for this module
// ============================================================
let _targetListId     = null;
let _deletedHistEntry = null;
let _deletedHistIdx   = null;
let _deleteHistTimeout = null;
let _restoreItemHistIdx = null;
let _restoreItemItemIdx = null;
let categoryToDelete       = null;
let categoryIndexToDelete  = null;

// wizard state
export let wizardMode       = localStorage.getItem('wizardMode') === 'true';
let _wizDismissCallback = null;
let _wizAutoTimer       = null;

// ============================================================
//  Helpers
// ============================================================
const _n = (id) => document.getElementById(id);

// ============================================================
//  Item actions
// ============================================================
function addItemToList(event) {
    if (event) event.preventDefault();
    const n  = _n('itemName')?.value.trim() || '';
    const p  = parseFloat(_n('itemPrice')?.value || 0) || 0;
    const q  = parseInt(_n('itemQty')?.value || 1) || 1;
    const dueDate      = _n('itemDueDate')?.value      || '';
    const dueTime      = _n('itemDueTime')?.value      || '';
    const paymentUrl   = _n('itemPaymentUrl')?.value.trim() || '';
    const notes        = _n('itemNotes')?.value.trim() || '';
    const reminderValue = _n('itemReminderValue')?.value || '';
    const reminderUnit  = _n('itemReminderUnit')?.value  || '';

    if (!n) { showNotification('⚠️ נא להזין שם מוצר', 'warning'); return; }

    const c = _n('itemCategory')?.value || '';
    let finalCategory;
    if (c) { finalCategory = c; }
    else {
        const learned = getLearnedCategory(n);
        finalCategory = learned || detectCategory(n) || 'אחר';
    }
    if (!db.categoryMemory) db.categoryMemory = {};
    db.categoryMemory[n.toLowerCase().trim()] = finalCategory;
    if (p > 0) updatePriceInHistory(n, p);

    const targetId = (_targetListId && db.lists[_targetListId]) ? _targetListId : db.currentId;
    const newItem = {
        name: n, price: p, qty: q, checked: false, category: finalCategory,
        note: notes, dueDate, dueTime, paymentUrl, isPaid: false,
        reminderValue, reminderUnit, nextAlertTime: null,
        lastUpdated: Date.now(),
        cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    initItemAlertTime(newItem);

    const items = db.lists[targetId].items;
    const firstChecked = items.findIndex(i => i.checked);
    if (firstChecked === -1) items.push(newItem);
    else items.splice(firstChecked, 0, newItem);

    db.currentId = targetId;

    // Reset form
    ['itemName','itemPrice','itemDueDate','itemDueTime','itemPaymentUrl','itemNotes','itemReminderValue'].forEach(id => { if (_n(id)) _n(id).value = ''; });
    if (_n('itemQty'))      _n('itemQty').value      = '1';
    if (_n('itemCategory')) _n('itemCategory').value = '';
    if (_n('itemReminderUnit')) _n('itemReminderUnit').value = '';

    const continuous = localStorage.getItem('continuousAdd') === 'true';
    if (continuous) setTimeout(() => _n('itemName')?.focus(), 80);
    else closeModal('inputForm');

    save();
    showNotification('✅ מוצר נוסף!');
    checkUrgentPayments();
}

function changeQty(idx, d) {
    const item = db.lists[db.currentId].items[idx];
    if (item.qty + d >= 1) { item.qty += d; save(); }
}

function removeItem(idx) {
    setDeletedItem(JSON.parse(JSON.stringify(db.lists[db.currentId].items[idx])));
    setDeletedItemIndex(idx);
    db.lists[db.currentId].items.splice(idx, 1);
    save();
    render();
    if (deleteTimeout) clearTimeout(deleteTimeout);
    _showToast({ message: `🗑️ "${deletedItem.name}" הוסר`, type: 'delete', undoCallback: undoDelete, duration: 5000 });
    setDeleteTimeout(setTimeout(() => { finalizeDelete(); }, 5000));
}

function undoDelete() {
    if (deletedItem !== null && deletedItemIndex !== null) {
        if (deleteTimeout) { clearTimeout(deleteTimeout); setDeleteTimeout(null); }
        db.lists[db.currentId].items.splice(deletedItemIndex, 0, deletedItem);
        setDeletedItem(null); setDeletedItemIndex(null);
        save(); render();
        showNotification('✅ הפעולה בוטלה');
    }
}

function finalizeDelete() {
    setDeletedItem(null); setDeletedItemIndex(null); setDeleteTimeout(null);
}

function toggleLock() {
    setIsLocked(!isLocked);
    const svg  = _n('lockIconSvg');
    const path = _n('lockIconPath');
    if (svg)  svg.setAttribute('stroke', isLocked ? 'white' : '#fb923c');
    if (path) path.setAttribute('d', isLocked
        ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
        : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    render();
}

// ============================================================
//  List actions
// ============================================================
function saveNewList() {
    const n = _n('newListNameInput')?.value.trim();
    const u = _n('newListUrlInput')?.value.trim() || '';
    const b = parseFloat(_n('newListBudget')?.value) || 0;
    const isTpl = _n('newListTemplate')?.checked || false;
    if (!n) return;
    const id = 'L' + Date.now();
    db.lists[id] = { name: n, url: u, budget: b, isTemplate: isTpl, items: [] };
    db.currentId = id;
    setActivePage('lists');
    closeModal('newListModal');
    save();
    if (typeof window.openSmartBar === 'function') window.openSmartBar();
    if (typeof window.updateExpandedTabs === 'function') window.updateExpandedTabs('lists');
    showNotification(isTpl ? '⭐ תבנית נוצרה!' : '✅ רשימה נוצרה!');
}

function deleteFullList() {
    if (!listToDelete) return;
    delete db.lists[listToDelete];
    const keys = Object.keys(db.lists);
    if (db.currentId === listToDelete) {
        if (keys.length === 0) {
            db.lists['L1'] = { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] };
            db.currentId = 'L1';
        } else {
            db.currentId = keys[0];
        }
    }
    setListToDelete(null);
    closeModal('deleteListModal');
    save();
    showNotification('🗑️ רשימה נמחקה');
}

function prepareDeleteList(id) { setListToDelete(id); openModal('deleteListModal'); }

function saveListName() {
    const n = _n('editListNameInput')?.value.trim();
    const u = _n('editListUrlInput')?.value.trim()  || '';
    const b = parseFloat(_n('editListBudget')?.value) || 0;
    if (n) { db.lists[db.currentId].name = n; db.lists[db.currentId].url = u; db.lists[db.currentId].budget = b; save(); }
    closeModal('editListNameModal');
}

function completeList() {
    const list = db.lists[db.currentId];
    if (!list || list.items.length === 0) { showNotification('הרשימה ריקה!', 'warning'); closeModal('confirmModal'); return; }
    const total = list.items.reduce((s, i) => s + i.price * i.qty, 0);
    db.history.push({ name: list.name, url: list.url, items: JSON.parse(JSON.stringify(list.items)), total, completedAt: Date.now() });
    db.stats.totalSpent += total;
    db.stats.listsCompleted++;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    db.stats.monthlyData[monthKey] = (db.stats.monthlyData[monthKey] || 0) + total;
    list.items = [];
    closeModal('confirmModal');
    setActivePage('stats');
    save();
    showNotification('✅ הרשימה הושלמה ונשמרה בהיסטוריה!');
}

function toggleTemplateMode() {
    const list = db.lists[db.currentId];
    list.isTemplate = !list.isTemplate;
    save();
    showNotification(list.isTemplate ? '⭐ נשמר כתבנית' : '✅ הוסר מתבניות');
}

function clearChecked() {
    if (confirm('למחוק את כל הפריטים המסומנים?')) {
        db.lists[db.currentId].items = db.lists[db.currentId].items.filter(i => !i.checked);
        save();
        showNotification('🗑️ פריטים מסומנים נמחקו');
    }
}

function selectListAndImport(listId) {
    db.currentId = listId;
    if (pendingImportText && detectedListType) importTextToList(listId, pendingImportText, detectedListType);
    else render();
}

function createNewList() {
    const name = prompt('שם הרשימה החדשה:');
    if (!name?.trim()) return;
    const id = 'L' + Date.now();
    db.lists[id] = { name: name.trim(), url: '', budget: 0, isTemplate: false, items: [] };
    db.currentId = id;
    if (pendingImportText && detectedListType) importTextToList(id, pendingImportText, detectedListType);
    else { save(); render(); showNotification('✅ רשימה חדשה נוצרה!'); }
}

async function shareNative(type) {
    let title = '', text = '';
    if (type === 'list') {
        const list = db.lists[db.currentId];
        if (!list.items.length) return;
        title = `Vplus - ${list.name}`;
        text  = `🛒 *${list.name}:*\n\n`;
        list.items.forEach((i, idx) => { text += `${idx+1}. ${i.checked?'✅':'⬜'} *${i.name}* (x${i.qty}) - ₪${(i.price*i.qty).toFixed(2)}\n`; });
        text += `\n💰 *סה"כ: ₪${_n('displayTotal')?.innerText}*`;
    } else {
        const sel = db.selectedInSummary;
        if (!sel.length) { alert('בחר לפחות רשימה אחת לשיתוף!'); return; }
        title = 'Vplus - ריכוז רשימות'; text = `📦 *ריכוז רשימות קנייה (חסרים בלבד):*\n\n`;
        sel.forEach(id => { const l = db.lists[id]; const miss = l.items.filter(i => !i.checked); if (miss.length) { text += `🔹 *${l.name}:*\n`; miss.forEach(i => text += `  - ${i.name} (x${i.qty})\n`); text += `\n`; } });
    }
    if (navigator.share) { try { await navigator.share({ title, text }); } catch (e) {} }
    else navigator.clipboard.writeText(text).then(() => showNotification('📋 הטקסט הועתק ללוח!'));
}

// ============================================================
//  Edit item
// ============================================================
function openEditTotalModal(idx) { setCurrentEditIdx(idx); if (_n('editTotalInput')) _n('editTotalInput').value = ''; openModal('editTotalModal'); }

function saveTotal() {
    const val = parseFloat(_n('editTotalInput')?.value);
    if (!isNaN(val) && currentEditIdx !== null) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        item.lastUpdated = Date.now();
        updatePriceInHistory(item.name, item.price);
        save();
    }
    closeModal('editTotalModal');
}

function openEditItemNameModal(idx) {
    setCurrentEditIdx(idx);
    const item = db.lists[db.currentId].items[idx];
    const fields = { editItemName: item.name, editItemPrice: item.price || '', editItemQty: item.qty || 1, editItemDueDate: item.dueDate || '', editItemDueTime: item.dueTime || '', editItemPaymentUrl: item.paymentUrl || '', editItemNotes: item.note || '', editItemCategory: item.category || '', editItemReminderValue: item.reminderValue || '', editItemReminderUnit: item.reminderUnit || 'minutes' };
    Object.entries(fields).forEach(([id, val]) => { if (_n(id)) _n(id).value = val; });
    const drawer = _n('editAdvancedDrawer'), btn = _n('editAdvancedToggleBtn');
    drawer?.classList.remove('open'); btn?.classList.remove('open');
    openModal('editItemNameModal');
    setTimeout(() => { const inp = _n('editItemName'); if (inp) { inp.focus(); inp.select(); } }, 100);
}

function saveItemEdit() {
    if (currentEditIdx === null) return;
    const newName = _n('editItemName')?.value.trim();
    if (!newName) return;
    const item = db.lists[db.currentId].items[currentEditIdx];
    item.name          = newName;
    item.price         = parseFloat(_n('editItemPrice')?.value) || 0;
    item.qty           = parseInt(_n('editItemQty')?.value)     || 1;
    item.dueDate       = _n('editItemDueDate')?.value           || '';
    item.dueTime       = _n('editItemDueTime')?.value           || '';
    item.paymentUrl    = _n('editItemPaymentUrl')?.value.trim() || '';
    item.note          = _n('editItemNotes')?.value.trim()      || '';
    item.category      = _n('editItemCategory')?.value          || '';
    item.reminderValue = _n('editItemReminderValue')?.value     || '';
    item.reminderUnit  = _n('editItemReminderUnit')?.value      || '';
    item.lastUpdated   = Date.now();
    initItemAlertTime(item);

    db.lastActivePage = activePage; db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    updateNotificationBadge();
    closeModal('editItemNameModal');
    showNotification('✅ הפריט עודכן!');
    checkUrgentPayments();

    if (isConnected && currentUser) {
        if (syncTimeout) clearTimeout(syncTimeout);
        setSyncTimeout(setTimeout(() => syncToCloud(), 1500));
    }
}

function saveItemName() {
    const newName = _n('editItemNameInput')?.value.trim();
    if (newName && currentEditIdx !== null) { db.lists[db.currentId].items[currentEditIdx].name = newName; save(); showNotification('✓ השם עודכן בהצלחה'); }
    closeModal('editItemNameModal');
}

// ============================================================
//  Item Note
// ============================================================
function openItemNoteModal(itemIndex) {
    setCurrentNoteItemIndex(itemIndex);
    const item = db.lists[db.currentId].items[itemIndex];
    if (_n('itemNoteInput')) _n('itemNoteInput').value = item.note || '';
    openModal('itemNoteModal');
}

function openItemNote(idx) { openItemNoteModal(idx); }

function saveItemNote() {
    if (currentNoteItemIndex === null) return;
    const note = _n('itemNoteInput')?.value.trim() || '';
    if (db.lists[db.currentId]?.items[currentNoteItemIndex]) {
        db.lists[db.currentId].items[currentNoteItemIndex].note = note;
        save(); closeModal('itemNoteModal'); setCurrentNoteItemIndex(null);
        showNotification(note ? '✅ ההערה נשמרה' : '🗑️ ההערה נמחקה');
    }
}

// ============================================================
//  Category management
// ============================================================
function openEditCategoryModal(idx) {
    setCurrentEditIdx(idx);
    const item = db.lists[db.currentId].items[idx];
    const cont = _n('categoryOptions');
    if (!cont) { openModal('editCategoryModal'); return; }
    cont.innerHTML = '';
    const buildBtn = (name, isSelected) => {
        const color = CATEGORIES[name] || '#6b7280';
        const btn = document.createElement('button');
        btn.className = `w-full py-3 px-4 rounded-xl font-bold mb-2 transition-all`;
        btn.style.cssText = `background:${color}20;color:${color};border:2px solid ${color};`;
        btn.textContent = isSelected ? `✓ ${name}` : name;
        btn.onclick = () => selectCategory(name);
        return btn;
    };
    for (const cat in CATEGORIES) cont.appendChild(buildBtn(cat, item.category === cat));
    if (db.customCategories?.length) {
        const sep = document.createElement('div');
        sep.className = 'text-sm font-bold text-gray-500 mt-3 mb-2';
        sep.textContent = '✨ קטגוריות מותאמות אישית';
        cont.appendChild(sep);
        db.customCategories.forEach(cat => cont.appendChild(buildBtn(cat, item.category === cat)));
    }
    if (_n('customCategoryInput')) _n('customCategoryInput').value = '';
    openModal('editCategoryModal');
}

function selectCategory(categoryName) {
    if (currentEditIdx !== null) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.category = categoryName;
        if (!db.categoryMemory) db.categoryMemory = {};
        db.categoryMemory[item.name.toLowerCase().trim()] = categoryName;
        save(); showNotification('✓ הקטגוריה עודכנה');
    }
    closeModal('editCategoryModal');
}

function saveCustomCategory() {
    const customCat = _n('customCategoryInput')?.value.trim();
    if (customCat && currentEditIdx !== null) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.category = customCat;
        if (!db.customCategories) db.customCategories = [];
        if (!db.customCategories.includes(customCat)) db.customCategories.push(customCat);
        if (!db.categoryMemory) db.categoryMemory = {};
        db.categoryMemory[item.name.toLowerCase().trim()] = customCat;
        if (!CATEGORIES[customCat]) {
            const colors = ['#22c55e','#ef4444','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#10b981','#6366f1'];
            CATEGORIES[customCat] = colors[db.customCategories.length % colors.length];
        }
        save(); showNotification('✓ קטגוריה מותאמת נשמרה');
    }
    closeModal('editCategoryModal');
}

function openCategoryManager() { renderCustomCategoriesList(); openModal('categoryManagerModal'); }

function renderCustomCategoriesList() {
    const cont = _n('customCategoriesList');
    if (!cont) return;
    if (!db.customCategories?.length) { cont.innerHTML = '<p class="text-gray-400 text-center py-8">אין קטגוריות מותאמות אישית</p>'; return; }
    cont.innerHTML = db.customCategories.map((cat, idx) => {
        const color = CATEGORIES[cat] || '#6b7280';
        return `<div class="flex justify-between items-center mb-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
            <div class="flex items-center gap-3"><div class="w-4 h-4 rounded-full" style="background:${color}"></div><span class="font-bold text-gray-800">${cat}</span></div>
            <button onclick="openDeleteCategoryModal('${cat.replace(/'/g,"\\'")}',${idx})" class="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">🗑️ מחק</button>
        </div>`;
    }).join('');
}

function openDeleteCategoryModal(name, idx) {
    categoryToDelete = name; categoryIndexToDelete = idx;
    const el = _n('categoryToDeleteName');
    if (el) { el.textContent = name; el.style.color = CATEGORIES[name] || '#7367f0'; }
    openModal('deleteCategoryModal');
}

function executeDeleteCategory() {
    if (categoryToDelete !== null) { deleteCustomCategory(categoryToDelete, categoryIndexToDelete); closeModal('deleteCategoryModal'); categoryToDelete = null; categoryIndexToDelete = null; }
}

function deleteCustomCategory(name, idx) {
    db.customCategories?.splice(idx, 1);
    if (db.categoryMemory) Object.keys(db.categoryMemory).forEach(k => { if (db.categoryMemory[k] === name) db.categoryMemory[k] = 'אחר'; });
    Object.values(db.lists).forEach(l => l.items.forEach(i => { if (i.category === name) i.category = 'אחר'; }));
    (db.history || []).forEach(e => e.items.forEach(i => { if (i.category === name) i.category = 'אחר'; }));
    if (CATEGORIES[name]) delete CATEGORIES[name];
    save(); renderCustomCategoriesList(); updateCategoryDropdown();
    showNotification(`✅ הקטגוריה '${name}' נמחקה`);
}

function updateCategoryDropdown() {
    const sel = _n('itemCategory');
    if (!sel) return;
    const cur = sel.value;
    const cats = categoryTranslations[currentLang] || categoryTranslations['he'];
    sel.innerHTML = `<option value="">${t('selectCategory')}</option>`;
    for (const key in cats) { const opt = document.createElement('option'); opt.value = key; opt.textContent = cats[key]; sel.appendChild(opt); }
    (db.customCategories || []).forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = `✨ ${c}`; sel.appendChild(opt); });
    if (cur && Array.from(sel.options).some(o => o.value === cur)) sel.value = cur;
}

// ============================================================
//  Price / history helpers
// ============================================================
function updatePriceInHistory(itemName, newPrice) {
    if (!itemName || !newPrice) return;
    const lower = itemName.toLowerCase().trim(), ts = Date.now();
    Object.values(db.lists).forEach(l => l.items.forEach(i => { if (i.name.toLowerCase().trim() === lower) { i.price = newPrice; i.lastUpdated = ts; } }));
}

function autofillFromHistory(itemName) {
    if (!itemName || itemName.length < 2) return;
    const lower = itemName.toLowerCase().trim();
    let lastPrice = null, lastDate = 0;
    Object.values(db.lists).forEach(l => l.items.forEach(i => { if (i.name.toLowerCase().trim() === lower && i.price > 0 && (i.lastUpdated || 0) > lastDate) { lastDate = i.lastUpdated || 0; lastPrice = i.price; } }));
    const priceInput = _n('itemPrice');
    if (lastPrice && priceInput && !priceInput.value) { priceInput.value = lastPrice; priceInput.style.backgroundColor = '#fef3c7'; setTimeout(() => priceInput.style.backgroundColor = '', 1500); }
}

// ============================================================
//  Context bar (target list for add-item)
// ============================================================
function initContextBar() { _targetListId = db.currentId; updateContextBarDisplay(); }

function updateContextBarDisplay() {
    const el = _n('contextListName');
    if (el) el.textContent = db.lists[_targetListId]?.name || '—';
}

function toggleListDropdown() {
    const dd = _n('listDropdown'), btn = _n('contextListBtn');
    if (!dd) return;
    const isOpen = dd.classList.toggle('open');
    btn?.classList.toggle('open', isOpen);
    if (isOpen) { renderListDropdown(); setTimeout(() => document.addEventListener('click', closeListDropdownOutside), 10); }
    else document.removeEventListener('click', closeListDropdownOutside);
}

function closeListDropdownOutside(e) { const bar = _n('contextBar'); if (bar && !bar.contains(e.target)) closeListDropdown(); }
function closeListDropdown() { _n('listDropdown')?.classList.remove('open'); _n('contextListBtn')?.classList.remove('open'); document.removeEventListener('click', closeListDropdownOutside); }

function renderListDropdown() {
    const scroll = _n('listDropdownScroll');
    if (!scroll) return;
    const lists = Object.entries(db.lists).filter(([,l]) => !l.isTemplate);
    scroll.innerHTML = lists.map(([id, l]) => `<div class="list-dropdown-item ${id === _targetListId ? 'active' : ''}" onclick="event.stopPropagation();selectTargetList('${id}')">${l.name}</div>`).join('');
    if (_n('newListFromDropdown')) _n('newListFromDropdown').value = '';
}

function selectTargetList(id) { _targetListId = id; updateContextBarDisplay(); closeListDropdown(); }

function createListFromDropdown() {
    const inp = _n('newListFromDropdown');
    if (!inp) return;
    const name = inp.value.trim();
    if (!name) { inp.focus(); return; }
    const id = 'L' + Date.now();
    db.lists[id] = { name, url: '', budget: 0, isTemplate: false, items: [] };
    save(); _targetListId = id; updateContextBarDisplay(); closeListDropdown();
    showNotification(`✅ רשימה "${name}" נוצרה!`);
}

function toggleContinuousMode() {
    const toggle = _n('continuousToggle');
    if (!toggle) return;
    const isOn = toggle.checked;
    localStorage.setItem('continuousAdd', isOn);
    _n('continuousToggleWrap')?.classList.toggle('active', isOn);
    if (_n('addItemBtn')) _n('addItemBtn').textContent = isOn ? 'הוסף + המשך ➜' : 'הוסף ✓';
}

function toggleAdvancedDrawer() {
    const drawer = _n('advancedDrawer'), btn = _n('advancedToggleBtn');
    if (!drawer || !btn) return;
    const isOpen = drawer.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.querySelector('span:first-child').textContent = isOpen ? '⚙️ הסתר פרטים' : '⚙️ פרטים נוספים';
}

// ============================================================
//  History restore / delete
// ============================================================
function restoreFromHistory(idx, source) {
    const entry = db.history[idx]; if (!entry) return;
    const lists    = Object.entries(db.lists).filter(([,l]) => !l.isTemplate);
    const listsHtml = lists.map(([id, l]) => `<div class="list-dropdown-item" onclick="executeRestoreList('${id}',${idx},'${source}')">📋 ${l.name}</div>`).join('');
    const existing = document.getElementById('restoreListPickerOverlay'); if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'restoreListPickerOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);';
    overlay.innerHTML = `<div style="background:white;border-radius:20px;padding:20px;width:88%;max-width:360px;box-shadow:0 10px 30px rgba(0,0,0,0.25);direction:rtl;">
        <div style="font-weight:800;font-size:1rem;color:#1e1b4b;margin-bottom:4px;">📋 שחזור רשימה</div>
        <div style="font-size:0.8rem;color:#6b7280;margin-bottom:14px;">לאן תרצה לשחזר את "<b>${entry.name}</b>"?</div>
        <div style="margin-bottom:10px;padding:10px;background:#f0eeff;border-radius:12px;border:1.5px solid #c4b5fd;">
            <div style="font-size:0.8rem;font-weight:700;color:#7367f0;margin-bottom:8px;">✨ רשימה חדשה</div>
            <div style="display:flex;gap:6px;">
                <input id="restoreNewListName" style="flex:1;border:1.5px solid #c4b5fd;border-radius:8px;padding:7px 10px;font-size:0.82rem;font-weight:700;outline:none;color:#1e1b4b;background:white;" placeholder="שם הרשימה..." value="${entry.name} (משוחזר)" onclick="event.stopPropagation()" onkeydown="if(event.key==='Enter'){event.stopPropagation();executeRestoreList('__new__',${idx},'${source}');}">
                <button onclick="executeRestoreList('__new__',${idx},'${source}')" style="background:linear-gradient(135deg,#7367f0,#9055ff);color:white;border:none;border-radius:8px;padding:7px 14px;font-size:0.82rem;font-weight:800;cursor:pointer;">צור ✓</button>
            </div>
        </div>
        ${lists.length ? `<div style="font-size:0.78rem;font-weight:700;color:#9ca3af;margin-bottom:6px;">או הוסף לרשימה קיימת:</div><div style="max-height:180px;overflow-y:auto;border-radius:12px;border:1.5px solid #e0e7ff;">${listsHtml}</div>` : ''}
        <button onclick="document.getElementById('restoreListPickerOverlay').remove()" style="margin-top:12px;width:100%;padding:10px;border-radius:12px;background:#f3f4f6;border:none;font-weight:700;color:#6b7280;cursor:pointer;">ביטול</button>
    </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function executeRestoreList(targetId, histIdx, source) {
    const overlay = document.getElementById('restoreListPickerOverlay');
    const entry   = db.history[histIdx]; if (!entry) return;
    const restoredItems = JSON.parse(JSON.stringify(entry.items.map(item => ({ ...item, checked: false, cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2,9) }))));
    let finalId;
    if (targetId === '__new__') {
        const nameInput = document.getElementById('restoreNewListName');
        const name = nameInput?.value.trim() || entry.name + ' (משוחזר)';
        finalId = 'L' + Date.now();
        db.lists[finalId] = { name, url: entry.url || '', budget: 0, isTemplate: false, items: restoredItems };
    } else {
        finalId = targetId;
        restoredItems.forEach(item => { const items = db.lists[finalId].items; const fc = items.findIndex(i => i.checked); fc === -1 ? items.push(item) : items.splice(fc, 0, item); });
    }
    db.currentId = finalId; setActivePage('lists');
    if (overlay) overlay.remove();
    if (source === 'completed') closeModal('completedListsModal'); else closeModal('historyModal');
    save(); render(); showNotification('✅ רשימה שוחזרה!');
}

function confirmDeleteHistory(idx, source) {
    const entry = db.history[idx]; if (!entry) return;
    const existing = document.getElementById('confirmDeleteHistoryOverlay'); if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'confirmDeleteHistoryOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);';
    overlay.innerHTML = `<div style="background:white;border-radius:20px;padding:22px;width:85%;max-width:340px;box-shadow:0 10px 30px rgba(0,0,0,0.25);direction:rtl;text-align:center;">
        <div style="font-size:2rem;margin-bottom:8px;">🗑️</div>
        <div style="font-weight:800;font-size:1rem;color:#1e1b4b;margin-bottom:6px;">מחיקת רשימה</div>
        <div style="font-size:0.85rem;color:#6b7280;margin-bottom:18px;">האם אתה בטוח שברצונך למחוק את<br><strong style="color:#ef4444;">"${entry.name}"</strong>?</div>
        <div style="display:flex;gap:10px;">
            <button onclick="executeDeleteHistory(${idx},'${source}')" style="flex:1;padding:12px;background:#ef4444;color:white;border:none;border-radius:12px;font-weight:800;cursor:pointer;">מחק</button>
            <button onclick="document.getElementById('confirmDeleteHistoryOverlay').remove()" style="flex:1;padding:12px;background:#f3f4f6;color:#6b7280;border:none;border-radius:12px;font-weight:800;cursor:pointer;">ביטול</button>
        </div>
    </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function executeDeleteHistory(idx, source) {
    document.getElementById('confirmDeleteHistoryOverlay')?.remove();
    if (_deleteHistTimeout) { clearTimeout(_deleteHistTimeout); _deleteHistTimeout = null; }
    _deletedHistEntry = JSON.parse(JSON.stringify(db.history[idx]));
    _deletedHistIdx   = idx;
    db.history.splice(idx, 1); save();
    if (source === 'completed') renderCompletedLists(); else renderHistory();
    _showToast({ message: `🗑️ "${_deletedHistEntry.name}" נמחקה`, type: 'delete', undoCallback: undoDeleteHistory, duration: 5000 });
    _deleteHistTimeout = setTimeout(() => { _deletedHistEntry = null; _deletedHistIdx = null; _deleteHistTimeout = null; }, 5000);
}

function undoDeleteHistory() {
    if (_deletedHistEntry === null) return;
    if (_deleteHistTimeout) { clearTimeout(_deleteHistTimeout); _deleteHistTimeout = null; }
    db.history.splice(_deletedHistIdx, 0, _deletedHistEntry);
    _deletedHistEntry = null; _deletedHistIdx = null;
    save(); renderCompletedLists(); renderHistory(); showNotification('✅ הפעולה בוטלה');
}

function openRestoreItemPicker(histIdx, itemIdx, source) {
    _restoreItemHistIdx = histIdx; _restoreItemItemIdx = itemIdx;
    const entry = db.history[histIdx]; if (!entry) return;
    const item  = entry.items[itemIdx]; if (!item) return;
    const lists = Object.entries(db.lists).filter(([,l]) => !l.isTemplate);
    const existing = document.getElementById('restoreItemPickerOverlay'); if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'restoreItemPickerOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);';
    const listsHtml = lists.map(([id, l]) => `<div class="list-dropdown-item" onclick="restoreSingleItem('${id}')">📋 ${l.name}</div>`).join('');
    overlay.innerHTML = `<div style="background:white;border-radius:20px;padding:20px;width:88%;max-width:360px;direction:rtl;">
        <div style="font-weight:800;margin-bottom:10px;">➕ הוסף "${item.name}" לרשימה:</div>
        <div style="max-height:240px;overflow-y:auto;border-radius:12px;border:1.5px solid #e0e7ff;">${listsHtml}</div>
        <button onclick="document.getElementById('restoreItemPickerOverlay').remove()" style="margin-top:12px;width:100%;padding:10px;border-radius:12px;background:#f3f4f6;border:none;font-weight:700;color:#6b7280;cursor:pointer;">ביטול</button>
    </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function restoreSingleItem(targetListId) {
    const entry = db.history[_restoreItemHistIdx]; if (!entry) return;
    const item  = entry.items[_restoreItemItemIdx]; if (!item) return;
    const newItem = { ...JSON.parse(JSON.stringify(item)), checked: false, cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2,9) };
    const items  = db.lists[targetListId].items;
    const fc     = items.findIndex(i => i.checked);
    fc === -1 ? items.push(newItem) : items.splice(fc, 0, newItem);
    document.getElementById('restoreItemPickerOverlay')?.remove();
    save(); showNotification(`✅ "${item.name}" נוסף לרשימה!`);
}

function createFromTemplate(templateId) {
    const tpl = db.lists[templateId]; if (!tpl) return;
    const newId = 'L' + Date.now();
    db.lists[newId] = { name: tpl.name, url: tpl.url, budget: tpl.budget, isTemplate: false, items: JSON.parse(JSON.stringify(tpl.items)) };
    db.currentId = newId; setActivePage('lists');
    closeModal('templatesModal'); save(); showNotification('✅ רשימה נוצרה מתבנית!');
}

// ============================================================
//  tapTab  —  החלפת טאב ראשי
// ============================================================
function tapTab(tab) {
    setActivePage(tab);
    if (typeof window.openSmartBar   === 'function') window.openSmartBar();
    if (typeof window.updateExpandedTabs === 'function') window.updateExpandedTabs(tab);
    save();
    updatePlusBtnLabel();
    render();
}

// ============================================================
//  editDueDate / editNotes (inline item edit from alert)
// ============================================================
function editDueDate(idx) { openEditItemNameModal(idx); }
function editNotes(idx)   { openEditItemNameModal(idx); }
function toggleItemPaid(idx) {
    const item = db.lists[db.currentId].items[idx];
    if (!item) return; item.isPaid = !item.isPaid; save();
    showNotification(item.isPaid ? '✅ סומן כשולם' : '◻️ הסימון הוסר');
}

// ============================================================
//  Wizard
// ============================================================
function toggleWizardMode() {
    wizardMode = !wizardMode;
    localStorage.setItem('wizardMode', wizardMode ? 'true' : 'false');
    const btn = _n('wizardModeBtn'), txt = _n('wizardBtnText');
    if (btn) btn.style.background = wizardMode ? 'linear-gradient(135deg,#7367f0,#9055ff)' : 'rgba(255,255,255,0.12)';
    if (txt) txt.textContent = wizardMode ? '🧙 כבה ויזארד' : '🧙 ויזארד';
    showNotification(wizardMode ? '🧙 מצב ויזארד מופעל!' : '✅ ויזארד כובה');
}

function wiz(key, phase, onDismiss) {
    const def = WIZ[key]; if (!def) { if (onDismiss) onDismiss(); return; }
    if (def.phase !== phase) { if (onDismiss) onDismiss(); return; }
    _wizDismissCallback = onDismiss || null;
    if (_wizAutoTimer) { clearTimeout(_wizAutoTimer); _wizAutoTimer = null; }

    const overlay = document.createElement('div');
    overlay.id = 'wizCardOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding-bottom:env(safe-area-inset-bottom,0);';
    overlay.innerHTML = `<div id="wizCard" style="background:white;border-radius:24px 24px 0 0;width:100%;max-width:480px;padding:28px 20px 40px;animation:wizSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1);">
        <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:3rem;margin-bottom:8px;">${def.emoji || '💡'}</div>
            <div style="font-size:1.1rem;font-weight:900;color:#1e1b4b;margin-bottom:10px;">${def.title}</div>
            <div style="font-size:0.9rem;color:#6b7280;line-height:1.6;white-space:pre-line;">${def.body}</div>
            ${def.tip ? `<div style="margin-top:12px;padding:10px 14px;background:#f0eeff;border-radius:12px;font-size:0.82rem;color:#7367f0;font-weight:700;text-align:right;">${def.tip}</div>` : ''}
        </div>
        <button onclick="_wizDismiss()" style="width:100%;padding:14px;background:linear-gradient(135deg,#7367f0,#9055ff);color:white;border:none;border-radius:18px;font-size:1rem;font-weight:900;cursor:pointer;">הבנתי! ✓</button>
    </div><style>@keyframes wizSlideIn{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) _wizDismiss(); });
    const existing = document.getElementById('wizCardOverlay'); if (existing) existing.remove();
    document.body.appendChild(overlay);
    _wizAutoTimer = setTimeout(() => _wizDismiss(), 30000);
}

function _wizDismiss() {
    if (_wizAutoTimer) { clearTimeout(_wizAutoTimer); _wizAutoTimer = null; }
    const overlay = document.getElementById('wizCardOverlay');
    const card    = document.getElementById('wizCard');
    if (card) { card.style.animation = 'wizSlideIn 0.25s reverse'; setTimeout(() => overlay?.remove(), 220); }
    else overlay?.remove();
    const cb = _wizDismissCallback; _wizDismissCallback = null;
    if (cb) cb();
}

function _wizForceClose() { if (document.getElementById('wizCardOverlay')) _wizDismiss(); }

// ─── _wizSkip — נקרא מ-HTML (כפתור "דלג") ───
function _wizSkip() {
    _wizDismiss();
    wizardMode = false;
    localStorage.setItem('wizardMode', 'false');
    window.wizardMode = false;
    const btn = _n('wizardModeBtn'), txt = _n('wizardBtnText');
    if (btn) btn.style.background = 'rgba(255,255,255,0.12)';
    if (txt) txt.textContent = '🧙 ויזארד';
    showNotification('✅ ויזארד כובה');
}

// ─── saveReminderEdit — נקרא מ-HTML (מודל תזכורת) ───
function saveReminderEdit() {
    if (currentEditIdx === null) return;
    const item = db.lists[db.currentId]?.items[currentEditIdx];
    if (!item) return;
    item.reminderValue = _n('editItemReminderValue')?.value || '';
    item.reminderUnit  = _n('editItemReminderUnit')?.value  || '';
    item.lastUpdated   = Date.now();
    initItemAlertTime(item);
    save();
    closeModal('editReminderModal');
    showNotification('✅ תזכורת עודכנה!');
    checkUrgentPayments();
}

function openWizard(type)     { openModal(type + 'Modal'); }
function closeWizard()        { }
function wizardOverlayClick() { }

// handlePlusBtn — ה-+ הראשי
function handlePlusBtn(e) {
    if (wizardMode) {
        wiz('plusBtn', 'before', () => {
            if (activePage === 'summary') openModal('newListModal');
            else { if (typeof window.openModal === 'function') openModal('inputForm'); }
        });
    } else {
        if (activePage === 'summary') openModal('newListModal');
        else openModal('inputForm');
    }
}

// ============================================================
//  Debug log
// ============================================================
const _globalDebugLogs = [];
function dbgLog(msg, color) {
    const type = color === '#ff4444' ? 'error' : color === '#ffaa00' ? 'warn' : 'info';
    _globalDebugLogs.push({ msg, type, time: new Date().toLocaleTimeString('he-IL') });
}

function showDebugLog(logs) {
    let panel = _n('debugLogPanel');
    if (!panel) { panel = document.createElement('div'); panel.id = 'debugLogPanel'; panel.style.cssText = 'position:fixed;bottom:80px;right:8px;width:calc(100% - 16px);max-width:420px;max-height:260px;overflow-y:auto;background:#0f172a;border-radius:16px;z-index:9999;padding:12px;font-family:monospace;font-size:11px;color:#94a3b8;box-shadow:0 8px 32px rgba(0,0,0,0.5);'; document.body.appendChild(panel); }
    if (!logs?.length) { panel.innerHTML = '<div style="color:#64748b;text-align:center;padding:8px;">אין לוגים</div>'; return; }
    const colors = { info:'#94a3b8', success:'#22c55e', error:'#ef4444', warn:'#f59e0b' };
    panel.innerHTML = logs.slice(-30).map(l => `<div style="color:${colors[l.type]||'#94a3b8'};padding:2px 0;border-bottom:1px solid #1e293b;">[${l.time}] ${l.msg}</div>`).join('') + '<div style="height:4px;"></div>';
    panel.scrollTop = panel.scrollHeight;
}

// ============================================================
//  Init ResizeObserver for bar height
// ============================================================
function initBarObserver() {
    const bar = _n('listNameBar');
    if (!bar) { setTimeout(initBarObserver, 100); return; }
    const observer = new ResizeObserver(() => adjustContentPadding());
    observer.observe(bar);
    adjustContentPadding();
    [100, 400, 800].forEach(t => setTimeout(adjustContentPadding, t));
}

// ============================================================
//  Expose ALL functions to window (HTML inline handlers)
// ============================================================
function _exposeAll() {
    const fns = {
        // store
        toggleItem, undoCheck, toggleSum, toggleSelectAll, toggleDarkMode,
        showPage, toggleCategorySorting, confirmLanguageChange, changeLanguage,
        exportData, importData, loadDemoMode, exitDemoMode, checkFirstRunDemo, showDemoBanner,
        // services
        loginWithGoogle, logoutFromCloud, syncToCloud,
        snoozeUrgentAlert, closeUrgentAlert, checkUrgentPayments, openCustomSnooze, applyCustomSnooze,
        loadGithubToken, saveGithubToken, updateGithubTokenStatus,
        startCreditCardFetch, startBankFetch, selectCreditCompany, selectBank,
        // importers
        importFromText, checkClipboardOnStartup, toggleClipboardAutoOpen,
        openManualImport, updateDetectedTypeFromInput, changeDetectedType,
        acceptClipboardImport, dismissClipboardImport,
        startVoiceInput, stopVoiceInput, startVoiceAction,
        performTranslation, processReceipt,
        // ui
        render, openModal, closeModal, showNotification, _showToast,
        handleLnbUndo, handleToastUndo,
        scrollToListTop, scrollToCheckedItems,
        searchInList, clearListSearch, searchInSummary,
        selectAutocompleteSuggestion, hideAutocompleteSuggestions,
        adjustContentPadding, preparePrint,
        renderHistory, renderTemplates, renderCompletedLists, showCompletedListsModal,
        navigateMonth, updateNotificationBadge,
        openNotificationCenter, dismissNotification, dismissAllNotifications,
        showUrgentAlertModal, goToItemFromAlert, jumpToItem,
        toggleCompactMode, handleCompactPlus, closeCompactActions, toggleCompactStats,
        toggleListEditMode, toggleItemEditMode,
        toggleListActionsPanel, openListActionsPanel, closeListActionsPanel,
        updatePlusBtnLabel,
        // app.js local
        addItemToList, changeQty, removeItem, undoDelete, toggleLock,
        saveNewList, deleteFullList, prepareDeleteList, saveListName,
        completeList, toggleTemplateMode, clearChecked,
        selectListAndImport, createNewList, shareNative,
        openEditTotalModal, saveTotal, openEditItemNameModal, saveItemEdit, saveItemName,
        openEditCategoryModal, selectCategory, saveCustomCategory,
        openCategoryManager, renderCustomCategoriesList,
        openDeleteCategoryModal, executeDeleteCategory, deleteCustomCategory, updateCategoryDropdown,
        openItemNoteModal, openItemNote, saveItemNote,
        autofillFromHistory, updatePriceInHistory,
        initContextBar, updateContextBarDisplay, toggleListDropdown,
        closeListDropdown, renderListDropdown, selectTargetList,
        createListFromDropdown, toggleContinuousMode, toggleAdvancedDrawer,
        restoreFromHistory, executeRestoreList,
        confirmDeleteHistory, executeDeleteHistory, undoDeleteHistory,
        openRestoreItemPicker, restoreSingleItem, createFromTemplate,
        tapTab, editDueDate, editNotes, toggleItemPaid,
        toggleWizardMode, wiz, _wizDismiss, _wizForceClose, _wizSkip,
        openWizard, closeWizard, wizardOverlayClick, handlePlusBtn,
        saveReminderEdit,
        dbgLog, showDebugLog,
        // bank modal stubs
        openBankModal: () => openModal('financialChoiceModal'),
        closeBankModal: () => closeModal('financialChoiceModal'),
        openBankConnectModal: () => openModal('bankConnectModal'),
        startBankSync: startBankFetch,
    };
    Object.entries(fns).forEach(([name, fn]) => { window[name] = fn; });

    // extra aliases used in HTML
    // wizardMode דרך getter — תמיד מחזיר את הערך העדכני מהמודול
    Object.defineProperty(window, 'wizardMode', {
        get: () => wizardMode,
        set: (v) => { wizardMode = v; },
        configurable: true
    });
    window.expandedItemIdx      = expandedItemIdx;
    window.activePage           = activePage;
    window.render               = render;
    window.updateNotificationBadge = updateNotificationBadge;
    window.syncToCloud          = syncToCloud;
    window.showUrgentAlertModal = showUrgentAlertModal;
    window.checkUrgentPayments  = checkUrgentPayments;
    window.openSmartBar         = window.openSmartBar; // set externally if needed
    window.selectListAndImport  = selectListAndImport;
    window.showPage             = showPage;
}

// ═══════════════════════════════════════════════════════════════
//  תיקון קריטי: קרא ל-_exposeAll מיד בטעינת המודול
//
//  ES modules הם תמיד deferred — הם מתחילים לרוץ רק אחרי שכל
//  ה-HTML נוצר. בלי השורה הזו, כל onclick ב-HTML לא מוצא פונקציה
//  עד שהמשתמש כבר לחץ (ואז קיבל שגיאה). _exposeAll כאן שמה
//  את כל הפונקציות על window מיד עם פרסור הקובץ.
// ═══════════════════════════════════════════════════════════════
_exposeAll();

// ============================================================
//  DOMContentLoaded — Bootstrap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Language direction
    const html = document.documentElement;
    if (currentLang === 'he') { html.setAttribute('dir','rtl'); html.setAttribute('lang','he'); }
    else { html.setAttribute('dir','ltr'); html.setAttribute('lang', currentLang); }

    // Dark mode
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');

    // קרא שוב — מעדכן window.activePage / window.expandedItemIdx אחרי טעינת state
    _exposeAll();

    // Initial render
    render();

    // Init bar position
    initBarObserver();
    initListNameBarListeners();

    // Firebase
    startFirebaseWatcher();

    // Notification system
    setTimeout(() => initNotificationSystem(), 2000);

    // SW listeners
    initServiceWorkerListener();
    setTimeout(() => checkNotificationUrlParam(), 1000);

    // GitHub token
    loadGithubToken();

    // Demo check
    checkFirstRunDemo();

    // Wizard mode button state
    const wizBtn = _n('wizardModeBtn'), wizTxt = _n('wizardBtnText');
    if (wizBtn) wizBtn.style.background = wizardMode ? 'linear-gradient(135deg,#7367f0,#9055ff)' : 'rgba(255,255,255,0.12)';
    if (wizTxt) wizTxt.textContent = wizardMode ? '🧙 כבה ויזארד' : '🧙 ויזארד';

    // Date/time field listeners
    const dueDateField     = _n('itemDueDate'),     dueTimeField     = _n('itemDueTime');
    const editDueDateField = _n('editItemDueDate'), editDueTimeField = _n('editItemDueTime');
    if (dueDateField && dueTimeField) dueDateField.addEventListener('change', function() { dueTimeField.style.display = this.value ? 'block' : 'none'; if (!this.value) dueTimeField.value = ''; });
    if (editDueDateField && editDueTimeField) editDueDateField.addEventListener('change', function() { editDueTimeField.style.display = this.value ? 'block' : 'none'; if (!this.value) editDueTimeField.value = ''; });

    // Clipboard
    initClipboardListeners();
    setTimeout(() => {
        updateNotificationBadge();
        const isFromNotif = new URLSearchParams(window.location.search).get('vplus-action');
        if (!isFromNotif) checkUrgentPayments();
        checkClipboardOnStartup();
    }, 500);

    // Plus button label
    updatePlusBtnLabel();
});

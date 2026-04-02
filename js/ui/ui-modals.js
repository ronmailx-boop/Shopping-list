// js/ui/ — extracted from ui.js
import { db, save, activePage, compactMode, listEditMode, itemEditMode, highlightedItemIndex, currentLang, demoMode, setHighlightedItemIndex } from '../core/store.js';
import { CATEGORIES, categoryTranslations, translations } from '../core/constants.js';
// ============================================================
//  ui.js  ג€”  ׳›׳ ׳׳” ׳©׳ ׳•׳’׳¢ ׳‘-DOM: render, ׳׳•׳“׳׳™׳, toast, compact
//  ׳׳™׳™׳‘׳ ׳: constants.js, store.js, services.js
//  ׳׳™׳•׳‘׳ ׳¢׳-׳™׳“׳™: app.js
// ============================================================


// ============================================================
//  Compact-mode local state (managed here)
// ============================================================
let compactMode        = localStorage.getItem('compactMode') === 'true';
let compactActionsOpen = false;
let expandedItemIdx    = -1;
let listEditMode       = false;
let itemEditMode       = false;
let compactStatsOpen   = false;

function setCompactMode(v)        { compactMode = v; }
function setExpandedItemIdx(v)    { expandedItemIdx = v; }
function setListEditMode(v)       { listEditMode = v; }
function setItemEditMode(v)       { itemEditMode = v; }

// ============================================================
//  Helpers
// ============================================================
const _n  = (id) => document.getElementById(id);
const _qs = (s)  => document.querySelector(s);

// ============================================================
//  openModal / closeModal
// ============================================================
function openModal(id) {
    const m = _n(id);
    if (!m) return;
    m.classList.add('active');

    if (id === 'inputForm') {
        _n('itemName').value     = '';
        _n('itemPrice').value    = '';
        _n('itemQty').value      = '1';
        _n('itemCategory').value = '';
        if (typeof window.initContextBar === 'function') window.initContextBar();
        const continuous = localStorage.getItem('continuousAdd') === 'true';
        const toggle     = _n('continuousToggle');
        const wrap       = _n('continuousToggleWrap');
        const btn        = _n('addItemBtn');
        if (toggle) toggle.checked = continuous;
        if (wrap)   wrap.classList.toggle('active', continuous);
        if (btn)    btn.textContent = continuous ? '׳”׳•׳¡׳£ + ׳”׳׳©׳ ג' : '׳”׳•׳¡׳£ ג“';
        const _now     = new Date();
        const _dateStr = _now.toISOString().split('T')[0];
        const _timeStr = _now.getHours().toString().padStart(2,'0') + ':' + _now.getMinutes().toString().padStart(2,'0');
        const _dd = _n('itemDueDate'); const _dt = _n('itemDueTime');
        if (_dd) _dd.value = _dateStr;
        if (_dt) _dt.value = _timeStr;
        if (typeof window.updateCategoryDropdown === 'function') window.updateCategoryDropdown();
        const itemNameInput = _n('itemName');
        if (itemNameInput) {
            itemNameInput.oninput = () => showAutocompleteSuggestions(itemNameInput.value);
            itemNameInput.onblur  = () => hideAutocompleteSuggestions();
            setTimeout(() => itemNameInput.focus(), 150);
        }
    }
    if (id === 'newListModal') {
        _n('newListNameInput').value = ''; _n('newListUrlInput').value = '';
        _n('newListBudget').value = ''; _n('newListTemplate').checked = false;
        setTimeout(() => _n('newListNameInput')?.focus(), 150);
    }
    if (id === 'editListNameModal') {
        const list = db.lists[db.currentId];
        _n('editListNameInput').value = list.name;
        _n('editListUrlInput').value  = list.url    || '';
        _n('editListBudget').value    = list.budget || '';
        setTimeout(() => _n('editListNameInput')?.focus(), 150);
    }
    if (id === 'editTotalModal')    setTimeout(() => _n('editTotalInput')?.focus(), 150);
    if (id === 'importModal')       { _n('importText').value = ''; setTimeout(() => _n('importText')?.focus(), 150); }
    if (id === 'historyModal')      renderHistory();
    if (id === 'templatesModal')    renderTemplates();
    if (id === 'categoryManagerModal') { if (typeof window.renderCustomCategoriesList === 'function') window.renderCustomCategoriesList(); }
}

function closeModal(id) {
    const m = _n(id);
    if (m) m.classList.remove('active');
}

// ============================================================
//  Toast / Notification System
// ============================================================
let _toastTimer        = null;
let _toastProgressEl   = null;
let _toastUndoCallback = null;
let _lnbToastTimer     = null;
let _lnbUndoCallback   = null;

function showNotification(message, type = 'success') {
    _showToast({ message, type });
}

function _showToast({ message, type = 'success', undoCallback = null, duration = 4000, undoLabel = null }) {
    const lnbOverlay = _n('lnbActionOverlay');
    if (activePage === 'lists' && lnbOverlay) {
        _showLnbToast({ message, type, undoCallback, duration, undoLabel });
        return;
    }
    const inner    = _n('toastInner');
    const content  = _n('toastContent');
    const iconEl   = _n('toastIcon');
    const textEl   = _n('toastText');
    const undoBtn  = _n('toastUndoBtn');
    const progress = _n('toastProgress');
    if (!inner || !content || !textEl) return;

    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
    inner.classList.remove('toast-visible');

    setTimeout(() => {
        content.className = 'toast-content';
        if      (type === 'warning') content.classList.add('toast-warning');
        else if (type === 'error')   content.classList.add('toast-error');
        else if (type === 'delete')  content.classList.add('toast-delete');
        else                         content.classList.add('toast-success');

        const icons = { success:'ג…', warning:'ג ן¸', error:'ג', delete:'נ—‘ן¸' };
        if (iconEl) iconEl.textContent = icons[type] || 'ג…';
        textEl.textContent = message.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}ג…ג ן¸גנ—‘ן¸ג“ג˜ן¸נ“‹ג­נ’¾נ₪נ“ג†©ן¸ג”ן¸ג—»ן¸]\s*/u, '');

        _toastUndoCallback = undoCallback;
        if (undoCallback) { undoBtn.style.display = ''; undoBtn.textContent = undoLabel || 'ג†© ׳‘׳™׳˜׳•׳'; }
        else               undoBtn.style.display = 'none';

        if (progress) {
            progress.style.animation = 'none';
            progress.offsetHeight;
            progress.style.animation = `toastProgress ${duration}ms linear forwards`;
        }

        inner.classList.add('toast-visible');
        _toastTimer = setTimeout(() => { inner.classList.remove('toast-visible'); _toastUndoCallback = null; }, duration);
    }, inner.classList.contains('toast-visible') ? 120 : 0);
}

function _showLnbToast({ message, type, undoCallback, duration = 4000, undoLabel }) {
    const overlay  = _n('lnbActionOverlay');
    const msgEl    = _n('lnbActionMsg');
    const undoBtn  = _n('lnbActionUndo');
    const progress = _n('lnbProgress');
    if (!overlay || !msgEl) return;

    if (typeof window.closeListActionsPanel === 'function') window.closeListActionsPanel();
    if (_lnbToastTimer) { clearTimeout(_lnbToastTimer); _lnbToastTimer = null; }

    const icons = { success:'ג…', warning:'ג ן¸', error:'ג', delete:'נ—‘ן¸' };
    const icon  = icons[type] || 'ג…';
    const text  = message.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}ג…ג ן¸גנ—‘ן¸ג“ג˜ן¸נ“‹ג­נ’¾נ₪נ“ג†©ן¸ג”ן¸ג—»ן¸]\s*/u, '');
    msgEl.innerHTML = `<span style="font-size:16px;flex-shrink:0;">${icon}</span><span>${text}</span>`;

    _lnbUndoCallback = undoCallback;
    if (undoCallback) { undoBtn.style.display = ''; undoBtn.textContent = undoLabel || 'ג†© ׳‘׳™׳˜׳•׳'; }
    else               undoBtn.style.display = 'none';

    if (progress) {
        progress.style.transition = 'none'; progress.style.width = '100%';
        progress.offsetHeight;
        progress.style.transition = `width ${duration}ms linear`; progress.style.width = '0%';
    }
    overlay.classList.add('show');
    _lnbToastTimer = setTimeout(() => { overlay.classList.remove('show'); _lnbUndoCallback = null; }, duration);
}

function handleLnbUndo() {
    if (_lnbUndoCallback) { _lnbUndoCallback(); _lnbUndoCallback = null; }
    _n('lnbActionOverlay')?.classList.remove('show');
    if (_lnbToastTimer) { clearTimeout(_lnbToastTimer); _lnbToastTimer = null; }
}

function handleToastUndo() {
    if (_toastUndoCallback) { _toastUndoCallback(); _toastUndoCallback = null; }
    _n('toastInner')?.classList.remove('toast-visible');
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
}

// ============================================================
//  Scroll helpers
// ============================================================
function scrollToListTop() {
    const container = _n('itemsContainer');
    if (container) {
        const first = container.querySelector('.item-card, .category-separator');
        if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToCheckedItems() {
    for (const sep of document.querySelectorAll('.category-separator')) {
        if (sep.textContent?.includes('׳”׳•׳©׳׳׳•')) { sep.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    for (const card of document.querySelectorAll('.item-card')) {
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb?.checked) { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    showNotification('׳׳™׳ ׳₪׳¨׳™׳˜׳™׳ ׳׳¡׳•׳׳ ׳™׳', 'warning');
}

// ============================================================
//  Autocomplete
// ============================================================
function getProductHistory() {
    const map = {};
    (db.history || []).forEach(entry => {
        (entry.items || []).forEach(item => {
            const name = item.name.trim();
            if (!map[name] || map[name].lastUsed < entry.completedAt)
                map[name] = { price: item.price, category: item.category || '', lastUsed: entry.completedAt };
        });
    });
    return map;
}

function showAutocompleteSuggestions(searchTerm) {
    const container = _n('autocompleteContainer');
    if (!container) return;
    if (!searchTerm || searchTerm.length < 2) { container.classList.remove('active'); container.innerHTML = ''; return; }

    const history    = getProductHistory();
    const searchLower = searchTerm.toLowerCase();
    const matches    = Object.entries(history)
        .filter(([name]) => name.toLowerCase().includes(searchLower))
        .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
        .slice(0, 5);

    if (matches.length === 0) { container.classList.remove('active'); container.innerHTML = ''; return; }

    container.innerHTML = matches.map(([name, data]) => `
        <div class="autocomplete-item" onclick="selectAutocompleteSuggestion('${name.replace(/'/g,"\\'")}', ${data.price}, '${data.category.replace(/'/g,"\\'")}')">
            <div>
                <div class="autocomplete-item-name">${name}</div>
                ${data.category ? `<div class="autocomplete-item-category">${data.category}</div>` : ''}
            </div>
            <div class="autocomplete-item-price">ג‚×${data.price.toFixed(2)}</div>
        </div>`).join('');
    container.classList.add('active');
}

function selectAutocompleteSuggestion(name, price, category) {
    if (_n('itemName'))     _n('itemName').value     = name;
    if (_n('itemPrice'))    _n('itemPrice').value     = price;
    if (_n('itemCategory')) _n('itemCategory').value  = category || detectCategory(name) || '';
    const container = _n('autocompleteContainer');
    if (container) { container.classList.remove('active'); container.innerHTML = ''; }
    setTimeout(() => _n('itemPrice')?.focus(), 100);
}

function hideAutocompleteSuggestions() {
    const container = _n('autocompleteContainer');
    if (container) setTimeout(() => { container.classList.remove('active'); container.innerHTML = ''; }, 200);
}

// ============================================================
//  Search
// ============================================================
function searchInList() {
    const searchTerm = _n('listSearchInput')?.value.toLowerCase().trim();
    const list = db.lists[db.currentId];
    if (!searchTerm) { setHighlightedItemIndex(null); render(); return; }
    const matches = (list.items || []).map((item, idx) => ({ item, idx, match: item.name.toLowerCase().includes(searchTerm) })).filter(m => m.match);
    if (matches.length === 0) { showNotification('׳׳ ׳ ׳׳¦׳ ׳׳•׳¦׳¨', 'warning'); return; }
    setHighlightedItemIndex(matches[0].idx);
    render();
    setTimeout(() => { document.querySelector(`[data-id="${matches[0].idx}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function clearListSearch() { if (_n('listSearchInput')) _n('listSearchInput').value = ''; setHighlightedItemIndex(null); render(); }

function searchInSummary() {
    const searchTerm = (_n('listSearchInput') || _n('searchInput'))?.value.toLowerCase().trim();
    if (!searchTerm) { setHighlightedListId(null); render(); return; }
    const match = Object.keys(db.lists).find(id => {
        const l = db.lists[id];
        return l.name.toLowerCase().includes(searchTerm) || l.url?.toLowerCase().includes(searchTerm) || l.items.some(i => i.name.toLowerCase().includes(searchTerm));
    });
    setHighlightedListId(match || null);
    render();
    if (match) setTimeout(() => { document.querySelector(`[data-id="${match}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

// ============================================================
//  generateItemMetadataHTML
// ============================================================
function generateItemMetadataHTML(item, idx) {
    let html = '';

    if (item.dueDate && (item.reminderValue || (item.nextAlertTime && item.nextAlertTime > Date.now()))) {
        const today   = new Date(); today.setHours(0,0,0,0);
        const dueDate = new Date(item.dueDate); dueDate.setHours(0,0,0,0);
        const diffDays = Math.ceil((dueDate - today) / 86400000);
        let dateClass = 'item-duedate-display';
        let dateText  = new Date(item.dueDate).toLocaleDateString('he-IL');
        if (item.dueTime) dateText += ` ג° ${item.dueTime}`;
        if (diffDays < 0 && !item.checked && !item.isPaid)          { dateClass += ' overdue'; dateText += ' (׳¢׳‘׳¨!)'; }
        else if (diffDays >= 0 && diffDays <= 3 && !item.checked && !item.isPaid) dateClass += ' soon';

        let reminderInfo = '';
        const now = Date.now();
        if (item.nextAlertTime && item.nextAlertTime > now) {
            const snDate   = new Date(item.nextAlertTime);
            const sh = snDate.getHours().toString().padStart(2,'0');
            const sm = snDate.getMinutes().toString().padStart(2,'0');
            const msLeft   = item.nextAlertTime - now;
            const minsLeft = Math.round(msLeft / 60000);
            const timeLeftText = minsLeft < 60 ? `׳‘׳¢׳•׳“ ${minsLeft} ׳“׳§׳•׳×` : `׳‘׳¢׳•׳“ ${Math.floor(minsLeft/60)}׳©' ${minsLeft%60}׳“'`;
            reminderInfo = ` נ”” ׳”׳×׳¨׳׳” ${timeLeftText}, ׳‘-${sh}:${sm}`;
        } else if (item.reminderValue && item.reminderUnit) {
            const timeStr   = item.dueTime || '09:00';
            const dueDateObj = new Date(item.dueDate + 'T' + timeStr + ':00');
            const reminderMs = getReminderMilliseconds(item.reminderValue, item.reminderUnit);
            const reminderTime = new Date(dueDateObj.getTime() - reminderMs);
            const rh = reminderTime.getHours().toString().padStart(2,'0');
            const rm = reminderTime.getMinutes().toString().padStart(2,'0');
            reminderInfo = ` נ”” ׳”׳×׳¨׳׳” ׳‘׳¢׳•׳“ ${formatReminderText(item.reminderValue, item.reminderUnit)} ׳‘-${rh}:${rm}`;
        }
        html += `<div style="display:flex;align-items:center;gap:8px;"><div class="${dateClass}">נ“… ${dateText}${reminderInfo}</div></div>`;
    }

    if (item.paymentUrl?.trim()) {
        html += `<div style="display:inline-flex;align-items:center;gap:6px;margin-top:4px;">
            <a href="${item.paymentUrl}" target="_blank" onclick="event.stopPropagation();" style="color:#6366f1;text-decoration:none;display:flex;align-items:center;" title="׳₪׳×׳— ׳§׳™׳©׳•׳¨">
                <svg style="width:18px;height:18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
            </a></div>`;
    }
    if (item.note?.trim())  html += `<div class="item-notes-display">נ“ ${item.note}</div>`;
    if (item.isPaid)        html += `<div class="item-paid-badge">ג“ ׳©׳•׳׳</div>`;
    return html;
}

// ============================================================
//  _buildItemCard ג€” helper to build item card HTML
// ============================================================
function _buildItemCard(item, idx, total, paid, isHighlighted) {
    const sub = item.price * item.qty;
    const catColor    = CATEGORIES[item.category] || '#6b7280';
    const catBadge    = item.category ? `<span class="category-badge" onclick="event.stopPropagation();openEditCategoryModal(${idx})" style="background:${catColor}20;color:${catColor};cursor:pointer;">${item.category}</span>` : '';
    const metaHTML    = generateItemMetadataHTML(item, idx);
    const div         = document.createElement('div');
    div.className     = 'item-card';
    div.setAttribute('data-id', idx);
    div.dataset.idx   = idx;
    if (isHighlighted) {
        div.style.background  = 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)';
        div.style.border      = '3px solid #f59e0b';
        div.style.boxShadow   = '0 8px 20px rgba(245,158,11,0.3)';
    }

    if (compactMode) {
        const isExpanded = expandedItemIdx === idx;
        if (isExpanded) {
            div.style.padding = '15px'; div.style.borderRadius = '20px';
            div.innerHTML = `
                <div style="display:flex;justify-content:flex-start;margin-bottom:6px;">
                    <button onclick="expandedItemIdx=-1;render();" style="background:rgba(115,103,240,0.08);border:none;border-radius:99px;padding:3px 12px;font-size:12px;font-weight:800;color:#7367f0;cursor:pointer;font-family:inherit;">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 8L6 4L10 8" stroke="#7367f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> ׳›׳•׳•׳¥
                    </button>
                </div>
                ${_fullCardHTML(item, idx, sub, catBadge, metaHTML, true)}`;
        } else {
            div.style.padding = '10px 14px';
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
                        <div class="item-drag-handle" data-drag="true" style="display:${itemEditMode?'flex':'none'};align-items:center;justify-content:center;width:26px;height:26px;flex-shrink:0;cursor:grab;color:#a89fff;touch-action:none;">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="pointer-events:none"><rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor"/></svg>
                        </div>
                        <input type="checkbox" ${item.checked?'checked':''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600" style="flex-shrink:0;" onclick="event.stopPropagation()">
                        <span class="font-bold ${item.checked?'line-through text-gray-300':''}" style="font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;">
                            <span class="item-number">${idx+1}.</span> ${item.name}
                        </span>
                    </div>
                    ${item.isGeneralNote ? '' : `<span class="font-black text-indigo-600" style="font-size:15px;flex-shrink:0;">ג‚×${sub.toFixed(2)}</span>`}
                </div>`;
            div.onclick = (e) => { if (e.target.closest('input[type=checkbox],[data-drag]')) return; expandedItemIdx = idx; render(); };
        }
    } else {
        div.innerHTML = _fullCardHTML(item, idx, sub, catBadge, metaHTML, false);
    }
    return { div, sub };
}

function _fullCardHTML(item, idx, sub, catBadge, metaHTML, compact) {
    const num = compact ? `${idx+1}.` : `${idx+1}.`;
    return `
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3 flex-1">
                <input type="checkbox" ${item.checked?'checked':''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                <div class="flex-1">
                    <div class="text-2xl font-bold ${item.checked?'line-through text-gray-300':''}" onclick="openEditItemNameModal(${idx})" style="cursor:pointer;">
                        <span class="item-number">${num}</span> ${item.name}
                    </div>
                    ${catBadge}${metaHTML}
                </div>
            </div>
            <div class="flex items-center gap-2">
                <div class="note-icon ${item.note?'has-note':''}" onclick="openItemNoteModal(${idx})" title="${item.note?'׳™׳© ׳”׳¢׳¨׳”':'׳”׳•׳¡׳£ ׳”׳¢׳¨׳”'}">
                    <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </div>
                <button onclick="removeItem(${idx})" class="trash-btn">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="flex justify-between items-center">
            ${item.isGeneralNote ? '' : `
            <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                <button onclick="changeQty(${idx},1)" class="text-green-500 text-2xl font-bold">+</button>
                <span class="font-bold w-6 text-center">${item.qty}</span>
                <button onclick="changeQty(${idx},-1)" class="text-red-500 text-2xl font-bold">-</button>
            </div>
            <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600" style="cursor:pointer;">ג‚×${sub.toFixed(2)}</span>
            `}
        </div>`;
}

// ============================================================
//  render()
// ============================================================
function render() {
    // Tab styles
    const _tabStats = _n('tabStats'); const _tabBank = _n('tabBank');
    const _act = 'flex:1;height:34px;background:white;border:none;border-radius:12px;font-size:14px;font-weight:900;color:#7367f0;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.12);';
    const _inact = 'flex:1;height:34px;background:transparent;border:none;font-size:14px;font-weight:800;color:rgba(255,255,255,0.6);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;';
    if (_tabStats) _tabStats.style.cssText = activePage === 'stats' ? _act : _inact;
    if (_tabBank)  _tabBank.style.cssText  = activePage === 'bank'  ? _act : _inact;
    if (typeof window.updateSvgTabs === 'function') window.updateSvgTabs(activePage);

    // Voice buttons
    const _vb = _n('voiceBoughtBtn'); const _vt = _n('voiceTobuyBtn');
    if (_vb) _vb.style.display = activePage === 'lists' ? '' : 'none';
    if (_vt) _vt.style.display = activePage === 'lists' ? '' : 'none';

    // Lock button
    const lockBtn  = _n('mainLockBtn'); const lockPath = _n('lockIconPath'); const tag = _n('statusTag');
    if (lockBtn)  lockBtn.style.background = isLocked ? 'rgba(255,255,255,0.13)' : 'rgba(249,115,22,0.25)';
    if (lockPath) lockPath.setAttribute('d', isLocked
        ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
        : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    if (tag) tag.innerText = isLocked ? t('locked') : t('unlocked');

    let total = 0, paid = 0;
    const container = _n(activePage === 'lists' ? 'itemsContainer' : activePage === 'summary' ? 'summaryContainer' : null);

    // ג”€ג”€ Page: lists ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
    if (activePage === 'lists') {
        _n('pageLists')?.classList.remove('hidden');
        _n('pageSummary')?.classList.add('hidden');
        _n('pageStats')?.classList.add('hidden');
        const _pb = _n('pageBank'); if (_pb) _pb.classList.add('hidden');

        const list = db.lists[db.currentId] || { name: '׳¨׳©׳™׳׳”', items: [] };
        if (_n('listNameDisplay'))  _n('listNameDisplay').innerText  = list.name;
        if (_n('itemCountDisplay')) _n('itemCountDisplay').innerText = `${list.items.length} ${t('items')}`;
        setTimeout(adjustContentPadding, 50);

        if (container) {
            container.innerHTML = '';
            const csText = _n('categorySortText');
            if (csText) {
                csText.textContent = 'נ”₪ ׳׳™׳•׳';
                const pill = _n('categorySortPill');
                if (pill) { pill.style.background = categorySortEnabled ? '#7367f0' : ''; pill.style.color = categorySortEnabled ? 'white' : ''; pill.style.borderColor = categorySortEnabled ? '#7367f0' : ''; }
            }

            if (categorySortEnabled) {
                const defaultOrder = ['׳₪׳™׳¨׳•׳× ׳•׳™׳¨׳§׳•׳×','׳‘׳©׳¨ ׳•׳“׳’׳™׳','׳—׳׳‘ ׳•׳‘׳™׳¦׳™׳','׳׳—׳ ׳•׳׳׳₪׳™׳','׳©׳™׳׳•׳¨׳™׳','׳—׳˜׳™׳₪׳™׳','׳׳©׳§׳׳•׳×','׳ ׳™׳§׳™׳•׳','׳”׳™׳’׳™׳™׳ ׳”'];
                const allCats      = new Set(list.items.map(i => i.category || '׳›׳׳׳™'));
                const custom       = Array.from(allCats).filter(c => !defaultOrder.includes(c) && c !== '׳׳—׳¨' && c !== '׳›׳׳׳™');
                const catOrder     = [...defaultOrder, ...custom, '׳׳—׳¨', '׳›׳׳׳™'];

                const unchecked = list.items.filter(i => !i.checked);
                const checked   = list.items.filter(i =>  i.checked);

                const group = (items) => {
                    const m = {};
                    items.forEach(item => { const c = item.category || '׳›׳׳׳™'; (m[c] = m[c] || []).push({ item, idx: list.items.indexOf(item) }); });
                    return m;
                };

                const uncheckedMap = group(unchecked);
                const checkedMap   = group(checked);
                let itemNumber = 1;

                catOrder.forEach(cat => {
                    if (!uncheckedMap[cat]?.length) return;
                    const hdr = document.createElement('div');
                    hdr.className = 'category-separator';
                    hdr.style.background = `linear-gradient(135deg,${CATEGORIES[cat] || '#6b7280'} 0%,${CATEGORIES[cat] || '#6b7280'}dd 100%)`;
                    hdr.innerHTML = `<div class="text-lg font-black">${cat} (${uncheckedMap[cat].length})</div>`;
                    container.appendChild(hdr);
                    uncheckedMap[cat].forEach(({ item, idx }) => {
                        const sub = item.price * item.qty; total += sub;
                        const { div } = _buildItemCard(item, idx, total, paid, highlightedItemIndex === idx);
                        container.appendChild(div); itemNumber++;
                    });
                });

                if (checked.length > 0) {
                    const hdr = document.createElement('div');
                    hdr.className = 'category-separator';
                    hdr.style.background = 'linear-gradient(135deg,#10b981 0%,#059669 100%)';
                    hdr.innerHTML = `<div class="text-lg font-black">ג… ׳”׳•׳©׳׳׳• (${checked.length})</div>`;
                    container.appendChild(hdr);
                    catOrder.forEach(cat => {
                        (checkedMap[cat] || []).forEach(({ item, idx }) => {
                            const sub = item.price * item.qty; total += sub; paid += sub;
                            const { div } = _buildItemCard(item, idx, total, paid, highlightedItemIndex === idx);
                            container.appendChild(div); itemNumber++;
                        });
                    });
                }
            } else {
                // Manual sort
                list.items.forEach((item, idx) => {
                    const sub = item.price * item.qty; total += sub;
                    if (item.checked) paid += sub;
                    const { div } = _buildItemCard(item, idx, total, paid, highlightedItemIndex === idx);
                    container.appendChild(div);
                });
            }

            if (itemEditMode) setupItemDrag();

            if (highlightedItemIndex !== null) {
                const rem = () => { setHighlightedItemIndex(null); container.removeEventListener('scroll', rem); window.removeEventListener('scroll', rem); render(); };
                container.addEventListener('scroll', rem, { once: true });
                window.addEventListener('scroll', rem, { once: true });
            }
        }

        const bw = _n('budgetWarning');
        const list2 = db.lists[db.currentId];
        if (bw && list2?.budget > 0 && total > list2.budget) { bw.innerHTML = `ג ן¸ ׳—׳¨׳™׳’׳” ׳׳×׳§׳¦׳™׳‘: ג‚×${(total - list2.budget).toFixed(2)}`; bw.classList.remove('hidden'); }
        else if (bw) bw.classList.add('hidden');

    // ג”€ג”€ Page: summary ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
    } else if (activePage === 'summary') {
        _n('pageLists')?.classList.add('hidden');
        _n('pageSummary')?.classList.remove('hidden');
        _n('pageStats')?.classList.add('hidden');
        const _pb2 = _n('pageBank'); if (_pb2) _pb2.classList.add('hidden');
        if (_n('listNameDisplay'))  _n('listNameDisplay').innerText  = '׳”׳¨׳©׳™׳׳•׳× ׳©׳׳™';
        if (_n('itemCountDisplay')) _n('itemCountDisplay').innerText = `${Object.keys(db.lists).length} ׳¨׳©׳™׳׳•׳×`;
        setTimeout(adjustContentPadding, 50);

        if (container) {
            container.innerHTML = '';
            const searchInput = _n('listSearchInput') || _n('searchInput');
            const searchTerm  = searchInput?.value.toLowerCase() || '';

            Object.keys(db.lists).forEach(id => {
                const l = db.lists[id];
                if (searchTerm) {
                    const ok = l.name.toLowerCase().includes(searchTerm) || l.url?.toLowerCase().includes(searchTerm) || l.items.some(i => i.name.toLowerCase().includes(searchTerm));
                    if (!ok) return;
                }
                let lT = 0, lP = 0;
                (l.items || []).forEach(i => { const s = i.price*i.qty; lT += s; if (i.checked) lP += s; });
                const isSel = db.selectedInSummary.includes(id);
                if (isSel) { total += lT; paid += lP; }

                const tplBadge = l.isTemplate ? '<span class="template-badge">׳×׳‘׳ ׳™׳×</span>' : '';
                const isHL     = highlightedListId === id;
                const div      = document.createElement('div');
                div.className  = 'item-card';
                div.dataset.id = id;
                if (isHL) { div.style.background = 'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)'; div.style.border = '3px solid #0ea5e9'; div.style.boxShadow = '0 8px 20px rgba(14,165,233,0.3)'; }
                else       div.style.border = '2px solid #7367f0';

                const webBtn = l.url ? `<button onclick="window.location.href='${l.url.startsWith('http')?l.url:'https://'+l.url}'" class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm ml-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg></button>` : '';

                if (compactMode) {
                    div.style.padding = '10px 14px';
                    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                        <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
                            <div class="list-drag-handle" data-drag="true" style="display:${listEditMode?'flex':'none'};align-items:center;justify-content:center;width:26px;height:26px;flex-shrink:0;cursor:grab;color:#a89fff;touch-action:none;"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="pointer-events:none"><rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor"/></svg></div>
                            <input type="checkbox" ${isSel?'checked':''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600" style="flex-shrink:0;">
                            <span class="font-bold cursor-pointer" style="font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" onclick="selectListAndImport('${id}');showPage('lists')">${tplBadge}${l.name}</span>
                        </div>
                        <span class="font-black text-indigo-600" style="font-size:15px;flex-shrink:0;">ג‚×${lT.toFixed(2)}</span>
                    </div>`;
                } else {
                    div.innerHTML = `<div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-3 flex-1">
                            <input type="checkbox" ${isSel?'checked':''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                            <div class="flex-1 text-2xl font-bold cursor-pointer" onclick="selectListAndImport('${id}');showPage('lists')">${tplBadge}${l.name}</div>
                        </div>
                        <div class="flex items-center">${webBtn}<button onclick="prepareDeleteList('${id}')" class="trash-btn"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">${l.items.length} ${t('items')}</div>
                        <span class="text-2xl font-black text-indigo-600">ג‚×${lT.toFixed(2)}</span>
                    </div>`;
                }
                container.appendChild(div);
            });

            if (listEditMode) setupListDrag();
            if (highlightedListId !== null) {
                const rem = () => { setHighlightedListId(null); container.removeEventListener('scroll', rem); window.removeEventListener('scroll', rem); render(); };
                container.addEventListener('scroll', rem, { once: true });
                window.addEventListener('scroll', rem, { once: true });
            }
        }

    // ג”€ג”€ Page: stats ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
    } else if (activePage === 'stats') {
        _n('pageLists')?.classList.add('hidden');
        _n('pageSummary')?.classList.add('hidden');
        _n('pageStats')?.classList.remove('hidden');
        const _pb3 = _n('pageBank'); if (_pb3) _pb3.classList.add('hidden');
        renderStats();

    // ג”€ג”€ Page: bank ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
    } else if (activePage === 'bank') {
        _n('pageLists')?.classList.add('hidden');
        _n('pageSummary')?.classList.add('hidden');
        _n('pageStats')?.classList.add('hidden');
        const _pb4 = _n('pageBank'); if (_pb4) _pb4.classList.remove('hidden');
        renderBankData();
    }

    if (activePage !== 'bank') { const _pb5 = _n('pageBank'); if (_pb5) _pb5.classList.add('hidden'); }

    if (_n('displayTotal')) _n('displayTotal').innerText = total.toFixed(2);
    if (_n('displayPaid'))  _n('displayPaid').innerText  = paid.toFixed(2);
    if (_n('displayLeft'))  _n('displayLeft').innerText  = (total - paid).toFixed(2);

    initSortable();
}

// ============================================================
//  adjustContentPadding
// ============================================================
function adjustContentPadding() {
    const bar    = _n('listNameBar');
    const spacer = _n('barSpacer');
    if (bar && spacer) {
        const rect  = bar.getBoundingClientRect();
        spacer.style.height = (rect.bottom + 8) + 'px';
        document.documentElement.style.setProperty('--lnb-height', rect.height + 'px');
    }
}

// ============================================================
//  initSortable (SortableJS)
// ============================================================
function initSortable() {
    const el = _n(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (sortableInstance) { sortableInstance.destroy(); setSortableInstance(null); }
    if (el && !isLocked && typeof window.Sortable !== 'undefined') {
        const inst = window.Sortable.create(el, {
            animation: 150,
            onEnd: function () {
                if (activePage === 'lists') {
                    const newOrder = Array.from(el.children).map(c => parseInt(c.getAttribute('data-id')));
                    const items = db.lists[db.currentId].items;
                    db.lists[db.currentId].items = newOrder.map(i => items[i]);
                } else {
                    const newOrder = Array.from(el.children).map(c => c.getAttribute('data-id'));
                    const nL = {};
                    newOrder.forEach(id => nL[id] = db.lists[id]);
                    db.lists = nL;
                }
                save();
            }
        });
        setSortableInstance(inst);
    }
}

// ============================================================
//  Stats
// ============================================================
let _statsMonthOffset = 0;

function navigateMonth(dir) { _statsMonthOffset += dir; if (_statsMonthOffset > 0) _statsMonthOffset = 0; renderStats(); }
function getSelectedMonthKey() {
    const d = new Date(); d.setMonth(d.getMonth() + _statsMonthOffset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function getMonthLabel(key) {
    const MONTHS = ['׳™׳ ׳•׳׳¨','׳₪׳‘׳¨׳•׳׳¨','׳׳¨׳¥','׳׳₪׳¨׳™׳','׳׳׳™','׳™׳•׳ ׳™','׳™׳•׳׳™','׳׳•׳’׳•׳¡׳˜','׳¡׳₪׳˜׳׳‘׳¨','׳׳•׳§׳˜׳•׳‘׳¨','׳ ׳•׳‘׳׳‘׳¨','׳“׳¦׳׳‘׳¨'];
    const [y, m] = key.split('-');
    return `${MONTHS[parseInt(m)-1]} ${y}`;
}

function renderStats() {
    const monthKey     = getSelectedMonthKey();
    const monthlyData  = db.stats?.monthlyData || {};
    const monthlyTotal = monthlyData[monthKey] || 0;

    const labelEl = _n('currentMonthLabel'); if (labelEl) labelEl.textContent = getMonthLabel(monthKey);

    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() + _statsMonthOffset - 1, 1);
    const prevKey  = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`;
    const prevTotal = monthlyData[prevKey] || 0;
    const vsEl = _n('currentMonthVsPrev');
    if (vsEl) {
        if (prevTotal > 0) {
            const diff = monthlyTotal - prevTotal;
            const pct  = Math.abs(Math.round((diff/prevTotal)*100));
            const arrow = diff >= 0 ? 'ג–²' : 'ג–¼';
            const color = diff >= 0 ? '#ef4444' : '#22c55e';
            vsEl.innerHTML = `<span style="color:${color};">${arrow} ${pct}% ׳׳¢׳•׳׳× ${getMonthLabel(prevKey)}</span>`;
        } else { vsEl.textContent = ''; }
    }

    const nextBtn = _n('nextMonthBtn'); if (nextBtn) nextBtn.style.opacity = _statsMonthOffset >= 0 ? '0.3' : '1';
    if (_n('monthlyTotal'))    _n('monthlyTotal').innerText   = `ג‚×${monthlyTotal.toFixed(2)}`;

    const completedThisMonth = (db.history || []).filter(e => {
        const d = new Date(e.completedAt);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === monthKey;
    }).length;
    if (_n('completedLists')) _n('completedLists').innerText = completedThisMonth;
    const avg = completedThisMonth > 0 ? monthlyTotal / completedThisMonth : 0;
    if (_n('avgPerList')) _n('avgPerList').innerText = `ג‚×${avg.toFixed(0)}`;
    const prog = Math.min((monthlyTotal/5000)*100, 100);
    if (_n('monthlyProgress')) _n('monthlyProgress').style.width = `${prog}%`;

    renderMonthlyChart();
    renderCategoryDoughnutChart();
    renderPopularItems();
}

function renderMonthlyChart() {
    const ctx = _n('monthlyChart');
    if (!ctx || typeof window.Chart === 'undefined') return;
    if (window._monthlyChart) { window._monthlyChart.destroy(); window._monthlyChart = null; }

    const monthlyData = db.stats?.monthlyData || {};
    const MONTHS_HE   = ['׳™׳ ׳•','׳₪׳‘׳¨','׳׳¨׳¥','׳׳₪׳¨','׳׳׳™','׳™׳•׳ ׳™','׳™׳•׳׳™','׳׳•׳’','׳¡׳₪׳˜','׳׳•׳§','׳ ׳•׳‘','׳“׳¦׳'];
    const now = new Date();
    const labels = [], values = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        labels.push(MONTHS_HE[d.getMonth()]);
        values.push(monthlyData[k] || 0);
    }

    window._monthlyChart = new window.Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: '׳”׳•׳¦׳׳•׳×', data: values, backgroundColor: 'rgba(115,103,240,0.7)', borderRadius: 8 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function renderCategoryDoughnutChart() {
    const ctx = _n('categoryChart');
    if (!ctx || typeof window.Chart === 'undefined') return;
    if (window._categoryChart) { window._categoryChart.destroy(); window._categoryChart = null; }

    const totals = {};
    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked) {
                const cat = item.category || '׳׳—׳¨';
                totals[cat] = (totals[cat] || 0) + (item.price * item.qty);
            }
        });
    });

    const labels = Object.keys(totals);
    const values = Object.values(totals);
    const colors = labels.map(l => CATEGORIES[l] || '#6b7280');

    if (labels.length === 0) return;

    window._categoryChart = new window.Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    renderCategoryBreakdown(totals);
}

function renderCategoryBreakdown(totals) {
    const container = _n('categoryBreakdown');
    if (!container) return;
    container.innerHTML = '';
    const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]);
    const grandTotal = sorted.reduce((s,[,v]) => s+v, 0);
    sorted.forEach(([cat, amount]) => {
        const pct = grandTotal > 0 ? Math.round((amount/grandTotal)*100) : 0;
        const color = CATEGORIES[cat] || '#6b7280';
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
        div.innerHTML = `<span style="font-weight:700;color:${color};">${cat}</span><span style="font-weight:900;color:#1e1b4b;">ג‚×${amount.toFixed(2)} (${pct}%)</span>`;
        container.appendChild(div);
    });
}

function renderPopularItems() {
    const container = _n('popularItemsList');
    if (!container) return;
    const counts = {};
    (db.history || []).forEach(entry => {
        (entry.items || []).forEach(item => { counts[item.name] = (counts[item.name] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);
    container.innerHTML = sorted.map(([name, count], i) =>
        `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;">
            <span>${i+1}. ${name}</span><span style="color:#7367f0;font-weight:700;">${count}x</span>
        </div>`).join('') || '<div style="color:#9ca3af;text-align:center;padding:20px;">׳׳™׳ ׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳¢׳“׳™׳™׳</div>';
}

function renderBankData() {
    const container = _n('bankDataContainer');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-gray-400 py-10 bg-white rounded-3xl shadow-sm border border-gray-100"><span class="text-5xl block mb-4">נ¦</span><p class="font-medium">׳”׳©׳×׳׳© ׳‘׳›׳₪׳×׳•׳¨ ׳₪׳™׳ ׳ ׳¡׳™ ׳׳©׳׳™׳₪׳× ׳ ׳×׳•׳ ׳™׳.</p></div>';
}

// ============================================================
//  Notification Badge & Center
// ============================================================
function getDismissedNotifications() { return JSON.parse(localStorage.getItem('vplus_dismissed_notifs') || '[]'); }
function saveDismissedNotifications(arr) { localStorage.setItem('vplus_dismissed_notifs', JSON.stringify(arr)); }
function makeNotifKey(listId, itemIdx, dueDateMs) { return `${listId}_${itemIdx}_${dueDateMs}`; }

function getNotificationItems() {
    const dismissed = getDismissedNotifications();
    const items = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    Object.entries(db.lists || {}).forEach(([listId, list]) => {
        (list.items || []).forEach((item, itemIdx) => {
            if (!item.dueDate || item.checked || item.isPaid) return;
            const dueDate = new Date(item.dueDate); dueDate.setHours(0,0,0,0);
            const dueDateMs = dueDate.getTime();
            const key = makeNotifKey(listId, itemIdx, dueDateMs);
            if (dismissed.includes(key)) return;

            const isOverdue   = dueDate < today;
            const isToday     = dueDate.getTime() === today.getTime();
            const isTomorrow  = dueDate.getTime() === tomorrow.getTime();
            const isUpcoming  = !isOverdue && !isToday && item.nextAlertTime && item.nextAlertTime <= Date.now();

            if (isOverdue || isToday || isTomorrow || isUpcoming) {
                items.push({ listId, itemIdx, listName: list.name, item, dueDateMs, dueDate: dueDate.getTime(), isOverdue, isToday, isTomorrow, isUpcoming, reminderValue: item.reminderValue, reminderUnit: item.reminderUnit });
            }
        });
    });
    return items;
}

function updateNotificationBadge() {
    const badge = _n('notificationBadge');
    if (!badge) return;
    const count = getNotificationItems().length;
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function dismissNotification(listId, itemIdx, dueDateMs, e) {
    if (e) e.stopPropagation();
    const key = makeNotifKey(listId, itemIdx, dueDateMs);
    const dismissed = getDismissedNotifications();
    if (!dismissed.includes(key)) dismissed.push(key);
    saveDismissedNotifications(dismissed);
    updateNotificationBadge();
    const items = getNotificationItems();
    const btn = _n('clearAllNotifsBtn'); if (btn) btn.style.display = items.length > 0 ? 'flex' : 'none';
    const hint = _n('ncSwipeHint'); if (hint) hint.style.display = items.length > 0 ? 'block' : 'none';
    if (items.length === 0) {
        const cont = _n('notificationsList');
        if (cont) cont.innerHTML = `<div style="text-align:center;padding:40px 20px;"><div style="font-size:3rem;margin-bottom:12px;">נ‰</div><div style="color:#7367f0;font-weight:700;">׳׳™׳ ׳”׳×׳¨׳׳•׳× ׳›׳¨׳’׳¢</div></div>`;
    }
}

function dismissAllNotifications() {
    const items = getNotificationItems();
    const dismissed = getDismissedNotifications();
    items.forEach(n => { const k = makeNotifKey(n.listId, n.itemIdx, n.dueDateMs); if (!dismissed.includes(k)) dismissed.push(k); });
    saveDismissedNotifications(dismissed);
    updateNotificationBadge();
    openNotificationCenter();
}

function openNotificationCenter() {
    if (typeof window._wizForceClose === 'function') window._wizForceClose();
    const notifItems  = getNotificationItems();
    const container   = _n('notificationsList');
    const clearAllBtn = _n('clearAllNotifsBtn');
    const swipeHint   = _n('ncSwipeHint');
    if (clearAllBtn) clearAllBtn.style.display = notifItems.length > 0 ? 'flex' : 'none';

    const emptyHTML = `<div style="text-align:center;padding:40px 20px;"><div style="font-size:3rem;margin-bottom:12px;">נ‰</div><div style="color:#7367f0;font-weight:700;font-size:1rem;">׳׳™׳ ׳”׳×׳¨׳׳•׳× ׳›׳¨׳’׳¢</div><div style="color:#c4b5fd;font-size:0.82rem;margin-top:6px;">׳”׳›׳ ׳×׳—׳× ׳©׳׳™׳˜׳”!</div></div>`;

    if (!container) { openModal('notificationCenterModal'); return; }
    if (notifItems.length === 0) {
        if (swipeHint) swipeHint.style.display = 'none';
        container.innerHTML = emptyHTML;
    } else {
        if (swipeHint) swipeHint.style.display = 'block';
        container.innerHTML = '';
        const today = new Date(); today.setHours(0,0,0,0);
        notifItems.forEach(notif => {
            const wrap = document.createElement('div');
            wrap.className = 'nc-card-wrap';
            wrap.innerHTML = `<div class="nc-swipe-bg left-swipe">נ—‘ן¸ ׳׳—׳§</div><div class="nc-swipe-bg right-swipe">נ—‘ן¸ ׳׳—׳§</div>`;

            let notifClass = 'soon';
            if (notif.isOverdue) notifClass = 'overdue';
            else if (notif.isUpcoming && !notif.isToday) notifClass = 'upcoming';

            let dateText = '';
            if (notif.isOverdue) {
                const d = Math.floor((new Date().setHours(0,0,0,0) - notif.dueDate) / 86400000);
                dateText = `ג ן¸ ׳׳™׳—׳•׳¨ ${d} ${d === 1 ? '׳™׳•׳' : '׳™׳׳™׳'}`;
            } else if (notif.isToday)    dateText = 'נ“… ׳”׳™׳•׳!';
            else if (notif.isTomorrow)   dateText = 'נ“… ׳׳—׳¨';
            else {
                const d = Math.floor((notif.dueDate - new Date().setHours(0,0,0,0)) / 86400000);
                dateText = notif.reminderValue && notif.reminderUnit
                    ? `נ”” ׳×׳–׳›׳•׳¨׳× ${formatReminderText(notif.reminderValue, notif.reminderUnit)} ׳׳₪׳ ׳™ ג€” ׳‘׳¢׳•׳“ ${d} ${d===1?'׳™׳•׳':'׳™׳׳™׳'}`
                    : `נ“… ׳‘׳¢׳•׳“ ${d} ${d===1?'׳™׳•׳':'׳™׳׳™׳'}`;
            }

            const card = document.createElement('div');
            card.className = `notification-item ${notifClass}`;
            card.innerHTML = `<div class="notification-item-title">${notif.item.name}</div><div class="notification-item-date">${dateText}</div><div class="notification-item-list">נ“‹ ${notif.listName}</div>`;
            card.addEventListener('click', () => jumpToItem(notif.listId, notif.itemIdx));
            wrap.appendChild(card);
            container.appendChild(wrap);
            _attachSwipeDismiss(wrap, card, notif);
        });
    }
    openModal('notificationCenterModal');
}

function _attachSwipeDismiss(wrap, card, notif) {
    let startX = 0, curX = 0, isDragging = false;
    const THRESHOLD = 80;

    const onStart = (x) => { startX = x; isDragging = true; card.style.transition = 'none'; };
    const onMove  = (x) => {
        if (!isDragging) return;
        curX = x - startX;
        card.style.transform = `translateX(${curX}px)`;
        card.style.opacity = String(1 - Math.abs(curX) / 200);
    };
    const onEnd = () => {
        if (!isDragging) return; isDragging = false;
        card.style.transition = 'transform 0.2s, opacity 0.2s';
        if (Math.abs(curX) > THRESHOLD) {
            card.style.transform = `translateX(${curX > 0 ? 300 : -300}px)`;
            card.style.opacity = '0';
            setTimeout(() => { dismissNotification(notif.listId, notif.itemIdx, notif.dueDateMs); wrap.remove(); }, 200);
        } else { card.style.transform = 'translateX(0)'; card.style.opacity = '1'; }
        curX = 0;
    };

    card.addEventListener('touchstart',  (e) => onStart(e.touches[0].clientX),  { passive: true });
    card.addEventListener('touchmove',   (e) => onMove(e.touches[0].clientX),   { passive: true });
    card.addEventListener('touchend',    () => onEnd());
    card.addEventListener('mousedown',   (e) => onStart(e.clientX));
    document.addEventListener('mousemove', (e) => { if (isDragging) onMove(e.clientX); });
    document.addEventListener('mouseup',   () => { if (isDragging) onEnd(); });
}

function jumpToItem(listId, itemIdx) {
    if (typeof window.tapTab === 'function') window.tapTab('lists');
    db.currentId = listId;
    setHighlightedItemIndex(itemIdx);
    if (typeof window.showPage === 'function') window.showPage('lists');
    else render();
    closeModal('notificationCenterModal');
    setTimeout(() => { document.querySelector(`[data-id="${itemIdx}"]`)?.scrollIntoView({ behavior:'smooth', block:'center' }); }, 300);
}

function showUrgentAlertModal(urgentItems) {
    const modal     = _n('urgentAlertModal');
    const itemsList = _n('urgentItemsList');
    if (!modal || !itemsList) return;

    const today = new Date(); today.setHours(0,0,0,0);
    const overdue  = urgentItems.filter(i => { const d = new Date(i.dueDate); d.setHours(0,0,0,0); return d < today; });
    const upcoming = urgentItems.filter(i => { const d = new Date(i.dueDate); d.setHours(0,0,0,0); return d >= today; });

    let html = '';
    const card = (item, color) => {
        const esc = (item.name || '').replace(/'/g,"\'");
        return `<div class="urgent-item" style="border-right:3px solid ${color};cursor:pointer;" onclick="goToItemFromAlert('${esc}')">
            <div class="urgent-item-name">${item.name}</div>
            <div class="urgent-item-date">נ“… ׳×׳׳¨׳™׳ ׳™׳¢׳“: ${new Date(item.dueDate).toLocaleDateString('he-IL')}</div>
            <div style="font-size:0.72rem;color:#7367f0;margin-top:4px;">׳׳—׳¥ ׳׳¦׳₪׳™׳™׳” ׳‘׳׳•׳¦׳¨ ג†</div>
        </div>`;
    };

    if (overdue.length)  html += `<div style="font-weight:bold;color:#ef4444;margin-bottom:10px;">ג ן¸ ׳‘׳׳™׳—׳•׳¨:</div>` + overdue.map(i => card(i,'#ef4444')).join('');
    if (upcoming.length) {
        if (overdue.length) html += '<div style="margin-top:15px;"></div>';
        html += `<div style="font-weight:bold;color:#3b82f6;margin-bottom:10px;">נ”” ׳×׳–׳›׳•׳¨׳•׳×:</div>` + upcoming.map(i => card(i,'#3b82f6')).join('');
    }
    itemsList.innerHTML = html;
    modal.classList.add('active');
}

function goToItemFromAlert(itemName) {
    closeModal('urgentAlertModal');
    let foundListId = null, foundIdx = -1;
    Object.entries(db.lists).forEach(([listId, list]) => {
        (list.items || []).forEach((item, idx) => {
            if (item.name === itemName && !item.checked && !item.isPaid) { foundListId = listId; foundIdx = idx; }
        });
    });
    if (foundListId !== null && foundIdx !== -1) jumpToItem(foundListId, foundIdx);
}

// ============================================================
//  Compact Mode
// ============================================================
function toggleCompactStats() {
    compactStatsOpen = !compactStatsOpen;
    const btn1 = _n('summaryStatsBtn'), btn2 = _n('listsStatsBtn');
    const label  = compactStatsOpen ? 'ג• ׳”׳¡׳×׳¨ ׳¡׳›׳•׳' : 'נ“ ׳”׳¦׳’ ׳¡׳›׳•׳';
    const bg     = compactStatsOpen ? '#7367f0' : 'rgba(115,103,240,0.08)';
    const col    = compactStatsOpen ? '#fff' : '#7367f0';
    [btn1,btn2].forEach(b => { if (b) { b.textContent = label; b.style.background = bg; b.style.color = col; } });
    const tabsWrap = _n('tabsRowWrap'), statsRow = _n('barStatsRow');
    if (compactStatsOpen) {
        if (tabsWrap) tabsWrap.style.display = 'none';
        if (statsRow) { statsRow.style.display = 'flex'; statsRow.style.padding = '10px 12px 18px'; }
    } else { _restoreCompactTabs(); }
}

function _restoreCompactTabs() {
    const tw = _n('tabsRowWrap'); if (tw) tw.style.display = '';
    const sr = _n('barStatsRow'); if (sr) sr.style.display = 'none';
    const b1 = _n('summaryStatsBtn'), b2 = _n('listsStatsBtn');
    [b1,b2].forEach(b => { if (b) { b.textContent = 'נ“ ׳”׳¦׳’ ׳¡׳›׳•׳'; b.style.background = 'rgba(115,103,240,0.08)'; b.style.color = '#7367f0'; } });
    compactStatsOpen = false;
}

function toggleCompactMode() {
    compactMode = !compactMode;
    localStorage.setItem('compactMode', compactMode ? 'true' : 'false');
    expandedItemIdx    = -1;
    compactActionsOpen = false;

    const btn        = _n('compactModeBtn');
    const plusWrap   = _n('compactPlusWrap');
    const actionsRow = _n('compactActionsRow');
    const barActions = _n('barActionsRow');
    const barStats   = _n('barStatsRow');
    const tabsRow    = _n('tabsRowWrap');
    const bar        = _n('smartBottomBar');

    if (compactMode) {
        if (btn) { btn.style.background = 'rgba(255,255,255,0.4)'; btn.style.borderColor = 'white'; }
        const iew = _n('itemEditModeWrap'); if (iew) iew.style.display = 'flex';
        const sb  = _n('summaryCompactBtns'); if (sb) sb.style.display = 'flex';
        if (barActions) barActions.style.display = 'none';
        if (barStats)   barStats.style.display   = 'none';
        if (tabsRow)    tabsRow.style.display     = 'block';
        if (actionsRow) actionsRow.style.display  = 'none';
        if (plusWrap)   plusWrap.style.display    = 'block';
        if (bar)        bar.style.overflow        = 'hidden';
    } else {
        if (btn) { btn.style.background = 'rgba(255,255,255,0.2)'; btn.style.borderColor = 'rgba(255,255,255,0.3)'; }
        const iew = _n('itemEditModeWrap'); if (iew) { iew.style.display = 'none'; itemEditMode = false; }
        const sb  = _n('summaryCompactBtns'); if (sb) sb.style.display = 'none';
        if (compactStatsOpen) { compactStatsOpen = false; _restoreCompactTabs(); }
        if (barActions) { barActions.style.display = 'flex'; barActions.style.padding = '10px 12px 18px'; }
        if (barStats)   barStats.style.display   = 'none';
        if (plusWrap)   plusWrap.style.display   = 'none';
        if (actionsRow) actionsRow.style.display = 'none';
        if (tabsRow)    tabsRow.style.display    = 'block';
        if (bar)        bar.style.overflow       = 'hidden';
    }
    render();
}

function handleCompactPlus() {
    if (activePage === 'summary') {
        if (window.wizardMode && typeof window.wiz === 'function') window.wiz('newList','before', () => openModal('newListModal'));
        else openModal('newListModal');
    } else {
        compactActionsOpen = true;
        const ar = _n('compactActionsRow'), tr = _n('tabsRowWrap'), pw = _n('compactPlusWrap'), bar = _n('smartBottomBar');
        if (tr) tr.style.display   = 'none';
        if (ar) ar.style.display   = 'flex';
        if (pw) pw.style.display   = 'none';
        if (bar) bar.style.overflow = 'visible';
    }
}

function closeCompactActions() {
    compactActionsOpen = false;
    const ar = _n('compactActionsRow'), tr = _n('tabsRowWrap'), pw = _n('compactPlusWrap'), bar = _n('smartBottomBar');
    if (ar) ar.style.display  = 'none';
    if (tr) tr.style.display  = 'block';
    if (pw) pw.style.display  = 'block';
    if (bar) bar.style.overflow = 'hidden';
}

function toggleCompactActions() { handleCompactPlus(); }

// ============================================================
//  List / Item drag-to-reorder
// ============================================================
function toggleListEditMode() {
    listEditMode = !listEditMode;
    const btn = _n('listEditModeBtn');
    if (btn) {
        btn.textContent = listEditMode ? 'ג… ׳¡׳™׳•׳' : 'גן¸ ׳¡׳“׳¨ ׳¨׳©׳™׳׳•׳×';
        btn.style.background = listEditMode ? '#7367f0' : 'rgba(115,103,240,0.08)';
        btn.style.color      = listEditMode ? '#fff'    : '#7367f0';
        btn.style.borderColor = listEditMode ? '#7367f0' : 'rgba(115,103,240,0.25)';
    }
    render();
    if (listEditMode) setupListDrag();
}

function reorderLists(fromId, toId) {
    const keys = Object.keys(db.lists);
    const fi   = keys.indexOf(fromId), ti = keys.indexOf(toId);
    if (fi === -1 || ti === -1) return;
    keys.splice(fi,1); keys.splice(ti,0,fromId);
    const nL = {}; keys.forEach(k => nL[k] = db.lists[k]);
    db.lists = nL; save();
}

let _listDragAbort = null;
function setupListDrag() {
    const container = _n('summaryContainer');
    if (!container) return;
    if (_listDragAbort) _listDragAbort.abort();
    _listDragAbort = new AbortController();
    const sig = _listDragAbort.signal;
    let src = null, ghost = null, ox = 0, oy = 0, didDrag = false, startY = 0;

    const mkGhost = (item) => {
        const g = document.createElement('div');
        g.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;background:#fff;border:2px solid #7367f0;border-radius:12px;padding:10px 14px;box-shadow:0 12px 40px rgba(115,103,240,0.4);direction:rtl;transform:rotate(1.5deg) scale(1.03);font-family:inherit;';
        g.innerHTML = '<span style="font-size:15px;font-weight:700;color:#1a1a2e;">' + (item.querySelector('.font-bold.cursor-pointer')?.textContent?.trim() || '') + '</span>';
        document.body.appendChild(g); return g;
    };

    container.addEventListener('touchstart', e => {
        const handle = e.target.closest('[data-drag]');
        if (!handle || !listEditMode) return;
        const item = handle.closest('.item-card'); if (!item) return;
        const rect = item.getBoundingClientRect(), t = e.touches[0];
        ox = t.clientX - rect.left; oy = t.clientY - rect.top;
        startY = t.clientY; didDrag = false; src = item; src.style.opacity = '0.35';
        ghost = mkGhost(item); ghost.style.width = rect.width + 'px'; ghost.style.top = (t.clientY - oy) + 'px'; ghost.style.left = rect.left + 'px';
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchmove', e => {
        if (!src || !ghost) return;
        const t = e.touches[0]; if (Math.abs(t.clientY - startY) > 5) didDrag = true;
        ghost.style.top = (t.clientY - oy) + 'px';
        container.querySelectorAll('.item-card').forEach(el => { el.style.outline = ''; const r = el.getBoundingClientRect(); if (el !== src && t.clientY > r.top && t.clientY < r.bottom) el.style.outline = '2px solid #7367f0'; });
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchend', e => {
        if (!src) return;
        if (ghost) { ghost.remove(); ghost = null; }
        const t = e.changedTouches[0]; let target = null;
        container.querySelectorAll('.item-card').forEach(el => { el.style.outline = ''; const r = el.getBoundingClientRect(); if (el !== src && t.clientY > r.top && t.clientY < r.bottom) target = el; });
        if (didDrag && target) reorderLists(src.dataset.id, target.dataset.id);
        else { src.style.opacity = ''; if (didDrag) container.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true }); }
        src = null; didDrag = false;
    }, { signal: sig });
}

function toggleItemEditMode() {
    itemEditMode = !itemEditMode;
    const btn = _n('itemEditModeBtn');
    if (btn) {
        btn.textContent  = itemEditMode ? 'ג… ׳¡׳™׳•׳' : 'גן¸ ׳¡׳“׳¨ ׳׳•׳¦׳¨׳™׳';
        btn.style.background = itemEditMode ? '#7367f0' : 'rgba(115,103,240,0.08)';
        btn.style.color      = itemEditMode ? '#fff'    : '#7367f0';
        btn.style.borderColor = itemEditMode ? '#7367f0' : 'rgba(115,103,240,0.25)';
    }
    render();
    if (itemEditMode) setupItemDrag();
}

let _itemDragAbort = null;
function setupItemDrag() {
    const container = _n('itemsContainer');
    if (!container) return;
    if (_itemDragAbort) _itemDragAbort.abort();
    _itemDragAbort = new AbortController();
    const sig = _itemDragAbort.signal;
    let src = null, ghost = null, ox = 0, oy = 0, didDrag = false, startY = 0, srcIdx = -1;

    const mkGhost = (item) => {
        const g = document.createElement('div');
        g.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;background:#fff;border:2px solid #7367f0;border-radius:12px;padding:10px 14px;box-shadow:0 12px 40px rgba(115,103,240,0.4);direction:rtl;transform:rotate(1.5deg) scale(1.03);font-family:inherit;';
        g.innerHTML = '<span style="font-size:15px;font-weight:700;color:#1a1a2e;">' + (item.querySelector('.font-bold')?.textContent?.trim() || '') + '</span>';
        document.body.appendChild(g); return g;
    };

    container.addEventListener('touchstart', e => {
        const handle = e.target.closest('[data-drag]');
        if (!handle || !itemEditMode) return;
        const item = handle.closest('.item-card'); if (!item) return;
        const rect = item.getBoundingClientRect(), t = e.touches[0];
        ox = t.clientX - rect.left; oy = t.clientY - rect.top;
        startY = t.clientY; didDrag = false; srcIdx = parseInt(item.dataset.idx);
        src = item; src.style.opacity = '0.35';
        ghost = mkGhost(item); ghost.style.width = rect.width + 'px'; ghost.style.top = (t.clientY - oy) + 'px'; ghost.style.left = rect.left + 'px';
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchmove', e => {
        if (!src || !ghost) return;
        const t = e.touches[0]; if (Math.abs(t.clientY - startY) > 5) didDrag = true;
        ghost.style.top = (t.clientY - oy) + 'px';
        container.querySelectorAll('.item-card').forEach(el => { el.style.outline = ''; const r = el.getBoundingClientRect(); if (el !== src && t.clientY > r.top && t.clientY < r.bottom) el.style.outline = '2px solid #7367f0'; });
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchend', e => {
        if (!src) return;
        if (ghost) { ghost.remove(); ghost = null; }
        const t = e.changedTouches[0]; let toIdx = -1;
        container.querySelectorAll('.item-card').forEach(el => { el.style.outline = ''; if (el === src) return; const r = el.getBoundingClientRect(); if (t.clientY > r.top && t.clientY < r.bottom) toIdx = parseInt(el.dataset.idx); });
        if (didDrag && toIdx !== -1 && toIdx !== srcIdx) {
            const items = db.lists[db.currentId].items;
            const [moved] = items.splice(srcIdx,1); items.splice(toIdx,0,moved); save();
        } else { src.style.opacity = ''; if (didDrag) container.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true }); }
        src = null; srcIdx = -1; didDrag = false;
    }, { signal: sig });
}

// ============================================================
//  List Name Bar / Actions Panel
// ============================================================
let _listPanelOpen = false;

function adjustListNameBarPosition() {
    const header = document.querySelector('.app-header');
    const bar    = _n('listNameBar');
    if (!header || !bar) return;
    bar.style.top = header.getBoundingClientRect().bottom + 'px';
    if (_listPanelOpen) _positionActionsPanel();
}

function _positionActionsPanel() {
    const bar   = _n('listNameBar');
    const panel = _n('listActionsPanel');
    if (!bar || !panel) return;
    panel.style.top = bar.getBoundingClientRect().bottom + 'px';
}

function toggleListActionsPanel() { _listPanelOpen ? closeListActionsPanel() : openListActionsPanel(); }
function openListActionsPanel()  { _listPanelOpen = true;  _positionActionsPanel(); _n('listActionsPanel')?.classList.add('open');    _n('lnbArrow')?.classList.add('open'); }
function closeListActionsPanel() { _listPanelOpen = false; _n('listActionsPanel')?.classList.remove('open'); _n('lnbArrow')?.classList.remove('open'); }

function initListNameBarListeners() {
    window.addEventListener('resize', adjustListNameBarPosition);
    document.addEventListener('DOMContentLoaded', () => setTimeout(adjustListNameBarPosition, 100));
    setTimeout(adjustListNameBarPosition, 300);
    document.addEventListener('click', (e) => {
        if (!_listPanelOpen) return;
        const arrow = _n('lnbArrow'), panel = _n('listActionsPanel');
        if (arrow && !arrow.contains(e.target) && panel && !panel.contains(e.target)) closeListActionsPanel();
    });
}

function updatePlusBtnLabel() {
    const lbl = _n('plusBtnLabel');
    if (lbl) lbl.textContent = activePage === 'summary' ? '׳¨׳©׳™׳׳” ׳—׳“׳©׳”' : '׳”׳•׳¡׳£ ׳׳•׳¦׳¨';
}

// ============================================================
//  preparePrint
// ============================================================
function preparePrint() {
    closeModal('settingsModal');
    const printArea = _n('printArea');
    if (!printArea) return;
    const list = db.lists[db.currentId];
    if (!list) { window.print(); return; }
    printArea.innerHTML = `<h1 style="font-size:24px;font-weight:900;margin-bottom:16px;">${list.name}</h1>` +
        (list.items || []).map((item, i) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">
            <span>${i+1}. ${item.name}</span><span>x${item.qty} ג€” ג‚×${(item.price*item.qty).toFixed(2)}</span>
        </div>`).join('') +
        `<div style="font-weight:900;margin-top:16px;">׳¡׳”"׳›: ג‚×${list.items.reduce((s,i) => s+i.price*i.qty, 0).toFixed(2)}</div>`;
    window.print();
}

// ============================================================
//  History / Templates rendering
// ============================================================
function renderHistory() {
    const container = _n('historyContent');
    if (!container) return;
    container.innerHTML = '';
    const entries = (db.history || []).slice().reverse();
    if (entries.length === 0) { container.innerHTML = '<p class="text-gray-400 text-center py-8">׳׳™׳ ׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳¢׳“׳™׳™׳</p>'; return; }
    entries.forEach((entry) => {
        const realIdx = db.history.indexOf(entry);
        const div = document.createElement('div');
        div.className = 'mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200';
        const date = new Date(entry.completedAt);
        div.innerHTML = `<div class="flex justify-between items-center mb-2">
            <span class="font-bold text-gray-800">${entry.name}</span>
            <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">${date.toLocaleDateString('he-IL')}</span>
                <button onclick="confirmDeleteHistory(${realIdx}, 'history')" style="background:#fee2e2;border:none;border-radius:8px;padding:4px 8px;font-size:0.7rem;font-weight:800;color:#ef4444;cursor:pointer;">נ—‘ן¸ ׳׳—׳§</button>
            </div>
        </div>
        <div class="flex justify-between items-center mb-3">
            <span class="text-sm text-gray-500">${entry.items.length} ׳׳•׳¦׳¨׳™׳</span>
            <span class="font-black text-indigo-600">ג‚×${entry.total.toFixed(2)}</span>
        </div>
        <button onclick="restoreFromHistory(${realIdx}, 'history')" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">נ“‹ ׳©׳—׳–׳¨ ׳¨׳©׳™׳׳”</button>`;
        container.appendChild(div);
    });
}

function renderTemplates() {
    const container = _n('templatesContent');
    if (!container) return;
    const templates = Object.entries(db.lists).filter(([,l]) => l.isTemplate);
    if (templates.length === 0) { container.innerHTML = '<p class="text-gray-400 text-center py-8">׳׳™׳ ׳×׳‘׳ ׳™׳•׳× ׳©׳׳•׳¨׳•׳×</p>'; return; }
    container.innerHTML = templates.map(([id, l]) => `
        <div class="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-yellow-800">ג­ ${l.name}</span>
                <span class="text-sm text-yellow-600">${l.items.length} ׳׳•׳¦׳¨׳™׳</span>
            </div>
            <button onclick="createFromTemplate('${id}')" class="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-bold">נ“‹ ׳”׳©׳×׳׳© ׳‘׳×׳‘׳ ׳™׳×</button>
        </div>`).join('');
}

function showCompletedListsModal() {
    const monthKey = getSelectedMonthKey();
    const filtered = (db.history || []).filter(e => { const d = new Date(e.completedAt); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === monthKey; });
    if (filtered.length === 0) { showNotification(`׳׳™׳ ׳¨׳©׳™׳׳•׳× ׳©׳”׳•׳©׳׳׳• ׳‘${getMonthLabel(monthKey)}`, 'warning'); return; }
    openModal('completedListsModal');
    const titleEl = _qs('#completedListsModal h2');
    if (titleEl) titleEl.textContent = `ג… ׳¨׳©׳™׳׳•׳× ׳©׳”׳•׳©׳׳׳• ג€” ${getMonthLabel(monthKey)}`;
    renderCompletedLists();
}

function renderCompletedLists() {
    const container = _n('completedListsContent');
    if (!container) return;
    container.innerHTML = '';
    const monthKey = getSelectedMonthKey();
    const entries  = (db.history || []).slice().reverse().filter(e => { const d = new Date(e.completedAt); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === monthKey; });
    if (entries.length === 0) { container.innerHTML = `<p class="text-gray-400 text-center py-8">׳׳™׳ ׳¨׳©׳™׳׳•׳× ׳©׳”׳•׳©׳׳׳• ׳‘${getMonthLabel(monthKey)}</p>`; return; }
    entries.forEach(entry => {
        const realIdx = db.history.indexOf(entry);
        const div = document.createElement('div');
        div.className = 'mb-4 p-4 bg-green-50 rounded-xl border border-green-200';
        const date = new Date(entry.completedAt);
        let productsList = '<div class="mt-3 mb-3 space-y-1">';
        (entry.items || []).forEach((item, i) => {
            productsList += `<div class="flex justify-between items-center text-sm py-1 border-b border-green-200">
                <div class="flex items-center gap-2 flex-1 min-w-0"><span class="text-gray-700 truncate">${i+1}. ${item.name}</span><span class="text-gray-400 text-xs flex-shrink-0">x${item.qty}</span><span class="text-indigo-600 font-bold flex-shrink-0">ג‚×${(item.price*item.qty).toFixed(2)}</span></div>
                <button onclick="openRestoreItemPicker(${realIdx},${i},'completed')" class="flex-shrink-0 mr-1 text-[10px] font-bold bg-white border border-indigo-300 text-indigo-600 rounded-lg px-2 py-1 whitespace-nowrap">+ ׳”׳•׳¡׳£ ׳׳¨׳©׳™׳׳”</button>
            </div>`;
        });
        productsList += '</div>';
        div.innerHTML = `<div class="flex justify-between items-center mb-2">
            <span class="font-bold text-green-800 text-base">ג… ${entry.name}</span>
            <div class="flex items-center gap-2"><span class="text-xs text-green-600">${date.toLocaleDateString('he-IL')}</span>
            <button onclick="confirmDeleteHistory(${realIdx},'completed')" style="background:#fee2e2;border:none;border-radius:8px;padding:4px 8px;font-size:0.7rem;font-weight:800;color:#ef4444;cursor:pointer;">נ—‘ן¸ ׳׳—׳§</button></div>
        </div>
        <div class="flex justify-between items-center mb-2"><span class="text-sm text-green-700">${entry.items.length} ׳׳•׳¦׳¨׳™׳</span><span class="text-green-700 font-black text-lg">ג‚×${entry.total.toFixed(2)}</span></div>
        ${productsList}
        <button onclick="restoreFromHistory(${realIdx},'completed')" class="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">נ“‹ ׳©׳—׳–׳¨ ׳¨׳©׳™׳׳” ׳©׳׳׳”</button>`;
        container.appendChild(div);
    });
}

export { openModal, closeModal, showNotification, updateNotificationBadge, openNotificationCenter, dismissNotification, dismissAllNotifications, showUrgentAlertModal, goToItemFromAlert, jumpToItem };

// ============================================================
//  importers.js  —  כל לוגיקת הייבוא
//  מייבא מ: store.js
//  מיובא על-ידי: ui.js, app.js
// ============================================================

// ============================================================
//  עזר
// ============================================================
function _n(id) { return document.getElementById(id); }
function _newCloudId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================================
//  importFromText  —  ייבוא מחלון הטקסט הפשוט
// ============================================================
function importFromText() {
    const text = _n('importText')?.value.trim();
    if (!text) { alert('אנא הדבק טקסט לייבוא'); return; }

    const lines = text.split('\n').filter(l => l.trim());
    let listName   = 'רשימה מיובאת';
    let startIndex = 0;

    const firstLine = lines[0];
    if (firstLine?.includes('*') && firstLine.includes(':')) {
        const match = firstLine.match(/\*([^*]+)\*/);
        if (match) { listName = match[1].trim(); startIndex = 1; }
    }

    // Unique name
    let finalName = listName;
    let counter   = 1;
    const existingNames = Object.values(db.lists).map(l => l.name);
    while (existingNames.includes(finalName)) { counter++; finalName = `${listName} ${counter}`; }

    const newListId = 'L' + Date.now();
    const items     = [];

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.includes('🛒') || line.includes('💰') || line.includes('סה"כ') || line === '---') continue;

        let added = false;

        // Full format: ⬜/✅ *name* (xN) - ₪price
        const fullMatch = line.match(/[⬜✅]\s*\*([^*]+)\*\s*\(x(\d+)\)\s*-\s*₪([\d.]+)/);
        if (fullMatch) {
            const name = fullMatch[1].trim();
            const qty  = parseInt(fullMatch[2]);
            items.push({ name, price: parseFloat(fullMatch[3]) / qty, qty, checked: line.includes('✅'), category: detectCategory(name), cloudId: _newCloudId() });
            added = true;
        }
        if (!added) {
            const m = line.match(/^[•\-]\s*\*?([^(]+)\*?\s*\(x(\d+)\)/);
            if (m) {
                const name = m[1].trim().replace(/\*/g, '');
                if (name) { items.push({ name, price: 0, qty: parseInt(m[2]), checked: false, category: detectCategory(name), cloudId: _newCloudId() }); added = true; }
            }
        }
        if (!added) {
            const m = line.match(/^[•\-]\s*\*?(.+?)\*?$/);
            if (m) {
                const name = m[1].trim().replace(/\*/g, '');
                if (name) { items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name), cloudId: _newCloudId() }); added = true; }
            }
        }
        if (!added) {
            const m = line.match(/^\*([^*]+)\*$/);
            if (m) {
                const name = m[1].trim();
                if (name) { items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name), cloudId: _newCloudId() }); added = true; }
            }
        }
        if (!added && line.length > 0) {
            const name = line.replace(/^[\d\.\)\-\s]+/, '').trim();
            if (name && !/^\d+$/.test(name)) {
                items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name), cloudId: _newCloudId() });
            }
        }
    }

    if (items.length === 0) { alert('לא נמצאו מוצרים בטקסט'); return; }

    db.lists[newListId] = { name: finalName, url: '', budget: 0, isTemplate: false, items };
    db.currentId = newListId;
    setActivePage('lists');
    if (typeof window.closeModal === 'function') window.closeModal('importModal');
    save();
    if (typeof window.showNotification === 'function') window.showNotification(`✅ יובאו ${items.length} מוצרים!`);
}

// ============================================================
//  Clipboard Import System
// ============================================================
async function checkClipboardOnStartup() {
    try {
        if (localStorage.getItem('clipboardAutoOpen') !== 'true') return;
        if (!navigator.clipboard?.readText) return;

        const clipboardText = await navigator.clipboard.readText();
        if (!clipboardText?.trim()) return;

        const state      = JSON.parse(localStorage.getItem('clipboardState') || '{}');
        const lastText   = state.lastClipboardText || '';
        const dismissed  = state.clipboardDismissed || false;
        const imported   = state.clipboardImported  || false;

        if (clipboardText === lastText) {
            if (dismissed || imported) return;
        } else {
            state.lastClipboardText   = clipboardText;
            state.clipboardDismissed  = false;
            state.clipboardImported   = false;
            localStorage.setItem('clipboardState', JSON.stringify(state));
        }
        showClipboardImportModal(clipboardText);
    } catch (e) {
        console.log('Clipboard access error:', e.name, e.message);
    }
}

function toggleClipboardAutoOpen() {
    const toggle = _n('clipboardAutoOpenToggle');
    const label  = _n('clipboardAutoOpenLabel');
    if (!toggle) return;
    const isOn = toggle.checked;
    localStorage.setItem('clipboardAutoOpen', isOn ? 'true' : 'false');
    if (label) { label.textContent = isOn ? 'מופעל' : 'מושבת'; label.style.color = isOn ? '#7367f0' : '#94a3b8'; }
}

function showClipboardImportModal(text) {
    const modal            = _n('clipboardImportModal');
    const textarea         = _n('clipboardImportText');
    const detectedTypeDiv  = _n('clipboardDetectedType');
    const detectedTypeName = _n('detectedTypeName');

    const autoOpen = localStorage.getItem('clipboardAutoOpen') !== 'false';
    const toggle   = _n('clipboardAutoOpenToggle');
    const label    = _n('clipboardAutoOpenLabel');
    if (toggle) toggle.checked = autoOpen;
    if (label)  { label.textContent = autoOpen ? 'מופעל' : 'מושבת'; label.style.color = autoOpen ? '#7367f0' : '#94a3b8'; }

    if (textarea)         textarea.value = text;
    setPendingImportText(text);

    const type = detectListType(text);
    setDetectedListType(type);
    const typeNames = { shopping: '🛒 רשימת קניות', appointment: '🏥 תור/פגישה', tasks: '✅ רשימת משימות', general: '📝 רשימה כללית' };
    if (detectedTypeName) detectedTypeName.textContent = typeNames[type] || '📝 רשימה כללית';
    if (detectedTypeDiv)  detectedTypeDiv.style.display = 'block';
    if (modal)            modal.style.display = 'flex';
}

async function openManualImport() {
    if (window.wizardMode && typeof window.wiz === 'function') {
        window.wiz('pasteBtn', 'before', async () => { await _origOpenManualImport(); });
        return;
    }
    await _origOpenManualImport();
}

async function _origOpenManualImport() {
    const modal            = _n('clipboardImportModal');
    const textarea         = _n('clipboardImportText');
    const detectedTypeDiv  = _n('clipboardDetectedType');
    const detectedTypeName = _n('detectedTypeName');

    let clipboardText = '';
    try {
        if (navigator.clipboard?.readText) clipboardText = await navigator.clipboard.readText();
    } catch (e) { /* silent */ }

    if (textarea) textarea.value = clipboardText;
    setPendingImportText(clipboardText);

    let type = 'shopping';
    if (clipboardText.trim()) {
        type = detectListType(clipboardText);
    }
    setDetectedListType(type);

    const typeNames = { shopping: '🛒 רשימת קניות', appointment: '🏥 תור/פגישה', tasks: '✅ רשימת משימות', general: '📝 רשימה כללית' };
    if (detectedTypeName) detectedTypeName.textContent = typeNames[type] || '📝 רשימה כללית';
    if (detectedTypeDiv)  detectedTypeDiv.style.display = 'block';
    if (modal)            modal.style.display = 'flex';
    setTimeout(() => textarea?.focus(), 100);
}

function updateDetectedTypeFromInput() {
    const textarea         = _n('clipboardImportText');
    const detectedTypeName = _n('detectedTypeName');
    const text = textarea?.value || '';
    if (text.trim()) {
        setPendingImportText(text);
        const type = detectListType(text);
        setDetectedListType(type);
        const typeNames = { shopping: '🛒 רשימת קניות', appointment: '🏥 תור/פגישה', tasks: '✅ רשימת משימות', general: '📝 רשימה כללית' };
        if (detectedTypeName) detectedTypeName.textContent = typeNames[type] || '📝 רשימה כללית';
    }
}

function detectListType(text) {
    const lines = text.split('\n').filter(l => l.trim());

    const appointmentKeywords = [
        'תור', 'פגישה', 'ד"ר', 'דוקטור', 'רופא', 'מרפאה', 'בית חולים', 'קליניקה',
        'מכבידנט', 'כללית', 'מאוחדת', 'לאומית', 'פרופ', 'מומחה', 'טיפול', 'בדיקה', 'ייעוץ', 'ניתוח', 'צילום', 'אולטרסאונד'
    ];
    const hasAppointmentKeyword = appointmentKeywords.some(k => text.includes(k));
    const hasDateTime  = /\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]?\d{0,4}/.test(text) || /\d{1,2}:\d{2}|בשעה|שעה/.test(text);
    const hasPhone     = /0\d{1,2}[\-\s]?\d{3,4}[\-\s]?\d{3,4}|טלפון|טל:|נייד/.test(text);
    const hasUrl       = /https?:\/\//.test(text);
    const hasAddress   = /רחוב|רח'|כתובת|מיקום|קומה|בניין/.test(text);

    const strongAppointment =
        (hasAppointmentKeyword && hasDateTime) ||
        (hasDateTime && hasPhone) ||
        (hasDateTime && hasUrl) ||
        (hasDateTime && hasAddress && lines.length <= 10);
    if (strongAppointment) return 'appointment';

    const hasPrice        = /\d+\s*ש"ח|₪\s*\d+|\d+\s*שקל/.test(text);
    const shoppingKeywords = ['חלב','לחם','ביצים','גבינה','יוגורט','עגבניות','מלפפון','בשר','עוף','דגים'];
    const shoppingCount   = shoppingKeywords.filter(k => text.includes(k)).length;
    if (hasPrice || shoppingCount >= 2 || (lines.length >= 3 && lines.length <= 30 && !hasDateTime)) return 'shopping';

    const taskKeywords = ['משימה','לעשות','להשלים','לבדוק','לקנות','להתקשר'];
    if (taskKeywords.some(k => text.includes(k)) && lines.length >= 2) return 'tasks';
    if (lines.length >= 3 && !hasDateTime) return 'shopping';
    if (lines.length <= 3 && hasDateTime) return 'appointment';
    return 'general';
}

function changeDetectedType() {
    const types = ['shopping','appointment','tasks','general'];
    const next  = (types.indexOf(detectedListType) + 1) % types.length;
    setDetectedListType(types[next]);
    const typeNames = { shopping: '🛒 רשימת קניות', appointment: '🏥 תור/פגישה', tasks: '✅ רשימת משימות', general: '📝 רשימה כללית' };
    const el = _n('detectedTypeName');
    if (el) el.textContent = typeNames[types[next]];
}

function acceptClipboardImport() {
    const modal = _n('clipboardImportModal');
    if (modal) modal.style.display = 'none';
    const state = JSON.parse(localStorage.getItem('clipboardState') || '{}');
    state.clipboardImported = true;
    localStorage.setItem('clipboardState', JSON.stringify(state));
    if (typeof window.showNotification === 'function') window.showNotification('✅ בחר רשימה או צור רשימה חדשה להוספת הפריטים');
}

function dismissClipboardImport() {
    const modal = _n('clipboardImportModal');
    if (modal) modal.style.display = 'none';
    const state = JSON.parse(localStorage.getItem('clipboardState') || '{}');
    state.clipboardDismissed = true;
    localStorage.setItem('clipboardState', JSON.stringify(state));
    setPendingImportText(null);
    setDetectedListType(null);
}

function importTextToList(listId, text, listType) {
    if (!text || !listId) return;
    const list = db.lists[listId];
    if (!list) return;

    let items = [];
    if (listType === 'appointment')            items = parseAppointmentText(text);
    else if (listType === 'shopping' || listType === 'tasks') items = parseShoppingListText(text);
    else                                       items = parseGeneralListText(text);

    items.forEach(item => list.items.push(item));

    const state = JSON.parse(localStorage.getItem('clipboardState') || '{}');
    state.clipboardImported = true;
    localStorage.setItem('clipboardState', JSON.stringify(state));
    setPendingImportText(null);
    setDetectedListType(null);

    save();
    if (typeof window.render === 'function') window.render();
    if (typeof window.showNotification === 'function') window.showNotification(`✅ ${items.length} פריטים נוספו לרשימה!`);
}

// ============================================================
//  parseAppointmentText
// ============================================================
function parseAppointmentText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let name = '', dueDate = '', dueTime = '', location = '', phone = '', url = '';

    // URL
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);
    if (urlMatch) url = urlMatch[0];

    // Date
    const dateMatch = text.match(/(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/);
    if (dateMatch) {
        const day   = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year  = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
        dueDate = `${year}-${month}-${day}`;
    }

    // Time
    let timeMatch = text.match(/בשעה\s+(\d{1,2}):(\d{2})/)
        || text.match(/שעה\s+(\d{1,2}):(\d{2})/)
        || text.match(/\s(\d{1,2}):(\d{2})\s/)
        || text.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) dueTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;

    // Phone
    const phoneMatch = text.match(/(0\d{1,2}[\-\s]?\d{3,4}[\-\s]?\d{3,4})/);
    if (phoneMatch) phone = phoneMatch[1];

    // Name — "תור ל[שם]"
    const nameMatch1 = text.match(/תור ל(\w+)/);
    if (nameMatch1) {
        const clinicMatch = text.match(/(מכבידנט|כללית|מאוחדת|לאומית)[\s\w-]*/);
        name = clinicMatch ? `תור ל${nameMatch1[1]} - ${clinicMatch[0]}` : `תור ל${nameMatch1[1]}`;
    }
    if (!name) {
        for (const l of lines) {
            if (l.includes('ד"ר') || l.includes('דוקטור') || l.includes('רופא') || l.includes('פרופ') || l.includes('מרפאה') || l.includes('קליניקה')) {
                name = l; break;
            }
        }
    }
    if (!name) {
        const clinicMatch = text.match(/(מכבידנט|כללית|מאוחדת|לאומית)[\s\w-]*/);
        if (clinicMatch) name = clinicMatch[0];
    }
    if (!name && lines.length > 0) name = lines[0];

    // Location
    const locMatch = text.match(/(מכבידנט|כללית|מאוחדת|לאומית)[\s\w-]*/);
    if (locMatch) location = locMatch[0];
    if (!location) {
        for (const l of lines) {
            if (l.includes('רחוב') || l.includes("רח'") || l.includes('כתובת') || l.includes('מיקום')) {
                location = l; break;
            }
        }
    }

    // Doctor
    const doctorMatch = text.match(/(?:ל)?גב['׳]?\s+(\w+\s+\w+)|(?:ל)?ד["״]ר\s+(\w+\s+\w+)|(?:ל)?פרופ['׳]?\s+(\w+\s+\w+)/);
    const doctorName  = doctorMatch ? '👤 ' + doctorMatch[0] : '';

    const noteParts = [];
    if (doctorName) noteParts.push(doctorName);
    if (location)   noteParts.push('📍 ' + location);
    if (phone)      noteParts.push('☎️ ' + phone);
    if (url)        noteParts.push('🔗 ' + url);

    for (const l of lines) {
        if (l.length < 3) continue;
        const used = (name && l.includes(name.replace('תור ל','').replace(' - ','')))
            || (location && l.includes(location))
            || (phone && l.includes(phone))
            || (url && l.includes(url))
            || (doctorName && l.includes(doctorName.replace('👤 ','')))
            || (dueTime && l.includes(dueTime))
            || (dateMatch && l.includes(dateMatch[0]));
        if (!used) noteParts.push(l);
    }

    return [{
        name: name || 'פגישה', price: 0, qty: 0, checked: false,
        category: 'תור/פגישה', note: noteParts.join('\n'),
        dueDate, dueTime, paymentUrl: url, isPaid: false,
        reminderValue: '', reminderUnit: '',
        lastUpdated: Date.now(), cloudId: _newCloudId()
    }];
}

// ============================================================
//  parseShoppingListText
// ============================================================
function parseShoppingListText(text) {
    return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        let price = 0;
        let name  = line;
        const m   = line.match(/(.+?)\s*[₪]?\s*(\d+(?:\.\d+)?)\s*(?:ש"ח|שקל)?/);
        if (m) { name = m[1].trim(); price = parseFloat(m[2]) || 0; }
        return {
            name, price, qty: 1, checked: false,
            category: detectCategory(name) || 'אחר',
            note: '', dueDate: '', dueTime: '', paymentUrl: '', isPaid: false,
            reminderValue: '', reminderUnit: '',
            lastUpdated: Date.now(), cloudId: _newCloudId()
        };
    });
}

// ============================================================
//  parseGeneralListText
// ============================================================
function parseGeneralListText(text) {
    return [{
        name: text.trim(), price: 0, qty: 0, checked: false,
        category: 'אחר', note: '', dueDate: '', dueTime: '',
        paymentUrl: '', isPaid: false, reminderValue: '', reminderUnit: '',
        isGeneralNote: true, lastUpdated: Date.now(), cloudId: _newCloudId()
    }];
}

// ============================================================
//  Voice Input
// ============================================================
let recognition = null;
let isRecording  = false;

function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return null;
    const SR    = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    const langMap = { he: 'he-IL', en: 'en-US', ru: 'ru-RU', ro: 'ro-RO' };
    recog.lang            = langMap[currentLang] || 'he-IL';
    recog.continuous      = false;
    recog.interimResults  = false;
    recog.maxAlternatives = 1;
    return recog;
}

function startVoiceInput() {
    if (!recognition) {
        recognition = initVoiceRecognition();
        if (!recognition) {
            if (typeof window.showNotification === 'function') window.showNotification('הדפדפן לא תומך בזיהוי קולי', 'error');
            return;
        }
    }
    if (isRecording) { stopVoiceInput(); return; }

    const voiceBtn = _n('voiceBtn');
    if (voiceBtn) voiceBtn.classList.add('recording');
    isRecording = true;

    recognition.onresult = (e) => { parseVoiceInput(e.results[0][0].transcript); };
    recognition.onerror  = (e) => {
        stopVoiceInput();
        if (typeof window.showNotification === 'function') {
            window.showNotification(e.error === 'no-speech' ? 'לא זוהה דיבור, נסה שוב' : 'שגיאה בזיהוי קולי', 'warning');
        }
    };
    recognition.onend = () => { stopVoiceInput(); };

    try {
        recognition.start();
        if (typeof window.showNotification === 'function') window.showNotification('🎤 מקשיב...', 'success');
    } catch (e) {
        stopVoiceInput();
        if (typeof window.showNotification === 'function') window.showNotification('שגיאה בהפעלת המיקרופון', 'error');
    }
}

function stopVoiceInput() {
    const voiceBtn = _n('voiceBtn');
    if (voiceBtn) voiceBtn.classList.remove('recording');
    isRecording = false;
    try { recognition?.stop(); } catch (e) { /* already stopped */ }
}

function parseVoiceInput(text) {
    const separators = ['ו','וגם','גם',',','עוד','בנוסף','ועוד'];
    const pattern    = new RegExp(`\\s+(${separators.join('|')})\\s+`, 'gi');
    let items = text.split(pattern).filter(item => {
        const t = item.trim();
        return t && !separators.some(s => s.toLowerCase() === t.toLowerCase());
    });

    const phrasesToRemove = ['צריך לקנות','לקנות','קנה','תקנה','רוצה','צריך'];
    items = items.map(item => {
        let cleaned = item.trim();
        phrasesToRemove.forEach(phrase => { cleaned = cleaned.replace(new RegExp(`^${phrase}\\s+`, 'gi'), ''); });
        return cleaned.trim();
    }).filter(Boolean);

    if (items.length === 0) {
        if (typeof window.showNotification === 'function') window.showNotification('לא זוהו מוצרים, נסה שוב', 'warning');
        return;
    }

    if (items.length === 1) {
        const itemName = items[0];
        if (_n('itemName'))     _n('itemName').value = itemName;
        if (_n('itemCategory')) _n('itemCategory').value = detectCategory(itemName) || '';
        _n('itemPrice')?.focus();
        if (typeof window.showNotification === 'function') window.showNotification(`🎤 "${itemName}" - הוסף מחיר או לחץ הוסף`);
    } else {
        let count = 0;
        items.forEach(itemName => {
            if (itemName) {
                db.lists[db.currentId].items.push({
                    name: itemName, price: 0, qty: 1, checked: false,
                    category: detectCategory(itemName), cloudId: _newCloudId()
                });
                count++;
            }
        });
        save();
        if (typeof window.closeModal === 'function') window.closeModal('inputForm');
        if (typeof window.showNotification === 'function') window.showNotification(`✅ נוספו ${count} מוצרים: ${items.join(', ')}`);
    }
}

// ── Voice Actions (bought / tobuy) ─────────────────────────
let _voiceActionRecognition = null;
let _voiceActionMode        = null;
let _voiceActionActive      = false;

function initVoiceAction() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    // initialized on demand in startVoiceAction
}

function _levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

function _fuzzyFindItem(transcript, items) {
    const t   = transcript.trim().toLowerCase();
    let best  = null, bestScore = Infinity;
    items.forEach(item => {
        const name  = item.name.toLowerCase();
        const score = Math.min(_levenshtein(t, name), name.includes(t) || t.includes(name) ? 0 : Infinity);
        if (score < bestScore) { bestScore = score; best = item; }
    });
    return bestScore <= Math.max(3, Math.floor(best?.name.length / 4)) ? best : null;
}

function startVoiceAction(mode) {
    if (_voiceActionActive) { _stopVoiceAction(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        if (typeof window.showNotification === 'function') window.showNotification('הדפדפן לא תומך בזיהוי קולי', 'error');
        return;
    }
    _voiceActionMode   = mode;
    _voiceActionActive = true;
    _voiceActionRecognition = new SR();
    _voiceActionRecognition.lang = { he:'he-IL', en:'en-US', ru:'ru-RU', ro:'ro-RO' }[currentLang] || 'he-IL';
    _voiceActionRecognition.continuous = false;
    _voiceActionRecognition.interimResults = false;

    _updateVoiceActionBtns(true);

    _voiceActionRecognition.onresult = (e) => {
        const transcripts = Array.from(e.results).flatMap(r => Array.from(r)).map(r => r.transcript);
        _handleVoiceActionResult(transcripts, mode);
    };
    _voiceActionRecognition.onerror = (e) => {
        _stopVoiceAction();
        if (typeof window.showNotification === 'function') window.showNotification('שגיאה בזיהוי קולי', 'warning');
    };
    _voiceActionRecognition.onend = () => { _stopVoiceAction(); };

    try {
        _voiceActionRecognition.start();
        if (typeof window.showNotification === 'function') window.showNotification('🎤 אמור שם מוצר...', 'info');
    } catch (e) {
        _stopVoiceAction();
    }
}

function _stopVoiceAction() {
    _voiceActionActive = false;
    _updateVoiceActionBtns(false);
    try { _voiceActionRecognition?.stop(); } catch (e) {}
}

function _updateVoiceActionBtns(recording) {
    const btnBought = _n('voiceActionBoughtBtn');
    const btnTobuy  = _n('voiceActionTobuyBtn');
    if (recording) {
        if (_voiceActionMode === 'bought' && btnBought) btnBought.classList.add('recording');
        if (_voiceActionMode === 'tobuy'  && btnTobuy)  btnTobuy.classList.add('recording');
    } else {
        btnBought?.classList.remove('recording');
        btnTobuy?.classList.remove('recording');
    }
}

function _handleVoiceActionResult(transcripts, mode) {
    const items = db.lists[db.currentId]?.items || [];
    for (const transcript of transcripts) {
        const found = _fuzzyFindItem(transcript, items);
        if (mode === 'bought') {
            if (!found) {
                if (typeof window.showNotification === 'function') window.showNotification(`❓ לא נמצא: "${transcript}"`, 'warning');
                return;
            }
            if (found.checked) {
                if (typeof window.showNotification === 'function') window.showNotification(`ℹ️ "${found.name}" כבר מסומן`, 'info');
                return;
            }
            found.checked = true;
            save();
            if (typeof window.showNotification === 'function') window.showNotification(`✅ "${found.name}" סומן כנרכש`);
        } else if (mode === 'tobuy') {
            if (!found) {
                _showAddItemPrompt(transcript);
                return;
            }
            if (!found.checked) {
                if (typeof window.showNotification === 'function') window.showNotification(`ℹ️ "${found.name}" כבר ממתין לקנייה`, 'info');
                return;
            }
            found.checked = false;
            save();
            if (typeof window.showNotification === 'function') window.showNotification(`🛍️ "${found.name}" הוחזר לרשימה`);
        }
        return;
    }
}

function _showAddItemPrompt(name) {
    if (confirm(`"${name}" לא נמצא ברשימה. להוסיף?`)) {
        db.lists[db.currentId].items.push({
            name, price: 0, qty: 1, checked: false,
            category: detectCategory(name), cloudId: _newCloudId()
        });
        save();
        if (typeof window.showNotification === 'function') window.showNotification(`➕ "${name}" נוסף לרשימה`);
    }
}

// ============================================================
//  Translation
// ============================================================
async function performTranslation() {
    const targetLang = _n('targetLanguage')?.value;
    const list       = db.lists[db.currentId];
    if (!list?.items.length) {
        if (typeof window.showNotification === 'function') window.showNotification('אין מוצרים לתרגום', 'warning');
        return;
    }

    const progressDiv = _n('translationProgress');
    const statusDiv   = _n('translationStatus');
    progressDiv?.classList.remove('hidden');

    let translated = 0;
    try {
        for (let i = 0; i < list.items.length; i++) {
            if (statusDiv) statusDiv.textContent = `מתרגם ${i + 1} מתוך ${list.items.length}...`;
            const translated_name = await translateText(list.items[i].name, targetLang);
            if (translated_name) { list.items[i].name = translated_name; translated++; }
            await new Promise(r => setTimeout(r, 200));
        }
        save();
        if (typeof window.closeModal === 'function') window.closeModal('translateModal');
        progressDiv?.classList.add('hidden');
        if (typeof window.showNotification === 'function') window.showNotification(`✅ תורגמו ${translated} מוצרים!`);
    } catch (e) {
        progressDiv?.classList.add('hidden');
        if (typeof window.showNotification === 'function') window.showNotification('שגיאה בתרגום', 'error');
    }
}

async function translateText(text, targetLang) {
    try {
        const url  = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const data = await (await fetch(url)).json();
        return data?.[0]?.[0]?.[0] || null;
    } catch (e) {
        return null;
    }
}

// ============================================================
//  Receipt Scanning
// ============================================================
async function processReceipt() {
    const fileInput = _n('receiptImage');
    const file      = fileInput?.files[0];
    if (!file) {
        if (typeof window.showNotification === 'function') window.showNotification('אנא בחר תמונה', 'warning');
        return;
    }

    // Preview
    const preview    = _n('scanPreview');
    const previewImg = _n('previewImg');
    const r1         = new FileReader();
    r1.onload = (e) => { if (previewImg) previewImg.src = e.target.result; preview?.classList.remove('hidden'); };
    r1.readAsDataURL(file);

    const progressDiv = _n('scanProgress');
    const progressBar = _n('scanProgressBar');
    const statusDiv   = _n('scanStatus');
    const scanBtn     = _n('scanBtn');
    progressDiv?.classList.remove('hidden');
    if (scanBtn) { scanBtn.disabled = true; scanBtn.classList.add('opacity-50'); }

    const _resetBtn = () => { if (scanBtn) { scanBtn.disabled = false; scanBtn.classList.remove('opacity-50'); } };

    try {
        if (progressBar) progressBar.style.width = '30%';
        if (statusDiv)   statusDiv.textContent    = 'מעלה תמונה...';

        const base64Image = await new Promise((res, rej) => {
            const r2 = new FileReader();
            r2.onload = () => res(r2.result.split(',')[1]);
            r2.onerror = rej;
            r2.readAsDataURL(file);
        });

        if (progressBar) progressBar.style.width = '60%';
        if (statusDiv)   statusDiv.textContent    = 'מזהה טקסט...';

        const GOOGLE_API_KEY = window.GOOGLE_API_KEY || '';
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ image: { content: base64Image }, features: [{ type: 'TEXT_DETECTION' }] }] })
        });

        if (!response.ok) {
            const status = response.status;
            const msg = status === 403 ? 'שגיאת הרשאה - ה-API Key לא תקין'
                : status === 400 ? 'שגיאה בפורמט הבקשה'
                : status === 429 ? 'חרגת ממכסת ה-API'
                : 'שגיאה בסריקת הקבלה';
            throw new Error(`${msg} (${status})`);
        }

        const result = await response.json();
        if (result.responses?.[0]?.error) throw new Error(`שגיאת API: ${result.responses[0].error.message}`);

        if (progressBar) progressBar.style.width = '90%';
        if (statusDiv)   statusDiv.textContent    = 'מעבד תוצאות...';

        const text  = result.responses[0]?.fullTextAnnotation?.text || '';
        if (!text.trim()) {
            if (typeof window.showNotification === 'function') window.showNotification('לא זוהה טקסט בתמונה', 'warning');
            progressDiv?.classList.add('hidden'); _resetBtn(); return;
        }

        const items = parseReceiptText(text);
        if (items.length === 0) {
            if (typeof window.showNotification === 'function') window.showNotification('לא נמצאו מוצרים בקבלה', 'warning');
            progressDiv?.classList.add('hidden'); _resetBtn(); return;
        }

        if (progressBar) progressBar.style.width = '100%';
        if (statusDiv)   statusDiv.textContent    = 'הושלם!';

        createListFromReceipt(items);
        if (typeof window.closeModal === 'function') window.closeModal('receiptScanModal');
        progressDiv?.classList.add('hidden');
        preview?.classList.add('hidden');
        if (fileInput) fileInput.value = '';
        _resetBtn();
        if (typeof window.showNotification === 'function') window.showNotification(`✅ נוצרה רשימה עם ${items.length} מוצרים!`);

    } catch (error) {
        if (typeof window.showNotification === 'function') window.showNotification(error.message || 'שגיאה בסריקת הקבלה', 'error');
        progressDiv?.classList.add('hidden');
        _resetBtn();
    }
}

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 2) continue;
        if (/סה"כ|סהכ|total|sum|תאריך|date|קופה|קבלה|receipt|ח\.פ|חפ|vat|מע"מ|מעמ|ברקוד|barcode|תודה|thank|שעה|time|כתובת|address|טלפון|phone|אשראי|credit|מזומן|cash/i.test(line)) continue;

        const m1 = line.match(/^(.+?)\s+(₪|ש"ח|שח)?\s*([\d.,]+)\s*(₪|ש"ח|שח)?$/);
        if (m1) {
            const name  = m1[1].trim();
            const price = parseFloat(m1[3].replace(/,/g, '.'));
            if (name.length > 2 && !/^[\d\s]+$/.test(name) && price > 0 && price < 1000) {
                items.push({ name, price, qty: 1, checked: false, category: detectCategory(name), cloudId: _newCloudId() });
            }
            continue;
        }

        if (i < lines.length - 1) {
            const nextLine  = lines[i + 1].trim();
            const priceMatch = nextLine.match(/^(₪|ש"ח|שח)?\s*([\d.,]+)\s*(₪|ש"ח|שח)?$/);
            if (priceMatch) {
                const price = parseFloat(priceMatch[2].replace(/,/g, '.'));
                if (line.length > 2 && !/^[\d\s]+$/.test(line) && price > 0 && price < 1000) {
                    items.push({ name: line, price, qty: 1, checked: false, category: detectCategory(line), cloudId: _newCloudId() });
                    i++;
                }
            }
        }
    }
    return items;
}

function createListFromReceipt(items) {
    const newId    = 'L' + Date.now();
    const listName = 'קבלה - ' + new Date().toLocaleDateString('he-IL');
    db.lists[newId] = { name: listName, url: '', budget: 0, isTemplate: false, items };
    db.currentId    = newId;
    setActivePage('lists');
    save();
}

// ============================================================
//  Visibility / Focus listeners (clipboard re-check)
// ============================================================
function initClipboardListeners() {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setTimeout(() => checkClipboardOnStartup(), 500);
    });
    window.addEventListener('focus', () => {
        setTimeout(() => checkClipboardOnStartup(), 500);
    });
}

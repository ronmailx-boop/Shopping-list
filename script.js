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

// ========== Category Keywords ==========
const CATEGORY_KEYWORDS = {
    'פירות וירקות': [
        'עגבניות', 'עגבנייה', 'מלפפון', 'מלפפונים', 'חסה', 'חציל', 'גזר', 'בצל', 'שום', 'תפוח', 'תפוחים',
        'בננה', 'בננות', 'תפוז', 'תפוזים', 'אבוקדו', 'לימון', 'לימונים', 'תות', 'תותים', 'ענבים',
        'אבטיח', 'מלון', 'אפרסק', 'אפרסקים', 'שזיף', 'שזיפים', 'אגס', 'אגסים', 'תרד', 'כרוב',
        'ברוקולי', 'כרובית', 'פלפל', 'פלפלים', 'קישוא', 'קישואים', 'דלעת', 'תירס', 'פטריות',
        'ירקות', 'פירות', 'ירק', 'פרי', 'סלט', 'פטרוזיליה', 'כוסברה', 'נענע', 'בזיליקום'
    ],
    'בשר ודגים': [
        'בשר', 'עוף', 'תרנגולת', 'הודו', 'נקניק', 'נקניקיות', 'קבב', 'המבורגר', 'שניצל',
        'סטייק', 'אנטריקוט', 'צלי', 'כבד', 'לב', 'קורנדביף', 'סלמי', 'נתחי', 'כנפיים',
        'דג', 'דגים', 'סלמון', 'טונה', 'בקלה', 'אמנון', 'דניס', 'לוקוס', 'מושט', 'בורי',
        'שרימפס', 'קלמרי', 'פירות ים', 'סרדינים', 'מקרל'
    ],
    'חלב וביצים': [
        'חלב', 'גבינה', 'גבינות', 'קוטג', 'קוטג׳', 'יוגורט', 'שמנת', 'חמאה', 'ביצים', 'ביצה',
        'לבן', 'לבנה', 'צפתית', 'בולגרית', 'צהובה', 'מוצרלה', 'פרמזן', 'עמק', 'גילה',
        'גד', 'תנובה', 'שטראוס', 'יופלה', 'דנונה', 'מילקי', 'פודינג', 'חלבון', 'מעדן',
        'גלידה', 'גלידות', 'חלבי', 'חלביים'
    ],
    'לחם ומאפים': [
        'לחם', 'לחמניה', 'לחמניות', 'פיתה', 'פיתות', 'בגט', 'חלה', 'חלות', 'טוסט', 'כריך',
        'רוגלך', 'בורקס', 'בורקסים', 'קרואסון', 'קרואסונים', 'מאפה', 'מאפים', 'עוגה', 'עוגות',
        'עוגיות', 'עוגייה', 'ביסקוויט', 'קרקר', 'קרקרים', 'פריכיות', 'לחמית', 'בייגל',
        'מצה', 'מצות', 'פיצה', 'פסטה', 'ספגטי', 'מקרוני', 'אטריות', 'קוסקוס', 'בורגול',
        'קמח', 'שמרים', 'אבקת אפייה', 'סוכר', 'אורז', 'פתיתים'
    ],
    'שימורים': [
        'שימורים', 'קופסא', 'קופסת', 'שימורי', 'תירס שימורי', 'פטריות שימורי', 'זיתים',
        'מלפפונים חמוצים', 'חמוצים', 'כבושים', 'רוטב עגבניות', 'עגבניות מרוסקות', 'ממרח',
        'טונה קופסא', 'סרדינים קופסא', 'הומוס', 'טחינה', 'חומוס', 'פול', 'חומוס מוכן',
        'סלט', 'פסטה מוכנה', 'רוטב', 'רטבים', 'קטשופ', 'מיונז', 'חרדל', 'ריבה', 'דבש',
        'ממרחים', 'נוטלה', 'שוקולד ממרח'
    ],
    'חטיפים': [
        'חטיף', 'חטיפים', 'במבה', 'ביסלי', 'דוריטוס', 'צ׳יפס', 'צ׳יטוס', 'אפרופו', 'טורטית',
        'פופקורן', 'בוטנים', 'אגוזים', 'שקדים', 'קשיו', 'פיסטוק', 'גרעינים', 'צימוקים',
        'פירות יבשים', 'תמרים', 'משמש מיובש', 'שוקולד', 'ממתק', 'ממתקים', 'סוכריות',
        'גומי', 'מנטה', 'מסטיק', 'וופל', 'וופלים', 'חטיף אנרגיה', 'חטיף חלבון', 'גרנולה',
        'בר', 'ברים', 'קליק', 'פסק זמן', 'קינדר', 'מרס', 'סניקרס', 'טוויקס', 'קיט קט'
    ],
    'משקאות': [
        'מים', 'מי', 'מינרלים', 'נביעות', 'עדן', 'נווה', 'קולה', 'פפסי', 'ספרייט', 'פאנטה',
        'שוופס', 'סודה', 'משקה', 'משקאות', 'מיץ', 'מיצים', 'תפוזים', 'פריגת', 'פרימור',
        'בירה', 'יין', 'וודקה', 'ויסקי', 'אלכוהול', 'קפה', 'נס', 'נסקפה', 'תה', 'תיונים',
        'ויסוצקי', 'חליבה', 'שוקו', 'חלב שוקולד', 'אייס קפה', 'אנרגיה', 'רד בול', 'XL',
        'פחית', 'בקבוק', 'שתייה', 'לימונדה', 'לימונענע', 'תפוזינה'
    ],
    'ניקיון': [
        'סבון', 'סבונים', 'ניקוי', 'ניקיון', 'דטרגנט', 'אבקת כביסה', 'מרכך', 'מרככים',
        'אקונומיקה', 'סנו', 'כלורקס', 'ווניש', 'פרסיל', 'אריאל', 'ביומט', 'סיף', 'מטליות',
        'ספוג', 'ספוגים', 'מגבונים', 'נייר מגבת', 'נייר טואלט', 'טישו', 'מברשת', 'מברשות',
        'שואב', 'שקיות אשפה', 'אשפה', 'סמרטוט', 'דלי', 'מנקה', 'מנקים', 'אקונומיקה',
        'ג׳ל כלים', 'נוזל כלים', 'פיירי', 'סודה לשתייה', 'חומץ', 'אלכוהול ניקוי', 'כפפות'
    ],
    'היגיינה': [
        'שמפו', 'מרכך שיער', 'סבון גוף', 'ג׳ל רחצה', 'משחת שיניים', 'מברשת שיניים', 'חוט דנטלי',
        'דאודורנט', 'בושם', 'קרם', 'קרמים', 'תחליב', 'לוסיון', 'קצף גילוח', 'סכין גילוח',
        'מכונת גילוח', 'ג׳ילט', 'ואקס', 'תחבושות', 'פלסטרים', 'צמר גפן', 'מקלוני אוזניים',
        'טמפונים', 'תחבושות היגייניות', 'מגבונים לחים', 'חיתולים', 'האגיס', 'פמפרס',
        'קרם ידיים', 'קרם פנים', 'מסכה', 'מסכות', 'איפור', 'שפתון', 'מסקרה', 'טיפוח'
    ]
};

// Function to detect category from product name
function detectCategory(productName) {
    if (!productName) return '';

    const nameLower = productName.toLowerCase().trim();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    return ''; // Return empty string if no match (will become 'כללי' in render)
}


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
let highlightedItemIndex = null;
let highlightedListId = null;
let categorySortEnabled = localStorage.getItem('categorySortEnabled') === 'true' || false;


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

function toggleCategorySorting() {
    categorySortEnabled = !categorySortEnabled;
    localStorage.setItem('categorySortEnabled', categorySortEnabled);

    const btn = document.getElementById('categorySortText');
    if (btn) {
        // Show current active state, not next action
        btn.textContent = categorySortEnabled ? '🔤 מיון לפי קטגוריות' : '📋 מיון ידני';
    }

    render();
    showNotification(categorySortEnabled ? '✅ מיון לפי קטגוריות מופעל' : '✅ מיון ידני מופעל');
}


// ========== Voice Input Functions ==========
let recognition = null;
let isRecording = false;

function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();

    recog.lang = 'he-IL'; // Hebrew
    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    return recog;
}

function startVoiceInput() {
    if (!recognition) {
        recognition = initVoiceRecognition();
        if (!recognition) {
            showNotification('הדפדפן לא תומך בזיהוי קולי', 'error');
            return;
        }
    }

    if (isRecording) {
        stopVoiceInput();
        return;
    }

    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.classList.add('recording');
    isRecording = true;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        parseVoiceInput(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopVoiceInput();
        if (event.error === 'no-speech') {
            showNotification('לא זוהה דיבור, נסה שוב', 'warning');
        } else {
            showNotification('שגיאה בזיהוי קולי', 'error');
        }
    };

    recognition.onend = () => {
        stopVoiceInput();
    };

    try {
        recognition.start();
        showNotification('🎤 מקשיב...', 'success');
    } catch (error) {
        console.error('Error starting recognition:', error);
        stopVoiceInput();
        showNotification('שגיאה בהפעלת המיקרופון', 'error');
    }
}

function stopVoiceInput() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.classList.remove('recording');
    }
    isRecording = false;

    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            // Already stopped
        }
    }
}

function parseVoiceInput(text) {
    console.log('Voice input:', text);

    // Common separators in Hebrew
    const separators = [
        'ו', 'וגם', 'גם', ',', 'עוד', 'בנוסף', 'ועוד'
    ];

    // Build regex pattern
    const pattern = new RegExp(`\\s+(${separators.join('|')})\\s+`, 'gi');

    // Split by separators
    let items = text.split(pattern).filter(item => {
        const trimmed = item.trim();
        // Filter out the separators themselves and empty strings
        return trimmed && !separators.some(sep => sep.toLowerCase() === trimmed.toLowerCase());
    });

    // Clean up common phrases
    const phrasesToRemove = [
        'צריך לקנות', 'לקנות', 'קנה', 'תקנה', 'רוצה', 'צריך'
    ];

    items = items.map(item => {
        let cleaned = item.trim();
        phrasesToRemove.forEach(phrase => {
            const regex = new RegExp(`^${phrase}\\s+`, 'gi');
            cleaned = cleaned.replace(regex, '');
        });
        return cleaned.trim();
    }).filter(item => item.length > 0);

    if (items.length === 0) {
        showNotification('לא זוהו מוצרים, נסה שוב', 'warning');
        return;
    }

    // Smart behavior: single item fills the form, multiple items add directly
    if (items.length === 1) {
        // Fill the input field with the single item
        const itemName = items[0];
        const category = detectCategory(itemName);

        document.getElementById('itemName').value = itemName;
        if (category) {
            document.getElementById('itemCategory').value = category;
        }
        document.getElementById('itemPrice').focus();

        showNotification(`🎤 "${itemName}" - הוסף מחיר או לחץ הוסף`);
    } else {
        // Multiple items - add them all and close modal
        let addedCount = 0;
        items.forEach(itemName => {
            if (itemName) {
                const category = detectCategory(itemName);
                db.lists[db.currentId].items.push({
                    name: itemName,
                    price: 0,
                    qty: 1,
                    checked: false,
                    category: category
                });
                addedCount++;
            }
        });

        save();
        closeModal('inputForm');
        showNotification(`✅ נוספו ${addedCount} מוצרים: ${items.join(', ')}`);
    }
}


// ========== Translation Functions ==========
async function performTranslation() {
    const targetLang = document.getElementById('targetLanguage').value;
    const list = db.lists[db.currentId];

    if (!list || list.items.length === 0) {
        showNotification('אין מוצרים לתרגום', 'warning');
        return;
    }

    const progressDiv = document.getElementById('translationProgress');
    const statusDiv = document.getElementById('translationStatus');
    progressDiv.classList.remove('hidden');

    let translated = 0;
    const total = list.items.length;

    try {
        for (let i = 0; i < list.items.length; i++) {
            const item = list.items[i];
            statusDiv.textContent = `מתרגם ${i + 1} מתוך ${total}...`;

            const translatedName = await translateText(item.name, targetLang);
            if (translatedName) {
                list.items[i].name = translatedName;
                translated++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        save();
        closeModal('translateModal');
        progressDiv.classList.add('hidden');
        showNotification(`✅ תורגמו ${translated} מוצרים!`);
    } catch (error) {
        console.error('Translation error:', error);
        progressDiv.classList.add('hidden');
        showNotification('שגיאה בתרגום', 'error');
    }
}

async function translateText(text, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }
        return null;
    } catch (error) {
        console.error('Translation API error:', error);
        return null;
    }
}

// ========== Receipt Scanning Functions ==========
async function processReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('אנא בחר תמונה', 'warning');
        return;
    }

    // Show preview
    const preview = document.getElementById('scanPreview');
    const previewImg = document.getElementById('previewImg');
    const reader = new FileReader();

    reader.onload = function (e) {
        previewImg.src = e.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    // Show progress
    const progressDiv = document.getElementById('scanProgress');
    const progressBar = document.getElementById('scanProgressBar');
    const statusDiv = document.getElementById('scanStatus');
    const scanBtn = document.getElementById('scanBtn');

    progressDiv.classList.remove('hidden');
    scanBtn.disabled = true;
    scanBtn.classList.add('opacity-50');

    try {
        const { data: { text } } = await Tesseract.recognize(
            file,
            'heb+eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        progressBar.style.width = progress + '%';
                        statusDiv.textContent = `מזהה טקסט... ${progress}%`;
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                preserve_interword_spaces: '1'
            }
        );

        console.log('OCR Result:', text);

        // Parse receipt
        const items = parseReceiptText(text);

        if (items.length === 0) {
            showNotification('לא נמצאו מוצרים בקבלה', 'warning');
            progressDiv.classList.add('hidden');
            scanBtn.disabled = false;
            scanBtn.classList.remove('opacity-50');
            return;
        }

        // Create new list from receipt
        createListFromReceipt(items);

        closeModal('receiptScanModal');
        progressDiv.classList.add('hidden');
        preview.classList.add('hidden');
        fileInput.value = '';
        scanBtn.disabled = false;
        scanBtn.classList.remove('opacity-50');

        showNotification(`✅ נוצרה רשימה עם ${items.length} מוצרים!`);

    } catch (error) {
        console.error('OCR Error:', error);
        showNotification('שגיאה בסריקת הקבלה', 'error');
        progressDiv.classList.add('hidden');
        scanBtn.disabled = false;
        scanBtn.classList.remove('opacity-50');
    }
}

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];

    // Common patterns for receipt items
    // Pattern 1: "Item Name 12.50" or "Item Name ₪12.50"
    // Pattern 2: "Item Name" followed by price on next line

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 2) continue;

        // Skip common receipt headers/footers (Hebrew and English)
        if (line.match(/סה"כ|סהכ|total|sum|תאריך|date|קופה|קבלה|receipt|ח\.פ|חפ|vat|מע"מ|מעמ|ברקוד|barcode|תודה|thank|שעה|time|כתובת|address|טלפון|phone|אשראי|credit|מזומן|cash/i)) continue;

        // Pattern: Name followed by price (12.50 or ₪12.50 or ש"ח12.50)
        // Support both Hebrew (₪, ש"ח) and English formats
        const match1 = line.match(/^(.+?)\s+(₪|ש"ח|שח)?\s*([\d.,]+)\s*(₪|ש"ח|שח)?$/);
        if (match1) {
            const name = match1[1].trim();
            const priceStr = match1[3].replace(/,/g, '.').trim(); // Handle comma as decimal separator
            const price = parseFloat(priceStr);

            if (name.length > 2 && !name.match(/^[\d\s]+$/) && price > 0 && price < 1000) {
                items.push({
                    name: name,
                    price: price,
                    qty: 1,
                    checked: false,
                    category: detectCategory(name)
                });
            }
            continue;
        }

        // Pattern: Just a name, check next line for price
        if (i < lines.length - 1) {
            const nextLine = lines[i + 1].trim();
            // Support Hebrew (₪, ש"ח) and English price formats
            const priceMatch = nextLine.match(/^(₪|ש"ח|שח)?\s*([\d.,]+)\s*(₪|ש"ח|שח)?$/);
            if (priceMatch) {
                const priceStr = priceMatch[2].replace(/,/g, '.').trim();
                const price = parseFloat(priceStr);
                if (line.length > 2 && !line.match(/^[\d\s]+$/) && price > 0 && price < 1000) {
                    items.push({
                        name: line,
                        price: price,
                        qty: 1,
                        checked: false,
                        category: detectCategory(line)
                    });
                    i++; // Skip next line since we used it
                }
            }
        }
    }

    return items;
}

function createListFromReceipt(items) {
    const newId = 'L' + Date.now();
    const listName = 'קבלה - ' + new Date().toLocaleDateString('he-IL');

    db.lists[newId] = {
        name: listName,
        url: '',
        budget: 0,
        isTemplate: false,
        items: items
    };

    db.currentId = newId;
    activePage = 'lists';
    save();
}

function toggleBottomBar() {
    const bottomBar = document.querySelector('.bottom-bar');
    const toggleBtn = document.getElementById('floatingToggle');

    if (bottomBar.classList.contains('minimized')) {
        bottomBar.classList.remove('minimized');
        toggleBtn.classList.remove('bar-hidden');
    } else {
        bottomBar.classList.add('minimized');
        toggleBtn.classList.add('bar-hidden');
    }
}

function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('active');

    if (id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemCategory').value = '';

        // Setup autocomplete
        const itemNameInput = document.getElementById('itemName');
        itemNameInput.oninput = function () {
            showAutocompleteSuggestions(this.value);
        };
        itemNameInput.onblur = function () {
            hideAutocompleteSuggestions();
        };

        setTimeout(() => itemNameInput.focus(), 150);
    }

    if (id === 'newListModal') {
        document.getElementById('newListNameInput').value = '';
        document.getElementById('newListUrlInput').value = '';
        document.getElementById('newListBudget').value = '';
        document.getElementById('newListTemplate').checked = false;
        setTimeout(() => document.getElementById('newListNameInput').focus(), 150);
    }

    if (id === 'editListNameModal') {
        const list = db.lists[db.currentId];
        document.getElementById('editListNameInput').value = list.name;
        document.getElementById('editListUrlInput').value = list.url || '';
        document.getElementById('editListBudget').value = list.budget || '';
        setTimeout(() => document.getElementById('editListNameInput').focus(), 150);
    }

    if (id === 'editTotalModal') {
        setTimeout(() => document.getElementById('editTotalInput').focus(), 150);
    }

    if (id === 'importModal') {
        document.getElementById('importText').value = '';
        setTimeout(() => document.getElementById('importText').focus(), 150);
    }

    if (id === 'historyModal') {
        renderHistory();
    }

    if (id === 'templatesModal') {
        renderTemplates();
    }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
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

// ========== Autocomplete Functions ==========
function getProductHistory() {
    const productMap = {};

    // Extract products from history
    if (db.history && db.history.length > 0) {
        db.history.forEach(entry => {
            entry.items.forEach(item => {
                const name = item.name.trim();
                // Keep the most recent price for each product
                if (!productMap[name] || productMap[name].lastUsed < entry.completedAt) {
                    productMap[name] = {
                        price: item.price,
                        category: item.category || '',
                        lastUsed: entry.completedAt
                    };
                }
            });
        });
    }

    return productMap;
}

function showAutocompleteSuggestions(searchTerm) {
    const container = document.getElementById('autocompleteContainer');
    if (!container) return;

    if (!searchTerm || searchTerm.length < 2) {
        container.classList.remove('active');
        container.innerHTML = '';
        return;
    }

    const productHistory = getProductHistory();
    const searchLower = searchTerm.toLowerCase();

    // Filter products that match the search term
    const matches = Object.entries(productHistory)
        .filter(([name]) => name.toLowerCase().includes(searchLower))
        .sort((a, b) => b[1].lastUsed - a[1].lastUsed) // Sort by most recent
        .slice(0, 5); // Limit to 5 suggestions

    if (matches.length === 0) {
        container.classList.remove('active');
        container.innerHTML = '';
        return;
    }

    // Build HTML for suggestions
    container.innerHTML = matches.map(([name, data]) => `
        <div class="autocomplete-item" onclick="selectAutocompleteSuggestion('${name.replace(/'/g, "\\'")}', ${data.price}, '${data.category.replace(/'/g, "\\'")}')">
            <div>
                <div class="autocomplete-item-name">${name}</div>
                ${data.category ? `<div class="autocomplete-item-category">${data.category}</div>` : ''}
            </div>
            <div class="autocomplete-item-price">₪${data.price.toFixed(2)}</div>
        </div>
    `).join('');

    container.classList.add('active');
}

function selectAutocompleteSuggestion(name, price, category) {
    document.getElementById('itemName').value = name;
    document.getElementById('itemPrice').value = price;

    // Use provided category or auto-detect
    const finalCategory = category || detectCategory(name);
    if (finalCategory) {
        document.getElementById('itemCategory').value = finalCategory;
    }

    // Hide autocomplete
    const container = document.getElementById('autocompleteContainer');
    if (container) {
        container.classList.remove('active');
        container.innerHTML = '';
    }

    // Focus on price field for easy editing
    setTimeout(() => document.getElementById('itemPrice').focus(), 100);
}

function hideAutocompleteSuggestions() {
    const container = document.getElementById('autocompleteContainer');
    if (container) {
        setTimeout(() => {
            container.classList.remove('active');
            container.innerHTML = '';
        }, 200);
    }
}

// ========== Search Functions ==========
function searchInList() {
    const searchTerm = document.getElementById('listSearchInput').value.toLowerCase().trim();
    const list = db.lists[db.currentId];

    if (!searchTerm) {
        highlightedItemIndex = null;
        render();
        return;
    }

    const matches = list.items.map((item, idx) => ({
        item,
        idx,
        matches: item.name.toLowerCase().includes(searchTerm)
    })).filter(m => m.matches);

    if (matches.length === 0) {
        showNotification('לא נמצא מוצר', 'warning');
        return;
    }

    // Show first match highlighted
    const firstMatch = matches[0];
    highlightedItemIndex = firstMatch.idx;
    render();

    // Scroll to highlighted item
    setTimeout(() => {
        const itemCard = document.querySelector(`[data-id="${firstMatch.idx}"]`);
        if (itemCard) {
            itemCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function clearListSearch() {
    document.getElementById('listSearchInput').value = '';
    highlightedItemIndex = null;
    render();
}

// Search in summary (lists)
function searchInSummary() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    if (!searchTerm) {
        highlightedListId = null;
        render();
        return;
    }

    const matches = Object.keys(db.lists).filter(id => {
        const l = db.lists[id];
        return l.name.toLowerCase().includes(searchTerm) ||
            (l.url && l.url.toLowerCase().includes(searchTerm)) ||
            l.items.some(i => i.name.toLowerCase().includes(searchTerm));
    });

    if (matches.length > 0) {
        highlightedListId = matches[0];
        render();

        setTimeout(() => {
            const listCard = document.querySelector(`[data-id="${matches[0]}"]`);
            if (listCard) {
                listCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    } else {
        highlightedListId = null;
        render();
    }
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : activePage === 'summary' ? 'summaryContainer' : null);
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;
    document.getElementById('tabStats').className = `tab-btn ${activePage === 'stats' ? 'tab-active' : ''}`;

    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    if (btn && path && tag) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
        tag.innerText = isLocked ? "נעול" : "עריכה (גרירה פעילה)";
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');

        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;


        if (container) {
            container.innerHTML = '';

            // Update category sort button text
            const categorySortText = document.getElementById('categorySortText');
            if (categorySortText) {
                categorySortText.textContent = categorySortEnabled ? '📋 מיון ידני' : '🔤 מיון לפי קטגוריות';
            }

            if (categorySortEnabled) {
                // Category sorting mode
                const categoryOrder = [
                    'פירות וירקות',
                    'בשר ודגים',
                    'חלב וביצים',
                    'לחם ומאפים',
                    'שימורים',
                    'חטיפים',
                    'משקאות',
                    'ניקיון',
                    'היגיינה',
                    'אחר',
                    'כללי'
                ];

                // Group items by category
                const categorizedItems = {};
                list.items.forEach((item, idx) => {
                    const category = item.category || 'כללי';
                    if (!categorizedItems[category]) {
                        categorizedItems[category] = [];
                    }
                    categorizedItems[category].push({ item, idx });
                });

                // Render by category
                let itemNumber = 1;
                categoryOrder.forEach(category => {
                    if (categorizedItems[category] && categorizedItems[category].length > 0) {
                        // Render category header
                        const categoryHeader = document.createElement('div');
                        categoryHeader.className = 'category-separator';
                        categoryHeader.style.background = `linear-gradient(135deg, ${CATEGORIES[category] || '#6b7280'} 0%, ${CATEGORIES[category] || '#6b7280'}dd 100%)`;
                        categoryHeader.innerHTML = `
                            <div class="text-lg font-black">${category} (${categorizedItems[category].length})</div>
                        `;
                        container.appendChild(categoryHeader);

                        // Render items in this category
                        categorizedItems[category].forEach(({ item, idx }) => {
                            const sub = item.price * item.qty;
                            total += sub;
                            if (item.checked) paid += sub;

                            const categoryBadge = item.category ? `<span class="category-badge" style="background: ${CATEGORIES[item.category] || '#6b7280'}20; color: ${CATEGORIES[item.category] || '#6b7280'}">${item.category}</span>` : '';

                            const isHighlighted = highlightedItemIndex === idx;
                            const div = document.createElement('div');
                            div.className = "item-card";
                            div.setAttribute('data-id', idx);
                            if (isHighlighted) {
                                div.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                                div.style.border = '3px solid #f59e0b';
                                div.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
                            }
                            div.innerHTML = `
                                <div class="flex justify-between items-center mb-4">
                                    <div class="flex items-center gap-3 flex-1">
                                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                                        <div class="flex-1">
                                            <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                                                <span class="item-number">${itemNumber}.</span> ${item.name}
                                            </div>
                                            ${categoryBadge}
                                        </div>
                                    </div>
                                    <button onclick="removeItem(${idx})" class="trash-btn">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                                        <span class="font-bold w-6 text-center">${item.qty}</span>
                                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                                    </div>
                                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                                </div>
                            `;
                            container.appendChild(div);
                            itemNumber++;
                        });
                    }
                });
            } else {
                // Manual sorting mode (original behavior)
                list.items.forEach((item, idx) => {
                    const sub = item.price * item.qty;
                    total += sub;
                    if (item.checked) paid += sub;

                    const categoryBadge = item.category ? `<span class="category-badge" style="background: ${CATEGORIES[item.category] || '#6b7280'}20; color: ${CATEGORIES[item.category] || '#6b7280'}">${item.category}</span>` : '';

                    const isHighlighted = highlightedItemIndex === idx;
                    const div = document.createElement('div');
                    div.className = "item-card";
                    div.setAttribute('data-id', idx);
                    if (isHighlighted) {
                        div.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                        div.style.border = '3px solid #f59e0b';
                        div.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
                    }
                    div.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <div class="flex items-center gap-3 flex-1">
                                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                                <div class="flex-1">
                                    <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                                        <span class="item-number">${idx + 1}.</span> ${item.name}
                                    </div>
                                    ${categoryBadge}
                                </div>
                            </div>
                            <button onclick="removeItem(${idx})" class="trash-btn">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                                <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                                <span class="font-bold w-6 text-center">${item.qty}</span>
                                <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                            </div>
                            <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                        </div>
                    `;
                    container.appendChild(div);
                });
            }


            // Add scroll listener to remove highlight
            if (highlightedItemIndex !== null) {
                const removeHighlight = () => {
                    highlightedItemIndex = null;
                    container.removeEventListener('scroll', removeHighlight);
                    window.removeEventListener('scroll', removeHighlight);
                    render();
                };
                container.addEventListener('scroll', removeHighlight, { once: true });
                window.addEventListener('scroll', removeHighlight, { once: true });
            }
        }

        const budgetWarning = document.getElementById('budgetWarning');
        if (budgetWarning && list.budget > 0 && total > list.budget) {
            const overBudget = total - list.budget;
            budgetWarning.innerHTML = `⚠️ חריגה מתקציב: ₪${overBudget.toFixed(2)}`;
            budgetWarning.classList.remove('hidden');
        } else if (budgetWarning) {
            budgetWarning.classList.add('hidden');
        }

    } else if (activePage === 'summary') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        document.getElementById('pageStats').classList.add('hidden');

        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        if (container) {
            container.innerHTML = '';
            Object.keys(db.lists).forEach(id => {
                const l = db.lists[id];

                const matchesName = l.name.toLowerCase().includes(searchTerm);
                const matchesURL = l.url && l.url.toLowerCase().includes(searchTerm);
                const matchesItems = l.items.some(i => i.name.toLowerCase().includes(searchTerm));

                if (searchTerm && !matchesName && !matchesURL && !matchesItems) return;

                let lT = 0, lP = 0;
                l.items.forEach(i => {
                    const s = i.price * i.qty;
                    lT += s;
                    if (i.checked) lP += s;
                });
                const isSel = db.selectedInSummary.includes(id);
                if (isSel) {
                    total += lT;
                    paid += lP;
                }

                const templateBadge = l.isTemplate ? '<span class="template-badge">תבנית</span>' : '';
                const isHighlighted = highlightedListId === id;
                const div = document.createElement('div');
                div.className = "item-card";
                div.dataset.id = id;
                div.style.background = isHighlighted ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' : '';
                div.style.border = isHighlighted ? '3px solid #0ea5e9' : '';
                div.style.boxShadow = isHighlighted ? '0 8px 20px rgba(14, 165, 233, 0.3)' : '';

                const webBtn = l.url ? `
                    <button onclick="window.location.href='${l.url.startsWith('http') ? l.url : 'https://' + l.url}'" class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm ml-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                        </svg>
                    </button>
                ` : '';

                div.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-3 flex-1">
                            <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                            <div class="flex-1 text-2xl font-bold cursor-pointer" onclick="db.currentId='${id}'; showPage('lists')">
                                ${templateBadge}${l.name}
                            </div>
                        </div>
                        <div class="flex items-center">
                            ${webBtn}
                            <button onclick="prepareDeleteList('${id}')" class="trash-btn">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">${l.items.length} מוצרים</div>
                        <span class="text-2xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                    </div>
                `;
                container.appendChild(div);
            });

            // Add scroll listener to remove highlight for lists
            if (highlightedListId !== null) {
                const removeHighlight = () => {
                    highlightedListId = null;
                    container.removeEventListener('scroll', removeHighlight);
                    window.removeEventListener('scroll', removeHighlight);
                    render();
                };
                container.addEventListener('scroll', removeHighlight, { once: true });
                window.addEventListener('scroll', removeHighlight, { once: true });
            }
        }
    } else if (activePage === 'stats') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.remove('hidden');
        renderStats();
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== Stats Functions ==========
function renderStats() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (!db.stats.monthlyData[monthKey]) {
        db.stats.monthlyData[monthKey] = 0;
    }

    const monthlyTotal = db.stats.monthlyData[monthKey] || 0;
    document.getElementById('monthlyTotal').innerText = `₪${monthlyTotal.toFixed(2)}`;
    document.getElementById('completedLists').innerText = db.stats.listsCompleted || 0;

    const avgPerList = db.stats.listsCompleted > 0 ? db.stats.totalSpent / db.stats.listsCompleted : 0;
    document.getElementById('avgPerList').innerText = `₪${avgPerList.toFixed(0)}`;

    const monthlyProgress = Math.min((monthlyTotal / 5000) * 100, 100);
    document.getElementById('monthlyProgress').style.width = `${monthlyProgress}%`;

    renderMonthlyChart();
    renderPopularItems();
}

function showCompletedListsModal() {
    if (db.history.length === 0) {
        showNotification('אין רשימות שהושלמו', 'warning');
        return;
    }
    openModal('completedListsModal');
    renderCompletedLists();
}

function renderCompletedLists() {
    const container = document.getElementById('completedListsContent');
    if (!container) return;

    container.innerHTML = '';

    if (db.history.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין רשימות שהושלמו</p>';
        return;
    }

    db.history.slice().reverse().forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-4 bg-green-50 rounded-xl border border-green-200';
        const date = new Date(entry.completedAt);

        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-green-800">✅ ${entry.name}</span>
                <span class="text-xs text-green-600">${date.toLocaleDateString('he-IL')}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-green-700">${entry.items.length} מוצרים</span>
                <span class="text-green-600 font-black text-lg">₪${entry.total.toFixed(2)}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    const monthlyData = db.stats.monthlyData || {};
    const sortedKeys = Object.keys(monthlyData).sort();
    const last6Months = sortedKeys.slice(-6);

    const labels = last6Months.map(key => {
        const [year, month] = key.split('-');
        return `${month}/${year.slice(2)}`;
    });

    const data = last6Months.map(key => monthlyData[key] || 0);

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'הוצאות חודשיות',
                data: data,
                borderColor: '#7367f0',
                backgroundColor: 'rgba(115, 103, 240, 0.1)',
                tension: 0.4,
                fill: true
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
                        callback: function (value) {
                            return '₪' + value;
                        }
                    }
                }
            }
        }
    });
}

function renderPopularItems() {
    const itemCounts = {};

    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            if (!itemCounts[item.name]) {
                itemCounts[item.name] = 0;
            }
            itemCounts[item.name]++;
        });
    });

    const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const container = document.getElementById('popularItems');
    if (!container) return;

    container.innerHTML = '';
    sorted.forEach(([name, count]) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center mb-3 p-3 bg-gray-50 rounded-xl';
        div.innerHTML = `
            <span class="font-bold">${name}</span>
            <span class="text-indigo-600 font-black">${count}×</span>
        `;
        container.appendChild(div);
    });

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">אין מספיק נתונים</p>';
    }
}

function renderHistory() {
    const container = document.getElementById('historyContent');
    if (!container) return;

    container.innerHTML = '';

    if (db.history.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין רשימות בהיסטוריה</p>';
        return;
    }

    db.history.slice().reverse().forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200';
        const date = new Date(entry.completedAt);

        // Product list
        let productsList = '<div class="mt-3 mb-3 space-y-1">';
        entry.items.forEach((item, i) => {
            const itemTotal = (item.price * item.qty).toFixed(2);
            productsList += `
                <div class="flex justify-between items-center text-sm py-1 border-b border-gray-200">
                    <span class="text-gray-700">${i + 1}. ${item.name} ${item.category ? '(' + item.category + ')' : ''}</span>
                    <div class="flex gap-2 items-center">
                        <span class="text-gray-500">x${item.qty}</span>
                        <span class="text-indigo-600 font-bold">₪${itemTotal}</span>
                    </div>
                </div>
            `;
        });
        productsList += '</div>';

        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-lg">${entry.name}</span>
                <span class="text-xs text-gray-500">${date.toLocaleDateString('he-IL')}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">${entry.items.length} מוצרים</span>
                <span class="text-indigo-600 font-black text-xl">₪${entry.total.toFixed(2)}</span>
            </div>
            ${productsList}
            <button onclick="restoreFromHistory(${db.history.length - 1 - idx})" class="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
                📋 שחזר רשימה זו
            </button>
        `;
        container.appendChild(div);
    });
}

function renderTemplates() {
    const container = document.getElementById('templatesContent');
    if (!container) return;

    container.innerHTML = '';

    const templates = Object.entries(db.lists).filter(([_, list]) => list.isTemplate);

    if (templates.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין תבניות שמורות</p>';
        return;
    }

    templates.forEach(([id, template]) => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200';
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-yellow-800">⭐ ${template.name}</span>
            </div>
            <div class="text-sm text-yellow-700 mb-3">${template.items.length} מוצרים</div>
            <button onclick="createFromTemplate('${id}')" class="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-bold">
                צור רשימה מתבנית
            </button>
        `;
        container.appendChild(div);
    });
}

function createFromTemplate(templateId) {
    const template = db.lists[templateId];
    if (!template) return;

    const newId = 'L' + Date.now();
    db.lists[newId] = {
        name: template.name + ' - ' + new Date().toLocaleDateString('he-IL'),
        url: template.url,
        budget: template.budget,
        isTemplate: false,
        items: JSON.parse(JSON.stringify(template.items.map(item => ({ ...item, checked: false }))))
    };

    db.currentId = newId;
    activePage = 'lists';
    closeModal('templatesModal');
    save();
    showNotification('✅ רשימה נוצרה מתבנית!');
}

function restoreFromHistory(idx) {
    const entry = db.history[idx];
    if (!entry) return;

    const newId = 'L' + Date.now();
    db.lists[newId] = {
        name: entry.name + ' (משוחזר)',
        url: entry.url || '',
        budget: 0,
        isTemplate: false,
        items: JSON.parse(JSON.stringify(entry.items.map(item => ({ ...item, checked: false }))))
    };

    db.currentId = newId;
    activePage = 'lists';
    closeModal('historyModal');
    save();
    showNotification('✅ רשימה שוחזרה!');
}

// תיקון פונקציית סיום רשימה
function completeList() {
    const list = db.lists[db.currentId];
    if (!list || list.items.length === 0) {
        showNotification('הרשימה ריקה!', 'warning');
        closeModal('confirmModal');
        return;
    }

    const total = list.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // שמירה להיסטוריה
    db.history.push({
        name: list.name,
        url: list.url,
        items: JSON.parse(JSON.stringify(list.items)),
        total: total,
        completedAt: Date.now()
    });

    // עדכון סטטיסטיקות
    db.stats.totalSpent += total;
    db.stats.listsCompleted++;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!db.stats.monthlyData[monthKey]) {
        db.stats.monthlyData[monthKey] = 0;
    }
    db.stats.monthlyData[monthKey] += total;

    // ניקוי הרשימה הנוכחית
    list.items = [];

    closeModal('confirmModal');

    // מעבר לדף סטטיסטיקות כדי לראות את השינוי
    activePage = 'stats';

    save();
    showNotification('✅ הרשימה הושלמה ונשמרה בהיסטוריה!');
}

function toggleTemplateMode() {
    const list = db.lists[db.currentId];
    list.isTemplate = !list.isTemplate;
    save();
    showNotification(list.isTemplate ? '⭐ נשמר כתבנית' : '✅ הוסר מתבניות');
}

// ========== Item Management ==========
async function shareNative(type) {
    let title = "";
    let text = "";

    if (type === 'list') {
        const list = db.lists[db.currentId];
        if (list.items.length === 0) return;
        title = `Vplus - ${list.name}`;
        text = `🛒 *${list.name}:*\n\n`;
        list.items.forEach((i, idx) => {
            const catEmoji = i.category ? i.category.split(' ')[0] : '';
            text += `${idx + 1}. ${i.checked ? '✅' : '⬜'} *${i.name}* ${catEmoji} (x${i.qty}) - ₪${(i.price * i.qty).toFixed(2)}\n`;
        });
        text += `\n💰 *סה"כ: ₪${document.getElementById('displayTotal').innerText}*`;
    } else {
        const selectedIds = db.selectedInSummary;
        if (selectedIds.length === 0) {
            alert("בחר לפחות רשימה אחת לשיתוף!");
            return;
        }
        title = "Vplus - ריכוז רשימות";
        text = `📦 *ריכוז רשימות קנייה (חסרים בלבד):*\n\n`;
        selectedIds.forEach(id => {
            const l = db.lists[id];
            const missing = l.items.filter(i => !i.checked);
            if (missing.length > 0) {
                text += `🔹 *${l.name}:*\n`;
                missing.forEach(i => text += `  - ${i.name} (x${i.qty})\n`);
                text += `\n`;
            }
        });
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text
            });
        } catch (err) {
            console.log("Sharing failed", err);
        }
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('📋 הטקסט הועתק ללוח!');
        });
    }
}

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    const c = document.getElementById('itemCategory').value;

    if (n) {
        // Auto-detect category if not manually selected
        const finalCategory = c || detectCategory(n);

        db.lists[db.currentId].items.push({
            name: n,
            price: p,
            qty: 1,
            checked: false,
            category: finalCategory
        });
        closeModal('inputForm');
        save();
        showNotification('✅ מוצר נוסף!');
    }
}

function changeQty(idx, d) {
    if (db.lists[db.currentId].items[idx].qty + d >= 1) {
        db.lists[db.currentId].items[idx].qty += d;
        save();
    }
}

function removeItem(idx) {
    db.lists[db.currentId].items.splice(idx, 1);
    save();
    showNotification('🗑️ מוצר הוסר');
}

function toggleLock() {
    isLocked = !isLocked;
    render();
}

function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    const u = document.getElementById('newListUrlInput').value.trim();
    const b = parseFloat(document.getElementById('newListBudget').value) || 0;
    const t = document.getElementById('newListTemplate').checked;
    if (n) {
        const id = 'L' + Date.now();
        db.lists[id] = {
            name: n,
            url: u,
            budget: b,
            isTemplate: t,
            items: []
        };
        db.currentId = id;
        activePage = 'lists';
        closeModal('newListModal');
        save();
        showNotification(t ? '⭐ תבנית נוצרה!' : '✅ רשימה נוצרה!');
    }
}

function deleteFullList() {
    if (listToDelete) {
        delete db.lists[listToDelete];
        const keys = Object.keys(db.lists);
        if (db.currentId === listToDelete) {
            db.currentId = keys[0] || (db.lists['L1'] = { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] }, 'L1');
        }
        closeModal('deleteListModal');
        save();
        showNotification('🗑️ רשימה נמחקה');
    }
}

function prepareDeleteList(id) {
    listToDelete = id;
    openModal('deleteListModal');
}

function importFromText() {
    const text = document.getElementById('importText').value.trim();
    if (!text) {
        alert('אנא הדבק טקסט לייבוא');
        return;
    }

    const lines = text.split('\n').filter(line => line.trim());
    let listName = 'רשימה מיובאת';
    let startIndex = 0;

    const firstLine = lines[0];
    if (firstLine.includes('*') && firstLine.includes(':')) {
        const match = firstLine.match(/\*([^*]+)\*/);
        if (match) {
            listName = match[1].trim();
            startIndex = 1;
        }
    }

    let finalName = listName;
    let counter = 1;
    const existingNames = Object.values(db.lists).map(l => l.name);
    while (existingNames.includes(finalName)) {
        counter++;
        finalName = `${listName} ${counter}`;
    }

    const newListId = 'L' + Date.now();
    const items = [];

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.includes('🛒') || line.includes('💰') || line.includes('סה"כ') || line === '---') continue;

        let itemAdded = false;
        const fullMatch = line.match(/[⬜✅]\s*\*([^*]+)\*\s*\(x(\d+)\)\s*-\s*₪([\d.]+)/);
        if (fullMatch) {
            const name = fullMatch[1].trim();
            const qty = parseInt(fullMatch[2]);
            const totalPrice = parseFloat(fullMatch[3]);
            const price = totalPrice / qty;
            const checked = line.includes('✅');
            items.push({ name, price, qty, checked, category: detectCategory(name) });
            itemAdded = true;
        }
        if (!itemAdded) {
            const bulletQtyMatch = line.match(/^[•\-]\s*\*?([^(]+)\*?\s*\(x(\d+)\)/);
            if (bulletQtyMatch) {
                const name = bulletQtyMatch[1].trim().replace(/\*/g, '');
                const qty = parseInt(bulletQtyMatch[2]);
                if (name) {
                    items.push({ name, price: 0, qty, checked: false, category: detectCategory(name) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded) {
            const bulletMatch = line.match(/^[•\-]\s*\*?(.+?)\*?$/);
            if (bulletMatch) {
                const name = bulletMatch[1].trim().replace(/\*/g, '');
                if (name) {
                    items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded) {
            const starMatch = line.match(/^\*([^*]+)\*$/);
            if (starMatch) {
                const name = starMatch[1].trim();
                if (name) {
                    items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded && line.length > 0) {
            const name = line.replace(/^[\d\.\)\-\s]+/, '').trim();
            if (name && !/^\d+$/.test(name)) {
                items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name) });
            }
        }
    }

    if (items.length === 0) {
        alert('לא נמצאו מוצרים בטקסט');
        return;
    }

    db.lists[newListId] = { name: finalName, url: '', budget: 0, isTemplate: false, items };
    db.currentId = newListId;
    activePage = 'lists';
    closeModal('importModal');
    save();
    showNotification(`✅ יובאו ${items.length} מוצרים!`);
}

function initSortable() {
    const el = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, {
            animation: 150,
            onEnd: function () {
                if (activePage === 'lists') {
                    const newOrder = Array.from(el.children).map(c => parseInt(c.getAttribute('data-id')));
                    const items = db.lists[db.currentId].items;
                    db.lists[db.currentId].items = newOrder.map(oldIdx => items[oldIdx]);
                } else {
                    const newOrder = Array.from(el.children).map(c => c.getAttribute('data-id'));
                    const newLists = {};
                    newOrder.forEach(id => newLists[id] = db.lists[id]);
                    db.lists = newLists;
                }
                save();
            }
        });
    }
}

function preparePrint() {
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    let grandTotal = 0;
    let htmlContent = `<h1 style="text-align:center; color:#7367f0;">דוח קניות מפורט - Vplus Pro</h1>`;
    const idsToPrint = db.selectedInSummary.length > 0 ? db.selectedInSummary : Object.keys(db.lists);

    idsToPrint.forEach(id => {
        const l = db.lists[id];
        let listTotal = 0;
        htmlContent += `
            <div style="border-bottom: 2px solid #7367f0; margin-bottom: 20px; padding-bottom: 10px;">
                <h2>${l.name}</h2>
                <table style="width:100%; border-collapse:collapse; border:1px solid #ddd; margin-bottom:10px;">
                    <thead>
                        <tr style="background:#f9fafb;">
                            <th style="padding:8px; border:1px solid #ddd; text-align:right;">מוצר</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:center;">קטגוריה</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:center;">כמות</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">סה"כ</th>
                        </tr>
                    </thead>
                    <tbody>`;
        l.items.forEach(i => {
            const s = i.price * i.qty;
            listTotal += s;
            htmlContent += `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">${i.name}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">${i.category || '-'}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">${i.qty}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:left;">₪${s.toFixed(2)}</td>
                </tr>`;
        });
        htmlContent += `</tbody></table><div style="text-align:left; font-weight:bold;">סיכום רשימה: ₪${listTotal.toFixed(2)}</div></div>`;
        grandTotal += listTotal;
    });
    htmlContent += `<div style="text-align:center; margin-top:30px; padding:15px; border:3px double #7367f0; font-size:1.5em; font-weight:900;">סה"כ כולל: ₪${grandTotal.toFixed(2)}</div>`;
    printArea.innerHTML = htmlContent;
    window.print();
}

function saveListName() {
    const n = document.getElementById('editListNameInput').value.trim();
    const u = document.getElementById('editListUrlInput').value.trim();
    const b = parseFloat(document.getElementById('editListBudget').value) || 0;
    if (n) {
        db.lists[db.currentId].name = n;
        db.lists[db.currentId].url = u;
        db.lists[db.currentId].budget = b;
        save();
    }
    closeModal('editListNameModal');
}

function openEditTotalModal(idx) {
    currentEditIdx = idx;
    document.getElementById('editTotalInput').value = '';
    openModal('editTotalModal');
}

function saveTotal() {
    const val = parseFloat(document.getElementById('editTotalInput').value);
    if (!isNaN(val)) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        save();
    }
    closeModal('editTotalModal');
}

// ========== Data Export/Import ==========
function exportData() {
    const dataStr = JSON.stringify(db, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vplus_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('💾 הנתונים יוצאו בהצלחה!');
    closeModal('settingsModal');
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
                showNotification('✅ הנתונים שוחזרו בהצלחה!');
                closeModal('settingsModal');
            }
        } catch (err) {
            alert('שגיאה בקריאת הקובץ.');
        }
    };
    reader.readAsText(file);
}

// ========== Google Drive Integration (UPDATED) ==========
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('cloudBtn').onclick = handleCloudClick;
    }
}

function handleCloudClick() {
    if (isConnected) manualSync();
    else handleAuthClick();
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) return;
        accessToken = gapi.client.getToken().access_token;
        isConnected = true;
        updateCloudIndicator('connected');
        showNotification('☁️ מחובר לענן!');
        await loadAndMerge();
    };
    tokenClient.requestAccessToken({ prompt: gapi.client.getToken() === null ? 'consent' : '' });
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    if (!indicator) return;
    indicator.className = status === 'connected' ? 'w-2 h-2 bg-green-500 rounded-full' :
        status === 'syncing' ? 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse' :
            'w-2 h-2 bg-gray-300 rounded-full';
}

async function findOrCreateFolder() {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        if (response.result.files.length > 0) return response.result.files[0].id;
        const folder = await gapi.client.drive.files.create({
            resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
            fields: 'id'
        });
        return folder.result.id;
    } catch (err) { return null; }
}

async function findFileInFolder(folderId) {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        return response.result.files.length > 0 ? response.result.files[0].id : null;
    } catch (err) { return null; }
}

async function syncToCloud() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        const folderId = await findOrCreateFolder();
        if (!folderId) { isSyncing = false; updateCloudIndicator('connected'); return; }
        const fileId = await findFileInFolder(folderId);
        const dataToSave = JSON.stringify(db);
        if (fileId) {
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: dataToSave
            });
        } else {
            const metadata = { name: FILE_NAME, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([dataToSave], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: form
            });
        }
    } catch (err) { showNotification('❌ שגיאה בסינכרון', 'error'); }
    finally { isSyncing = false; updateCloudIndicator('connected'); }
}

async function loadAndMerge() {
    if (!accessToken || isSyncing) return;
    isSyncing = true;
    updateCloudIndicator('syncing');
    try {
        const folderId = await findOrCreateFolder();
        const fileId = folderId ? await findFileInFolder(folderId) : null;
        if (!fileId) {
            isSyncing = false; updateCloudIndicator('connected');
            await syncToCloud();
            return;
        }

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const cloudData = await response.json();

        const localItems = db.lists[db.currentId] ? [...db.lists[db.currentId].items] : [];
        const cloudHasData = Object.keys(cloudData.lists).some(k => cloudData.lists[k].items.length > 0);

        if (localItems.length === 0 && cloudHasData) {
            db = cloudData;
        } else {
            db = cloudData;
            if (localItems.length > 0) {
                const curId = db.currentId || 'L1';
                if (!db.lists[curId]) db.lists[curId] = { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] };
                const cloudNames = db.lists[curId].items.map(i => i.name);
                const newItems = localItems.filter(li => !cloudNames.includes(li.name));
                if (newItems.length > 0) db.lists[curId].items.push(...newItems);
            }
        }

        localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
        render();
        if (localItems.length > 0) await syncToCloud();
        showNotification('☁️ סונכרן מהענן!');
    } catch (err) { showNotification('❌ שגיאה בטעינה', 'error'); }
    finally { isSyncing = false; updateCloudIndicator('connected'); }
}

async function manualSync() { await loadAndMerge(); }

// ========== Event Listeners ==========
window.addEventListener('DOMContentLoaded', () => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        const text = document.getElementById('darkModeText');
        if (text) text.textContent = 'מצב יום ☀️';
    }

    const itemNameInput = document.getElementById('itemName');
    const itemPriceInput = document.getElementById('itemPrice');
    if (itemNameInput && itemPriceInput) {
        itemNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); itemPriceInput.focus(); } });
        itemPriceInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } });
    }
});

const script1 = document.createElement('script');
script1.src = 'https://apis.google.com/js/api.js';
script1.onload = gapiLoaded;
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://accounts.google.com/gsi/client';
script2.onload = gisLoaded;
document.head.appendChild(script2);

render();


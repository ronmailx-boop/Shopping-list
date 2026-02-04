// ========== Configuration ==========
const config = {
    apiKey: 'AIzaSyDo9mGhxEiHv0JGFKOWTfMt32hHXNuXwQM' // Gemini API Key
};

// ========== Firebase Configuration ==========
let unsubscribeSnapshot = null;
let isSyncing = false;
let isConnected = false;
let currentUser = null;
let syncTimeout = null;

// ========== Categories & Keywords ==========
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

const CATEGORY_KEYWORDS = {
    'פירות וירקות': ['עגבניות', 'מלפפון', 'חסה', 'גזר', 'בצל', 'תפוח', 'בננה', 'ירקות', 'פירות'],
    'בשר ודגים': ['בשר', 'עוף', 'דג', 'סלמון', 'נקניק', 'המבורגר'],
    'חלב וביצים': ['חלב', 'גבינה', 'יוגורט', 'ביצים', 'חמאה'],
    'לחם ומאפים': ['לחם', 'פיתה', 'חלה', 'עוגה', 'עוגיות', 'פסטה'],
    'שימורים': ['שימורים', 'טונה', 'זיתים', 'חומוס', 'טחינה'],
    'חטיפים': ['במבה', 'ביסלי', 'שוקולד', 'ממתקים', 'צ׳יפס'],
    'משקאות': ['מים', 'קולה', 'מיץ', 'בירה', 'יין', 'קפה'],
    'ניקיון': ['סבון', 'אבקת כביסה', 'נייר טואלט', 'אקונומיקה'],
    'היגיינה': ['שמפו', 'משחת שיניים', 'דאודורנט', 'חיתולים']
};

function detectCategory(productName) {
    if (!productName) return 'אחר';
    const nameLower = productName.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(k => nameLower.includes(k))) return category;
    }
    return 'אחר';
}

// ========== Translations ==========
const translations = {
    he: {
        appName: 'Vplus', myList: 'הרשימה שלי', myLists: 'הרשימות שלי', statistics: '📊 סטטיסטיקות',
        scanReceipt: 'סרוק אשראי/בנק', scanReceiptTitle: 'סרוק אשראי/בנק', scanReceiptDesc: 'בחר צילום מסך של עסקאות MAX'
    },
    en: {
        appName: 'Vplus', myList: 'My List', myLists: 'My Lists', statistics: '📊 Stats',
        scanReceipt: 'Scan Credit/Bank', scanReceiptTitle: 'Scan Credit/Bank', scanReceiptDesc: 'Select MAX screenshot'
    }
};

let currentLang = localStorage.getItem('appLanguage') || 'he';
function t(key) { return translations[currentLang][key] || key; }

// ========== App Data & Core ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    lists: { 'L1': { name: 'הרשימה שלי', url: '', budget: 0, items: [] } },
    history: [], stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} }
};

function save() {
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    if (isConnected && currentUser) syncToCloud();
}

// ========== התיקון לסריקה (החלק החשוב) ==========
async function processReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];
    if (!file) return alert('אנא בחר תמונה');

    const scanBtn = document.getElementById('scanBtn');
    const statusDiv = document.getElementById('scanStatus');
    const progressDiv = document.getElementById('scanProgress');

    scanBtn.disabled = true;
    progressDiv.classList.remove('hidden');
    statusDiv.textContent = 'קורא תמונה...';

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const base64Image = reader.result.split(',')[1];
            const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + config.apiKey;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Extract card name and transactions from this image as JSON: {cardName: string, transactions: [{name: string, price: number}]}. Return ONLY JSON." },
                            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'שגיאת גוגל');

            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json|```/g, "").trim();
            const parsedData = JSON.parse(text);
            
            createOrUpdateListFromCard(parsedData);
            
            statusDiv.textContent = 'הושלם!';
            setTimeout(() => {
                closeModal('receiptScanModal');
                progressDiv.classList.add('hidden');
            }, 1000);
            showNotification('✅ הנתונים נוספו בהצלחה');
        } catch (e) {
            alert('שגיאה: ' + e.message);
        } finally {
            scanBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

function createOrUpdateListFromCard(data) {
    const listId = 'L' + Date.now();
    db.lists[listId] = {
        name: data.cardName || 'סריקת MAX',
        items: data.transactions.map(t => ({
            name: t.name,
            price: parseFloat(t.price) || 0,
            qty: 1,
            checked: false,
            category: detectCategory(t.name)
        }))
    };
    db.currentId = listId;
    save();
}

// ========== Firebase & Auth ==========
function initFirebaseAuth() {
    window.onAuthStateChanged(window.firebaseAuth, (user) => {
        currentUser = user;
        isConnected = !!user;
        if (user) setupFirestoreListener(user);
    });
}

async function syncToCloud() {
    if (!currentUser) return;
    try {
        const userDocRef = window.doc(window.firebaseDb, "shopping_lists", currentUser.uid);
        await window.setDoc(userDocRef, db);
    } catch (e) { console.error(e); }
}

function setupFirestoreListener(user) {
    const userDocRef = window.doc(window.firebaseDb, "shopping_lists", user.uid);
    window.onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            db = docSnap.data();
            render();
        }
    });
}

// ========== UI & Global Hooks ==========
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showNotification(m) { alert(m); } // פשוט לצורך הבדיקה

function render() {
    // כאן נמצאת פונקציית ה-render המקורית שלך לציור המוצרים על המסך
    console.log("Rendering...");
}

const checkFirebase = setInterval(() => {
    if (window.firebaseAuth) { clearInterval(checkFirebase); initFirebaseAuth(); }
}, 100);

window.onload = () => { render(); };

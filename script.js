// ========== הגדרות ומצב אפליקציה ==========
// שימוש במפתח גרסה ייחודי לאחסון המקומי
const APP_VERSION = '1.0.0';
const STORAGE_KEY = `VPLUS_ITEMS_V${APP_VERSION}`;

let items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editIndex = null;

// ========== פונקציות ליבה ==========

// הוספת מוצר חדש
function addItem() {
    const nameInput = document.getElementById('itemName');
    const priceInput = document.getElementById('itemPrice');
    
    if (!nameInput.value.trim()) return;

    const item = {
        id: Date.now(),
        name: nameInput.value.trim(),
        price: parseFloat(priceInput.value) || 0,
        checked: false
    };

    items.unshift(item); // הוספה לראש הרשימה
    saveAndRender();
    
    // איפוס שדות
    nameInput.value = '';
    priceInput.value = '';
    nameInput.focus();
}

// סימון מוצר כנקנה
function toggleCheck(id) {
    items = items.map(item => item.id === id ? {...item, checked: !item.checked} : item);
    saveAndRender();
}

// מחיקת מוצר
function deleteItem(id) {
    if (confirm('האם למחוק את המוצר?')) {
        items = items.filter(item => item.id !== id);
        saveAndRender();
    }
}

// שמירה ורינדור
function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    render();
}

// הצגת הרשימה על המסך
function render() {
    const list = document.getElementById('itemsList');
    const totalDisplay = document.getElementById('totalDisplay');
    const itemCount = document.getElementById('itemCount');
    
    if (!list) return;
    
    list.innerHTML = '';
    let total = 0;

    items.forEach((item) => {
        total += item.price;
        const card = document.createElement('div');
        card.className = `item-card ${item.checked ? 'opacity-50' : ''}`;
        card.innerHTML = `
            <div onclick="toggleCheck(${item.id})" class="w-8 h-8 rounded-full border-2 border-indigo-600 flex items-center justify-center cursor-pointer font-bold text-indigo-600">
                ${item.checked ? '✓' : ''}
            </div>
            <div class="flex-1" onclick="openEdit(${item.id})">
                <div class="font-bold text-lg ${item.checked ? 'line-through' : ''}">${item.name}</div>
                <div class="text-indigo-600 font-black">₪${item.price.toFixed(2)}</div>
            </div>
            <button onclick="deleteItem(${item.id})" class="text-red-400 p-2 text-xl">✕</button>
        `;
        list.appendChild(card);
    });

    if (totalDisplay) totalDisplay.innerText = `₪${total.toFixed(2)}`;
    if (itemCount) itemCount.innerText = items.length;
}

// ========== מודאלים וממשק משתמש ==========

function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

function openEdit(id) {
    const item = items.find(i => i.id === id);
    editIndex = items.findIndex(i => i.id === id);
    document.getElementById('editName').value = item.name;
    document.getElementById('editPrice').value = item.price;
    openModal('editModal');
}

function saveEdit() {
    if (editIndex !== null) {
        items[editIndex].name = document.getElementById('editName').value.trim();
        items[editIndex].price = parseFloat(document.getElementById('editPrice').value) || 0;
        saveAndRender();
        closeModal('editModal');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btnText = document.getElementById('darkModeText');
    if (btnText) btnText.innerText = isDark ? 'מצב יום ☀️' : 'מצב לילה 🌙';
}

// ייצוא וייבוא נתונים
function exportData() {
    const dataStr = JSON.stringify(items);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `vplus_backup_v${APP_VERSION}_${new Date().toLocaleDateString('he-IL')}.json`);
    linkElement.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                items = imported;
                saveAndRender();
                alert('הנתונים שוחזרו בהצלחה!');
            }
        } catch (err) {
            alert('שגיאה בקריאת הקובץ');
        }
    };
    reader.readAsText(file);
}

function preparePrint() { 
    window.print(); 
}

// ========== אתחול האפליקציה ==========

window.addEventListener('DOMContentLoaded', () => {
    // טעינת מצב לילה
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const btnText = document.getElementById('darkModeText');
        if (btnText) btnText.innerText = 'מצב יום ☀️';
    }

    // עדכון תצוגת גרסה במודאל הגדרות
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) versionDisplay.innerText = APP_VERSION;

    // האזנה למקש Enter בתיבות הטקסט
    document.getElementById('itemName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('itemPrice').focus();
    });
    document.getElementById('itemPrice')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    render();
});

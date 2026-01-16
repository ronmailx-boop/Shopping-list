// ========== Google Drive Config (נשאר ללא שינוי) ==========
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
// ... שאר הגדרות גוגל ...

// ========== App State ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', items: [] } }, fontSize: 16
};
let isLocked = true;
let activePage = 'lists';

// ========== Render Logic (כאן התיקון הגרפי) ==========
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let totalAll = 0, paidAll = 0;

    // עדכון טאבים לפי העיצוב שלך
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('statusTag').innerText = isLocked ? 'נעול' : 'פתוח לעריכה';

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty; 
            totalAll += sub; if (item.checked) paidAll += sub;
            
            // יצירת הכרטיס עם ה-Classes המקוריים מה-CSS שלך
            const div = document.createElement('div'); 
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                        <div class="item-name font-bold ${item.checked ? 'line-through text-gray-300' : 'text-gray-800'}" style="font-size: ${db.fontSize}px;">${item.name}</div>
                    </div>
                    ${!isLocked ? `<button onclick="removeItem(${idx})" class="trash-btn">🗑️</button>` : ''}
                </div>
                <div class="flex justify-between items-center mt-3">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-xl px-2">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-600 font-bold text-xl">+</button>
                        <span class="font-bold qty-display">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-600 font-bold text-xl">-</button>
                    </div>
                    <span class="text-xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>`;
            container.appendChild(div);
        });
    }
    
    // עדכון מספרים בבר התחתון
    document.getElementById('displayTotal').innerText = totalAll.toFixed(2);
    document.getElementById('displayPaid').innerText = paidAll.toFixed(2);
    document.getElementById('displayLeft').innerText = (totalAll - paidAll).toFixed(2);
}

// ========== Google Auth Handlers (לחיצות כפתור) ==========
window.handleCloudClick = async function() {
    // קריאה לפונקציית ההתחברות שלך מהסקריפט המקורי
    if (isConnected) await loadAndMerge();
    else {
        tokenClient.callback = async (resp) => {
            accessToken = resp.access_token;
            gapi.client.setToken(resp); 
            isConnected = true;
            updateCloudIndicator('connected');
            await loadAndMerge();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
};

// ... שאר הפונקציות (addItem, toggleItem וכו') ...

window.onload = () => { render(); };

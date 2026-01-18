// הגדרות ענן
const GOOGLE_CLIENT_ID = '151476121869-b5lbrt5t89s8d342ftd1cg1q926518pt.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDIMiuwL-phvwI7iAUeMQmTOowWE96mP6I'; 
// ... שאר הגדרות ה-Discovery וה-Scopes ...

let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    selectedInSummary: [], lastActivePage: 'lists'
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';

function save() { 
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').style.display = 'block';
        document.getElementById('pageSummary').style.display = 'none';
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub; if (item.checked) paid += sub;
            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})">
                        <span class="font-bold">${item.name}</span>
                    </div>
                    <button onclick="removeItem(${idx})" class="text-red-500">🗑️</button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 p-1 rounded-lg">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 font-bold">+</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 font-bold">-</button>
                    </div>
                    <span class="font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').style.display = 'none';
        document.getElementById('pageSummary').style.display = 'block';
        // לוגיקת רינדור סיכום (Summary)...
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
}

// פונקציות עזר (addItem, toggleItem, וכו') - להעתיק מהקוד המקורי שלך
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

window.onload = render;

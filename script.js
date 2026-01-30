import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ========== משתנים והגדרות ==========
let shoppingItems = JSON.parse(localStorage.getItem('vplus_items')) || [];
const CATEGORIES = {
    'כללי': { color: '#94a3b8', icon: '🛒' },
    'פירות וירקות': { color: '#22c55e', icon: '🍏' },
    'חלב וביצים': { color: '#3b82f6', icon: '🥛' },
    'בשר ודגים': { color: '#ef4444', icon: '🥩' },
    'מאפים': { color: '#f59e0b', icon: '🥖' },
    'קפואים': { color: '#06b6d4', icon: '❄️' },
    'ניקיון': { color: '#8b5cf6', icon: '✨' }
};

// ========== פונקציות סנכרון Firebase ==========

async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        document.getElementById('syncBtn').classList.add('bg-green-100', 'text-green-600');
        startCloudSync(result.user.uid);
    } catch (e) {
        console.error(e);
        alert("הסנכרון נכשל");
    }
}

async function saveToCloud() {
    const user = auth.currentUser;
    if (user) {
        await setDoc(doc(db, "shopping_lists", user.uid), {
            items: shoppingItems,
            updatedAt: new Date()
        });
    }
    localStorage.setItem('vplus_items', JSON.stringify(shoppingItems));
}

function startCloudSync(uid) {
    onSnapshot(doc(db, "shopping_lists", uid), (snapshot) => {
        if (snapshot.exists()) {
            shoppingItems = snapshot.data().items || [];
            renderList();
        }
    });
}

// ========== פונקציות האפליקציה ==========

function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const category = document.getElementById('itemCategory').value;

    if (!name) return;

    const newItem = {
        id: Date.now(),
        name,
        price,
        category,
        checked: false
    };

    shoppingItems.unshift(newItem);
    resetInputs();
    renderList();
    saveToCloud();
}

function resetInputs() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
}

function toggleItem(id) {
    shoppingItems = shoppingItems.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
    );
    renderList();
    saveToCloud();
}

function deleteItem(id) {
    shoppingItems = shoppingItems.filter(item => item.id !== id);
    renderList();
    saveToCloud();
}

function clearList() {
    if (confirm('למחוק את כל הרשימה?')) {
        shoppingItems = [];
        renderList();
        saveToCloud();
    }
}

function renderList() {
    const list = document.getElementById('shoppingList');
    list.innerHTML = '';

    shoppingItems.forEach(item => {
        const cat = CATEGORIES[item.category] || CATEGORIES['כללי'];
        const div = document.createElement('div');
        div.className = `item-card flex items-center justify-between ${item.checked ? 'opacity-40 scale-95' : ''}`;
        div.innerHTML = `
            <div class="flex items-center gap-4 flex-1" onclick="toggleItem(${item.id})">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner" style="background: ${cat.color}20">
                    ${cat.icon}
                </div>
                <div>
                    <div class="font-bold text-lg ${item.checked ? 'line-through' : ''}">${item.name}</div>
                    <div class="flex gap-2 items-center">
                        <span class="category-tag" style="background: ${cat.color}20; color: ${cat.color}">${item.category}</span>
                        ${item.price > 0 ? `<span class="text-sm font-bold text-gray-400">₪${item.price}</span>` : ''}
                    </div>
                </div>
            </div>
            <button onclick="deleteItem(${item.id})" class="p-2 opacity-30 hover:opacity-100 transition">🗑️</button>
        `;
        list.appendChild(div);
    });
}

// ========== סטטיסטיקה ועיצוב ==========

let myChart = null;

function showStats() {
    const modal = document.getElementById('statsModal');
    modal.classList.remove('hidden');
    
    const totals = {};
    let grandTotal = 0;
    
    shoppingItems.forEach(item => {
        totals[item.category] = (totals[item.category] || 0) + item.price;
        grandTotal += item.price;
    });

    const ctx = document.getElementById('statsChart').getContext('2d');
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: Object.keys(totals).map(c => CATEGORIES[c]?.color || '#ccc'),
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
    });

    document.getElementById('statsSummary').innerHTML = `
        <div class="text-center">
            <div class="text-gray-400 uppercase text-xs font-bold tracking-widest">סה"כ לתשלום</div>
            <div class="text-4xl font-black text-indigo-600">₪${grandTotal.toFixed(2)}</div>
        </div>
    `;
}

function closeStats() { document.getElementById('statsModal').classList.add('hidden'); }

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('darkModeIcon').innerText = isDark ? '☀️' : '🌙';
}

// חשיפה ל-Window
window.addItem = addItem;
window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.clearList = clearList;
window.loginWithGoogle = loginWithGoogle;
window.showStats = showStats;
window.closeStats = closeStats;
window.toggleDarkMode = toggleDarkMode;

renderList();

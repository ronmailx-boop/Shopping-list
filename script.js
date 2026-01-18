// שחזור ה-DB המקורי עם כל הפונקציות
let db = JSON.parse(localStorage.getItem('VPLUS_MASTER_DB')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

const onboardingSteps = [
    { title: "ברוכים הבאים ל-Vplus", desc: "הדרך החכמה לנהל קניות ותקציב במקום אחד.", image: "icon.png" },
    { title: "שליטה מלאה בהוצאות", desc: "עקבו אחרי הסכומים בזמן אמת - מה שולם ומה נשאר.", image: "icon.png" },
    { title: "סנכרון ענן", desc: "גבו את הנתונים לענן ושתפו עם המשפחה בקלות.", image: "icon.png" }
];

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentOnboardingStep = 0;

function save() {
    db.lastActivePage = activePage;
    localStorage.setItem('VPLUS_MASTER_DB', JSON.stringify(db));
    render();
}

function showPage(p) { activePage = p; save(); }

function toggleLock() { 
    isLocked = !isLocked; 
    render(); 
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
    if(id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 300);
    }
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    let total = 0, paid = 0;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        container.innerHTML = '';

        list.items.forEach((item, idx) => {
            const sub = item.price * item.qty;
            total += sub;
            if (item.checked) paid += sub;

            const div = document.createElement('div');
            div.className = "item-card";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-6 h-6 accent-indigo-600">
                        <span class="font-bold text-lg ${item.checked ? 'line-through text-gray-300' : ''}">${item.name}</span>
                    </div>
                    ${!isLocked ? `<button onclick="removeItem(${idx})" class="text-red-400">✕</button>` : ''}
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-lg px-2 border">
                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 font-bold">+</button>
                        <span class="font-bold">${item.qty}</span>
                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 font-bold">-</button>
                    </div>
                    <span class="font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        renderSummary();
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);

    const btn = document.getElementById('mainLockBtn'), path = document.getElementById('lockIconPath'), tag = document.getElementById('statusTag');
    btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'} p-3 rounded-full text-white`;
    path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
    tag.innerText = isLocked ? "נעול" : "עריכה פעילה";
}

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (n) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1, checked: false });
        closeModal('inputForm');
        save();
    }
}

function toggleItem(idx) { db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked; save(); }
function changeQty(idx, d) { if(db.lists[db.currentId].items[idx].qty + d >= 1) { db.lists[db.currentId].items[idx].qty += d; save(); } }
function removeItem(idx) { db.lists[db.currentId].items.splice(idx, 1); save(); }
function executeClear() { db.lists[db.currentId].items = []; closeModal('confirmModal'); save(); }

function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    if(n) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: n, items: [] };
        db.currentId = id;
        closeModal('newListModal');
        showPage('lists');
    }
}

function importFromText() {
    const text = document.getElementById('importText').value;
    if (text) {
        text.split('\n').forEach(line => {
            const parts = line.split(/[-₪,]/);
            if (parts[0]) db.lists[db.currentId].items.push({ name: parts[0].trim(), price: parseFloat(parts[1]) || 0, qty: 1, checked: false });
        });
        closeModal('importModal');
        save();
    }
}

function renderSummary() {
    const container = document.getElementById('summaryContainer');
    container.innerHTML = '<h3 class="font-bold mb-4 text-indigo-600">הרשימות שלי</h3>';
    Object.keys(db.lists).forEach(id => {
        const list = db.lists[id];
        let sum = 0;
        list.items.forEach(i => sum += (i.price * i.qty));
        const div = document.createElement('div');
        div.className = "item-card cursor-pointer";
        div.onclick = () => { db.currentId = id; showPage('lists'); };
        div.innerHTML = `<div class="flex justify-between font-bold"><span>${list.name}</span><span>₪${sum.toFixed(2)}</span></div>`;
        container.appendChild(div);
    });
}

// Splash & Onboarding
function initApp() {
    const splash = document.getElementById('splash-screen'), onboarding = document.getElementById('onboarding-overlay');
    setTimeout(() => {
        splash.classList.add('fade-out');
        const hasSeen = localStorage.getItem('vplus_onboarding_vFinal');
        if (!hasSeen) { onboarding.classList.remove('hidden'); onboarding.classList.add('flex'); renderOnboarding(); }
        else { render(); }
    }, 2500);
}

function renderOnboarding() {
    const content = document.getElementById('onboarding-content'), dots = document.getElementById('onboarding-dots'), step = onboardingSteps[currentOnboardingStep];
    content.innerHTML = `<div class="onboarding-step"><img src="${step.image}" class="mx-auto shadow-xl"><h2 class="font-black text-2xl mb-4">${step.title}</h2><p class="text-gray-500">${step.desc}</p></div>`;
    dots.innerHTML = onboardingSteps.map((_, i) => `<div class="dot ${i === currentOnboardingStep ? 'active' : ''}"></div>`).join('');
    document.getElementById('onboarding-next').innerText = currentOnboardingStep === onboardingSteps.length - 1 ? "מתחילים!" : "הבא";
}

document.getElementById('onboarding-next').onclick = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) { currentOnboardingStep++; renderOnboarding(); }
    else { localStorage.setItem('vplus_onboarding_vFinal', 'true'); document.getElementById('onboarding-overlay').classList.add('hidden'); render(); }
};
document.getElementById('onboarding-skip').onclick = () => { localStorage.setItem('vplus_onboarding_vFinal', 'true'); document.getElementById('onboarding-overlay').classList.add('hidden'); render(); };

window.addEventListener('DOMContentLoaded', initApp);

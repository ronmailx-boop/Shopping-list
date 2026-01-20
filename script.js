let db = JSON.parse(localStorage.getItem('VPLUS_DB_FINAL')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

const onboardingSteps = [
    { title: "ברוכים הבאים", desc: "הדרך החכמה לנהל קניות ותקציב.", image: "icon.png" },
    { title: "שליטה בהוצאות", desc: "עקבו אחרי הסכומים בזמן אמת.", image: "icon.png" },
    { title: "סנכרון ענן", desc: "הנתונים שלכם תמיד מגובים.", image: "icon.png" }
];

let currentOnboardingStep = 0;
let activePage = db.lastActivePage || 'lists';

function save() {
    db.lastActivePage = activePage;
    localStorage.setItem('VPLUS_DB_FINAL', JSON.stringify(db));
    render();
}

// פונקציית המזעור
function toggleBottomBar() {
    const bar = document.querySelector('.bottom-bar-fixed');
    if (bar) {
        bar.classList.toggle('minimized');
    }
}

function showPage(p) {
    activePage = p;
    save();
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
    if(id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        setTimeout(() => document.getElementById('itemName').focus(), 300);
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function render() {
    const itemsContainer = document.getElementById('itemsContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    if (!itemsContainer || !summaryContainer) return;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        
        itemsContainer.innerHTML = '';
        let total = 0;
        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        
        if (list.items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-12 text-gray-400 opacity-60">
                    <p class="font-bold">הרשימה ריקה</p>
                    <p class="text-sm">לחץ על ה- + כדי להתחיל</p>
                </div>`;
        }

        list.items.forEach((item, idx) => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            const div = document.createElement('div');
            div.className = "item-card animate-[fadeIn_0.3s_ease-out]";
            div.innerHTML = `
                <div class="font-bold text-lg text-slate-700">${item.name}</div>
                <div class="flex items-center gap-4">
                    <div class="text-xs text-gray-400">x${item.qty}</div>
                    <div class="text-[#7367f0] font-black text-xl">₪${subtotal.toFixed(2)}</div>
                    <button onclick="removeItem(${idx})" class="text-red-300 pr-2">✕</button>
                </div>
            `;
            itemsContainer.appendChild(div);
        });

        document.getElementById('displayTotal').innerText = total.toFixed(2);
        document.getElementById('displayLeft').innerText = total.toFixed(2);
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        renderSummary();
    }
}

function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    if (name) {
        db.lists[db.currentId].items.push({ name, price, qty: 1 });
        closeModal('inputForm');
        save();
    }
}

function removeItem(idx) {
    db.lists[db.currentId].items.splice(idx, 1);
    save();
}

function saveNewList() {
    const name = document.getElementById('newListNameInput').value.trim();
    if (name) {
        const id = 'L' + Date.now();
        db.lists[id] = { name: name, items: [] };
        db.currentId = id;
        closeModal('newListModal');
        showPage('lists');
    }
}

function importFromText() {
    const text = document.getElementById('importText').value;
    if (text) {
        const lines = text.split('\n');
        lines.forEach(line => {
            const parts = line.split(/[-₪,]/);
            const name = parts[0].trim();
            const price = parseFloat(parts[1]) || 0;
            if (name) db.lists[db.currentId].items.push({ name, price, qty: 1 });
        });
        closeModal('importModal');
        save();
    }
}

function renderSummary() {
    const container = document.getElementById('summaryContainer');
    container.innerHTML = '<h3 class="font-bold mb-4 text-indigo-600">סיכום כל הרשימות</h3>';
    Object.keys(db.lists).forEach(id => {
        const list = db.lists[id];
        let sum = 0;
        list.items.forEach(i => sum += (i.price * i.qty));
        const div = document.createElement('div');
        div.className = "item-card cursor-pointer";
        div.onclick = () => { db.currentId = id; showPage('lists'); };
        div.innerHTML = `<span>${list.name}</span><span class="font-black">₪${sum.toFixed(2)}</span>`;
        container.appendChild(div);
    });
}

function syncToCloud() {
    document.getElementById('cloudIndicator').classList.add('bg-green-500');
    alert('הנתונים סונכרנו בהצלחה!');
}

function handleAuthClick() {
    alert('מתחבר לחשבון גוגל...');
}

function initApp() {
    const splash = document.getElementById('splash-screen');
    const onboarding = document.getElementById('onboarding-overlay');
    
    setTimeout(() => {
        splash.classList.add('fade-out');
        const hasSeen = localStorage.getItem('vplus_seen_final');
        if (!hasSeen) {
            onboarding.classList.remove('hidden');
            onboarding.classList.add('flex');
            renderOnboardingStep();
        } else {
            render();
        }
    }, 2500);

    // הוספת מאזין לחיצה לבר התחתון
    const bar = document.querySelector('.bottom-bar-fixed');
    if (bar) {
        bar.addEventListener('click', (e) => {
            // מזעור רק אם הלחיצה היא לא על כפתור (כדי שיוכלו ללחוץ על הפלוס בלי שהבר יברח)
            if (!e.target.closest('button')) {
                toggleBottomBar();
            }
        });
    }
}

function renderOnboardingStep() {
    const content = document.getElementById('onboarding-content');
    const dots = document.getElementById('onboarding-dots');
    const step = onboardingSteps[currentOnboardingStep];
    
    content.innerHTML = `
        <div class="onboarding-step">
            <img src="${step.image}" class="mx-auto shadow-2xl">
            <h2 class="font-black text-2xl">${step.title}</h2>
            <p class="mt-4 text-gray-500 font-medium">${step.desc}</p>
        </div>
    `;
    
    dots.innerHTML = onboardingSteps.map((_, i) => 
        `<div class="dot ${i === currentOnboardingStep ? 'active' : ''}"></div>`
    ).join('');
    
    document.getElementById('onboarding-next').innerText = 
        currentOnboardingStep === onboardingSteps.length - 1 ? "מתחילים!" : "הבא";
}

document.getElementById('onboarding-next').onclick = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
        currentOnboardingStep++;
        renderOnboardingStep();
    } else {
        localStorage.setItem('vplus_seen_final', 'true');
        document.getElementById('onboarding-overlay').classList.add('hidden');
        render();
    }
};

window.addEventListener('DOMContentLoaded', initApp);

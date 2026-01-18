let db = JSON.parse(localStorage.getItem('VPLUS_DB_V3')) || { 
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
    localStorage.setItem('VPLUS_DB_V3', JSON.stringify(db));
    render();
}

function showPage(p) {
    activePage = p;
    save();
}

function render() {
    const itemsContainer = document.getElementById('itemsContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    if (!itemsContainer || !summaryContainer) return;

    // עדכון כפתורי הטאבים
    const tabL = document.getElementById('tabLists');
    const tabS = document.getElementById('tabSummary');
    if(tabL && tabS) {
        tabL.className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
        tabS.className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        
        itemsContainer.innerHTML = '';
        let total = 0;
        const list = db.lists[db.currentId] || { items: [] };
        const items = list.items;
        
        if (items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-12 text-gray-400 opacity-60">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    <p class="font-bold">הרשימה ריקה</p>
                    <p class="text-sm">לחץ על ה- + כדי להתחיל</p>
                </div>`;
        }

        items.forEach((item, idx) => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            const div = document.createElement('div');
            div.className = "item-card animate-[fadeIn_0.3s_ease-out]";
            div.innerHTML = `
                <div class="font-bold text-lg text-slate-700">${item.name}</div>
                <div class="flex items-center gap-4">
                    <div class="text-xs text-gray-400">x${item.qty}</div>
                    <div class="text-[#7367f0] font-black text-xl">₪${subtotal.toFixed(2)}</div>
                </div>
            `;
            itemsContainer.appendChild(div);
        });

        document.getElementById('displayTotal').innerText = total.toFixed(2);
        document.getElementById('displayLeft').innerText = total.toFixed(2);
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        summaryContainer.innerHTML = '<div class="text-center p-10 text-gray-400 font-bold">דף סיכומי רשימות</div>';
    }
}

function addItemPrompt() {
    const n = prompt("שם המוצר:");
    if (!n) return;
    const p = parseFloat(prompt("מחיר:"));
    if (isNaN(p)) return;
    
    if (!db.lists[db.currentId]) db.lists[db.currentId] = { name: 'הרשימה שלי', items: [] };
    db.lists[db.currentId].items.push({ name: n, price: p, qty: 1 });
    save();
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
}

function renderOnboardingStep() {
    const content = document.getElementById('onboarding-content');
    const dots = document.getElementById('onboarding-dots');
    const step = onboardingSteps[currentOnboardingStep];
    
    content.innerHTML = `
        <div class="onboarding-step animate-[fadeIn_0.5s_ease-out]">
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
        closeOnboarding();
    }
};

document.getElementById('onboarding-skip').onclick = closeOnboarding;

function closeOnboarding() {
    localStorage.setItem('vplus_seen_final', 'true');
    document.getElementById('onboarding-overlay').classList.add('hidden');
    render();
}

window.addEventListener('DOMContentLoaded', initApp);

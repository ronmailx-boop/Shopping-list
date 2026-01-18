let db = JSON.parse(localStorage.getItem('VPLUS_DB_V2')) || { 
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
    localStorage.setItem('VPLUS_DB_V2', JSON.stringify(db));
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

    // עדכון טאבים
    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        
        itemsContainer.innerHTML = '';
        let total = 0;
        const items = db.lists[db.currentId].items;
        
        if (items.length === 0) {
            itemsContainer.innerHTML = '<div class="text-center p-10 text-gray-400">הרשימה ריקה. לחץ על + להוספה</div>';
        }

        items.forEach((item, idx) => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            const div = document.createElement('div');
            div.className = "item-card animate-[fadeIn_0.3s]";
            div.innerHTML = `
                <div class="font-bold text-lg">${item.name}</div>
                <div class="text-indigo-600 font-black">₪${subtotal.toFixed(2)}</div>
            `;
            itemsContainer.appendChild(div);
        });

        document.getElementById('displayTotal').innerText = total.toFixed(2);
        document.getElementById('displayLeft').innerText = total.toFixed(2);
    } else {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        summaryContainer.innerHTML = '<div class="text-center p-10 text-gray-400">דף סיכומי רשימות</div>';
    }
}

function addItemPrompt() {
    const n = prompt("שם המוצר:");
    const p = parseFloat(prompt("מחיר:"));
    if (n && !isNaN(p)) {
        db.lists[db.currentId].items.push({ name: n, price: p, qty: 1 });
        save();
    }
}

function initApp() {
    const splash = document.getElementById('splash-screen');
    const onboarding = document.getElementById('onboarding-overlay');
    
    setTimeout(() => {
        splash.classList.add('fade-out');
        const hasSeen = localStorage.getItem('vplus_seen_v3');
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
        <div class="onboarding-step">
            <img src="${step.image}" class="mx-auto shadow-lg">
            <h2 class="font-black text-2xl">${step.title}</h2>
            <p class="mt-2 text-gray-500">${step.desc}</p>
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
    localStorage.setItem('vplus_seen_v3', 'true');
    document.getElementById('onboarding-overlay').classList.add('hidden');
    render();
}

window.addEventListener('DOMContentLoaded', initApp);

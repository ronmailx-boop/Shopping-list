let db = JSON.parse(localStorage.getItem('VPLUS_DB_V1')) || { 
    currentId: 'L1', 
    lists: { 'L1': { name: 'הרשימה שלי', items: [] } },
    lastActivePage: 'lists'
};

const onboardingSteps = [
    { title: "ברוכים הבאים", desc: "ניהול רשימות קניות ותקציב במקום אחד.", image: "icon.png" },
    { title: "שליטה בהוצאות", desc: "עקבו אחרי הסכומים בזמן אמת.", image: "icon.png" },
    { title: "סנכרון ענן", desc: "גבו את הנתונים לענן של גוגל.", image: "icon.png" }
];

let currentOnboardingStep = 0;

function save() {
    localStorage.setItem('VPLUS_DB_V1', JSON.stringify(db));
    render();
}

// פונקציה לחישוב סה"כ (למניעת שגיאות רינדור)
function getTotals() {
    let t = 0;
    const items = db.lists[db.currentId].items;
    items.forEach(i => t += (i.price * i.qty));
    return t;
}

function render() {
    const container = document.getElementById('itemsContainer');
    const mainContent = document.getElementById('main-content');
    if (!container || !mainContent) return;

    // בניית ממשק האפליקציה בתוך ה-main-content
    mainContent.innerHTML = `
        <div class="bg-white p-4 rounded-2xl shadow-sm mb-4 flex justify-between items-center">
            <h2 class="text-xl font-bold">${db.lists[db.currentId].name}</h2>
            <div class="text-indigo-600 font-black text-xl">₪${getTotals().toFixed(2)}</div>
        </div>
        <div id="itemsContainer"></div>
        <button onclick="addItemPrompt()" class="fixed bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-green-500 text-white rounded-full text-4xl shadow-2xl z-50">+</button>
    `;

    // רינדור המוצרים
    const itemsList = document.getElementById('itemsContainer');
    db.lists[db.currentId].items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = "bg-white p-4 rounded-xl mb-2 shadow-sm flex justify-between";
        div.innerHTML = `<span>${item.name}</span> <b>₪${(item.price * item.qty).toFixed(2)}</b>`;
        itemsList.appendChild(div);
    });
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
        const hasSeen = localStorage.getItem('vplus_onboarding_v2');
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
            <img src="${step.image}" class="mx-auto shadow-xl">
            <h2 class="font-black text-indigo-600">${step.title}</h2>
            <p class="text-gray-600 font-medium">${step.desc}</p>
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
        localStorage.setItem('vplus_onboarding_v2', 'true');
        document.getElementById('onboarding-overlay').classList.add('hidden');
        render();
    }
};

document.getElementById('onboarding-skip').onclick = () => {
    localStorage.setItem('vplus_onboarding_v2', 'true');
    document.getElementById('onboarding-overlay').classList.add('hidden');
    render();
};

window.addEventListener('DOMContentLoaded', initApp);

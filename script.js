// ========== Original App Logic & Data ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V27')) || { 
    currentId: 'L1', 
    selectedInSummary: [], 
    lists: { 'L1': { name: 'הרשימה שלי', url: '', items: [] } },
    lastActivePage: 'lists',
    lastSync: 0
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentOnboardingStep = 0;

const onboardingSteps = [
    {
        title: "ברוכים הבאים ל-Vplus",
        desc: "הדרך החכמה ביותר לנהל את רשימות הקניות והתקציב המשפחתי במקום אחד.",
        image: "icon.png"
    },
    {
        title: "שליטה מלאה בהוצאות",
        desc: "עקבו אחרי הסכום לתשלום בזמן אמת. המערכת מחשבת כמה שילמתם וכמה נשאר.",
        image: "icon.png" 
    },
    {
        title: "סנכרון ושיתוף ענן",
        desc: "גבו את הנתונים לענן של גוגל ושתפו את הרשימות בוואטסאפ בלחיצה אחת.",
        image: "icon.png"
    }
];

function save() { 
    db.lastActivePage = activePage;
    localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
    render();
}

function render() {
    // ... לוגיקת הרינדור הקיימת שלכם ...
    // עדכון תצוגת הכותרת והסכומים
    const total = calculateTotal(); // פונקציה פנימית שלכם
    document.getElementById('displayTotal').innerText = total.toFixed(2);
}

// --- Splash & Onboarding Logic ---
function initSplashAndOnboarding() {
    const splash = document.getElementById('splash-screen'), onboarding = document.getElementById('onboarding-overlay');
    setTimeout(() => {
        splash.classList.add('fade-out');
        const hasSeen = localStorage.getItem('vplus_onboarding_seen_v2');
        if (!hasSeen) { 
            onboarding.classList.remove('hidden'); 
            onboarding.classList.add('flex'); 
            renderOnboardingStep(); 
        }
    }, 2500);
}

function renderOnboardingStep() {
    const content = document.getElementById('onboarding-content'), dots = document.getElementById('onboarding-dots'), step = onboardingSteps[currentOnboardingStep];
    content.innerHTML = `<div class="onboarding-step animate-[fadeIn_0.5s_ease-out]"><img src="${step.image}" class="mx-auto shadow-2xl mb-8"><h2 class="text-3xl font-black text-indigo-600 mb-6">${step.title}</h2><p class="text-gray-600 text-xl px-4 leading-relaxed">${step.desc}</p></div>`;
    dots.innerHTML = onboardingSteps.map((_, i) => `<div class="dot ${i === currentOnboardingStep ? 'active' : ''}"></div>`).join('');
    document.getElementById('onboarding-next').innerText = currentOnboardingStep === onboardingSteps.length - 1 ? "מתחילים!" : "הבא";
}

function finishOnboarding() { 
    localStorage.setItem('vplus_onboarding_seen_v2', 'true'); 
    document.getElementById('onboarding-overlay').classList.add('hidden'); 
}

window.addEventListener('DOMContentLoaded', () => {
    initSplashAndOnboarding();
    document.getElementById('onboarding-next').onclick = () => { 
        if (currentOnboardingStep < onboardingSteps.length - 1) { 
            currentOnboardingStep++; 
            renderOnboardingStep(); 
        } else finishOnboarding(); 
    };
    document.getElementById('onboarding-skip').onclick = finishOnboarding;
    render();
});

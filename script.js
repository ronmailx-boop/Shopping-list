// ... (כל שאר הקוד של ה-DB והסנכרון נשאר זהה) ...

function render() {
    // ... (לוגיקה קיימת) ...
    
    // עדכון סמל המנעול ב-SVG
    const lockBtn = document.getElementById('mainLockBtn');
    const lockIconSvg = document.getElementById('lockIconSvg');
    
    if (isLocked) {
        lockBtn.className = "w-12 h-12 bg-[#42a5f5] rounded-full flex items-center justify-center shadow-lg active:scale-90";
        lockIconSvg.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
    } else {
        lockBtn.className = "w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center shadow-lg active:scale-90";
        lockIconSvg.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><line x1="12" y1="11" x2="12" y2="17"></line>'; // גרסה של מנעול פתוח
    }
}

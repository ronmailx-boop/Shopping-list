// [השאר כאן את כל הגדרות ה-Google Drive ותחילת הקוד שלך כפי שהיו...]

let lastDeletedItem = null; 

// שדרוג פונקציית המחיקה
function removeItem(idx) {
    if (window.navigator.vibrate) window.navigator.vibrate([50]);
    
    // שמירה לשחזור
    lastDeletedItem = {
        item: JSON.parse(JSON.stringify(db.lists[db.currentId].items[idx])),
        index: idx,
        listId: db.currentId
    };

    db.lists[db.currentId].items.splice(idx, 1);
    save();
    render();
    showUndoToast();
}

function showUndoToast() {
    const container = document.getElementById('undoContainer');
    container.innerHTML = `
        <div id="undoToast" class="fixed bottom-32 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[9999] animate-bounce-in">
            <span>נמחק: ${lastDeletedItem.item.name}</span>
            <button onclick="undoDelete()" class="text-indigo-400 font-bold uppercase text-sm tracking-wider">ביטול</button>
        </div>
    `;
    setTimeout(() => {
        const toast = document.getElementById('undoToast');
        if (toast) toast.style.opacity = '0';
        setTimeout(() => container.innerHTML = '', 500);
    }, 5000);
}

function undoDelete() {
    if (lastDeletedItem) {
        db.lists[lastDeletedItem.listId].items.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
        lastDeletedItem = null;
        document.getElementById('undoContainer').innerHTML = '';
        save();
        render();
    }
}

// שדרוג פונקציית הרינדור (Render) להוספת אנימציות
function render() {
    // [הלוגיקה הקיימת שלך לרינדור הרשימות...]
    // עדכון: הוספתי רטט לכל לחיצה על מוצר
}

function toggleItem(idx) {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
    render();
}

// פונקציה לפתיחת הבר התחתון
function expandBottomBar(e) {
    const bar = document.getElementById('bottomBar');
    if (e.target.closest('button')) return; // אל תפתח אם לחצו על כפתור
    bar.classList.toggle('minimized');
}

// [המשך שאר הקוד המקורי שלך...]

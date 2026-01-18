// script.js - תוספות נבחרות (שלב בתוך הקובץ הקיים)

let lastDeletedItem = null; // לשמירת פריט שנמחק לצורך Undo

function removeItem(idx) {
    // שמירת עותק לפני המחיקה
    lastDeletedItem = { 
        item: {...db.lists[db.currentId].items[idx]}, 
        index: idx,
        listId: db.currentId 
    };
    
    db.lists[db.currentId].items.splice(idx, 1);
    save();
    showUndoToast();
}

function showUndoToast() {
    const existing = document.getElementById('undo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'undo-toast';
    toast.innerHTML = `
        <div style="position:fixed; bottom:160px; left:50%; transform:translateX(-50%); background:#333; color:white; padding:12px 20px; border-radius:50px; display:flex; gap:15px; z-index:9999; box-shadow:0 5px 15px rgba(0,0,0,0.3);">
            <span>הפריט נמחק</span>
            <button onclick="undoDelete()" style="color:#7367f0; font-weight:bold; border:none; background:none;">ביטול מחיקה (Undo)</button>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function undoDelete() {
    if (lastDeletedItem) {
        db.lists[lastDeletedItem.listId].items.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
        lastDeletedItem = null;
        const toast = document.getElementById('undo-toast');
        if (toast) toast.remove();
        save();
    }
}

// הוספת רטט קל בסמארטפון בעת סימון מוצר
function toggleItem(idx) {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

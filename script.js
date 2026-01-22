// הוסיפי למשתנים הגלובליים למעלה
let showMissingOnly = false;
let highlightedItemId = null;

// פונקציית סינון מוצרים חסרים
function toggleMissingFilter() {
    showMissingOnly = !showMissingOnly;
    const btn = document.getElementById('filterMissingBtn');
    btn.innerText = showMissingOnly ? "הצג הכל" : "הצג חסרים בלבד";
    btn.classList.toggle('bg-orange-400', showMissingOnly);
    render();
}

// ניהול חיפוש מוצרים והצעות
function handleItemSearch(val) {
    const suggestions = document.getElementById('itemSuggestions');
    if (!val.trim()) {
        suggestions.classList.add('hidden');
        return;
    }

    const currentItems = db.lists[db.currentId].items;
    const matches = currentItems.filter(i => i.name.toLowerCase().includes(val.toLowerCase()));

    if (matches.length > 0) {
        suggestions.innerHTML = matches.map(i => `
            <div class="p-4 border-bottom hover:bg-indigo-50 cursor-pointer font-bold text-right" 
                 onclick="highlightItem('${i.name.replace(/'/g, "\\'")}')">
                ${i.name}
            </div>
        `).join('');
        suggestions.classList.remove('hidden');
    } else {
        suggestions.classList.add('hidden');
    }
}

function highlightItem(itemName) {
    document.getElementById('itemSearchInput').value = '';
    document.getElementById('itemSuggestions').classList.add('hidden');
    highlightedItemId = itemName;
    showMissingOnly = false; // מבטל סינון כדי לוודא שהמוצר מוצג
    render();
    
    // גלילה למוצר המודגש
    setTimeout(() => {
        const el = document.querySelector('.highlight-flash');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // הסרת ההדגשה אחרי 3 שניות
        setTimeout(() => { highlightedItemId = null; render(); }, 3000);
    }, 100);
}

// עדכון פונקציית render הקיימת (החלק של pageLists)
function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (!container) return;
    container.innerHTML = '';
    let total = 0, paid = 0;

    // ... (שאר הלוגיקה של הטאבים והנעילה נשארת זהה) ...

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        const list = db.lists[db.currentId];
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} מוצרים`;

        // מיון זמני לצורך חיפוש: המוצר המודגש יהיה ראשון
        let itemsToRender = list.items.map((item, idx) => ({ ...item, originalIdx: idx }));
        
        if (highlightedItemId) {
            itemsToRender.sort((a, b) => a.name === highlightedItemId ? -1 : b.name === highlightedItemId ? 1 : 0);
        }

        itemsToRender.forEach((item) => {
            const sub = item.price * item.qty; 
            total += sub; 
            if (item.checked) paid += sub;

            // בדיקת פילטר "חסרים בלבד"
            if (showMissingOnly && item.checked) return;

            const isHighlighted = item.name === highlightedItemId;
            const div = document.createElement('div'); 
            div.className = `item-card ${isHighlighted ? 'highlight-flash' : ''}`;
            div.setAttribute('data-id', item.originalIdx);
            
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${item.originalIdx})" class="w-7 h-7 accent-indigo-600">
                        <div class="flex-1 text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                            <span class="item-number">${item.originalIdx + 1}.</span> ${item.name}
                        </div>
                    </div>
                    <button onclick="removeItem(${item.originalIdx})" class="trash-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                        <button onclick="changeQty(${item.originalIdx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                        <span class="font-bold w-6 text-center">${item.qty}</span>
                        <button onclick="changeQty(${item.originalIdx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                    </div>
                    <span onclick="openEditTotalModal(${item.originalIdx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        // ... הקוד של pageSummary נשאר ללא שינוי ...
    }
    // ... שאר הפונקציה ...
}

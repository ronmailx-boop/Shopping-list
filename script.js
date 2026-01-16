} else {
            const metadata = {
                name: FILE_NAME,
                parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([dataToSave], { type: 'application/json' }));

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            });

            const result = await response.json();
            driveFileId = result.id;
        }

        console.log('✅ סונכרן לענן');
    } catch (err) {
        console.error('❌ שגיאה בסינכרון:', err);
    } finally {
        isSyncing = false;
        updateCloudIndicator('connected');
    }
}

async function loadAndMerge() {
    if (!accessToken || isSyncing) return;
    
    isSyncing = true;
    updateCloudIndicator('syncing');

    try {
        const folderId = await findOrCreateFolder();
        if (!folderId) {
            isSyncing = false;
            updateCloudIndicator('connected');
            return;
        }

        const fileId = await findFileInFolder(folderId);
        
        if (!fileId) {
            console.log('📁 אין קובץ בענן - שומר נתונים מקומיים');
            isSyncing = false;
            updateCloudIndicator('connected');
            await syncToCloud();
            return;
        }

        driveFileId = fileId;

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const cloudData = await response.json();
        
        const currentCheckedState = {};
        if (db.lists[db.currentId]) {
            db.lists[db.currentId].items.forEach(item => {
                currentCheckedState[item.name] = item.checked;
            });
        }
        
        const localItems = db.lists[db.currentId] ? [...db.lists[db.currentId].items] : [];
        
        db = cloudData;
        
        if (db.lists[db.currentId]) {
            db.lists[db.currentId].items.forEach(item => {
                if (currentCheckedState.hasOwnProperty(item.name)) {
                    item.checked = currentCheckedState[item.name];
                }
            });
        }
        
        if (localItems.length > 0) {
            const currentListId = db.currentId || 'L1';
            if (!db.lists[currentListId]) {
                db.lists[currentListId] = { name: 'הרשימה שלי', items: [] };
            }
            
            const cloudItemNames = db.lists[currentListId].items.map(i => i.name);
            const newItems = localItems.filter(localItem => 
                !cloudItemNames.includes(localItem.name)
            );
            
            if (newItems.length > 0) {
                db.lists[currentListId].items.push(...newItems);
                console.log(`✅ צורפו ${newItems.length} מוצרים חדשים`);
            }
        }
        
        localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
        render();
        
        if (localItems.length > 0 || Object.keys(currentCheckedState).length > 0) {
            isSyncing = false;
            updateCloudIndicator('connected');
            await syncToCloud();
        }
        
        console.log('✅ טעינה מהענן הושלמה');
    } catch (err) {
        console.error('❌ שגיאה בטעינה:', err);
    } finally {
        isSyncing = false;
        updateCloudIndicator('connected');
    }
}

async function manualSync() {
    await loadAndMerge();
}

// ========== מחווה גרירה לבר התחתון - מתוקן מלא ==========
function initBottomBarGesture() {
    const bottomBar = document.querySelector('.bottom-bar');
    if (!bottomBar) return;

    let isDragging = false;
    let startY = 0;

    // מאזין ללחיצה על האזור העליון (25 פיקסלים הראשונים)
    bottomBar.addEventListener('click', (e) => {
        if (isDragging) return;
        
        const rect = bottomBar.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        
        // אם לחצו על האזור העליון (25 פיקסלים ראשונים)
        if (clickY < 25) {
            toggleBottomBar();
            e.stopPropagation();
            e.preventDefault();
        }
    });

    bottomBar.addEventListener('touchstart', (e) => {
        const rect = bottomBar.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        
        // התחל גרירה רק אם נוגעים באזור העליון
        if (touchY < 25) {
            isDragging = false;
            startY = e.touches[0].clientY;
        }
    }, { passive: true });

    bottomBar.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].clientY;
        const diff = Math.abs(currentY - startY);
        
        if (diff > 10) {
            isDragging = true;
        }
    }, { passive: true });

    bottomBar.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const endY = e.changedTouches[0].clientY;
        const swipeDistance = startY - endY;
        
        if (swipeDistance < -50 && !isBottomBarCollapsed) {
            collapseBottomBar();
        }
        else if (swipeDistance > 50 && isBottomBarCollapsed) {
            expandBottomBar();
        }
        
        isDragging = false;
    });
}

function collapseBottomBar() {
    isBottomBarCollapsed = true;
    const bottomBar = document.querySelector('.bottom-bar');
    bottomBar.classList.add('collapsed');
    document.body.style.paddingBottom = '35px';
}

function expandBottomBar() {
    isBottomBarCollapsed = false;
    const bottomBar = document.querySelector('.bottom-bar');
    bottomBar.classList.remove('collapsed');
    document.body.style.paddingBottom = '200px';
}

function toggleBottomBar() {
    if (isBottomBarCollapsed) {
        expandBottomBar();
    } else {
        collapseBottomBar();
    }
}

// טעינת Google API
const script1 = document.createElement('script');
script1.src = 'https://apis.google.com/js/api.js';
script1.onload = gapiLoaded;
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://accounts.google.com/gsi/client';
script2.onload = gisLoaded;
document.head.appendChild(script2);

// אתחול ראשוני
if (db.fontSize) {
    updateFontSize(db.fontSize);
}
render();
setTimeout(initBottomBarGesture, 500); {
                name: FILE_NAME,
                parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([dataToSave], { type: 'application/json' }));

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            });

            const result = await response.json();
            driveFileId = result.id;
        }

        console.log('✅ סונכרן לענן');
    } catch (err) {
        console.error('❌ שגיאה בסינכרון:', err);
    } finally {
        isSyncing = false;
        updateCloudIndicator('connected');
    }
}

async function loadAndMerge() {
    if (!accessToken || isSyncing) return;
    
    isSyncing = true;
    updateCloudIndicator('syncing');

    try {
        const folderId = await findOrCreateFolder();
        if (!folderId) {
            isSyncing = false;
            updateCloudIndicator('connected');
            return;
        }

        const fileId = await findFileInFolder(folderId);
        
        if (!fileId) {
            console.log('📁 אין קובץ בענן - שומר נתונים מקומיים');
            isSyncing = false;
            updateCloudIndicator('connected');
            await syncToCloud();
            return;
        }

        driveFileId = fileId;

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const cloudData = await response.json();
        
        const currentCheckedState = {};
        if (db.lists[db.currentId]) {
            db.lists[db.currentId].items.forEach(item => {
                currentCheckedState[item.name] = item.checked;
            });
        }
        
        const localItems = db.lists[db.currentId] ? [...db.lists[db.currentId].items] : [];
        
        db = cloudData;
        
        if (db.lists[db.currentId]) {
            db.lists[db.currentId].items.forEach(item => {
                if (currentCheckedState.hasOwnProperty(item.name)) {
                    item.checked = currentCheckedState[item.name];
                }
            });
        }
        
        if (localItems.length > 0) {
            const currentListId = db.currentId || 'L1';
            if (!db.lists[currentListId]) {
                db.lists[currentListId] = { name: 'הרשימה שלי', items: [] };
            }
            
            const cloudItemNames = db.lists[currentListId].items.map(i => i.name);
            const newItems = localItems.filter(localItem => 
                !cloudItemNames.includes(localItem.name)
            );
            
            if (newItems.length > 0) {
                db.lists[currentListId].items.push(...newItems);
                console.log(`✅ צורפו ${newItems.length} מוצרים חדשים`);
            }
        }
        
        localStorage.setItem('BUDGET_FINAL_V27', JSON.stringify(db));
        render();
        
        if (localItems.length > 0 || Object.keys(currentCheckedState).length > 0) {
            isSyncing = false;
            updateCloudIndicator('connected');
            await syncToCloud();
        }
        
        console.log('✅ טעינה מהענן הושלמה');
    } catch (err) {
        console.error('❌ שגיאה בטעינה:', err);
    } finally {
        isSyncing = false;
        updateCloudIndicator('connected');
    }
}

async function manualSync() {
    await loadAndMerge();
}

// ========== מחווה גרירה לבר התחתון - מתוקן מלא ==========
function initBottomBarGesture() {
    const bottomBar = document.querySelector('.bottom-bar');
    if (!bottomBar) return;

    let isDragging = false;
    let startY = 0;

    // מאזין ללחיצה על האזור העליון (25 פיקסלים הראשונים)
    bottomBar.addEventListener('click', (e) => {
        if (isDragging) return;
        
        const rect = bottomBar.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        
        // אם לחצו על האזור העליון (25 פיקסלים ראשונים)
        if (clickY < 25) {
            toggleBottomBar();
            e.stopPropagation();
            e.preventDefault();
        }
    });

    bottomBar.addEventListener('touchstart', (e) => {
        const rect = bottomBar.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        
        // התחל גרירה רק אם נוגעים באזור העליון
        if (touchY < 25) {
            isDragging = false;
            startY = e.touches[0].clientY;
        }
    }, { passive: true });

    bottomBar.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].clientY;
        const diff = Math.abs(currentY - startY);
        
        if (diff > 10) {
            isDragging = true;
        }
    }, { passive: true });

    bottomBar.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const endY = e.changedTouches[0].clientY;
        const swipeDistance = startY - endY;
        
        if (swipeDistance < -50 && !isBottomBarCollapsed) {
            collapseBottomBar();
        }
        else if (swipeDistance > 50 && isBottomBarCollapsed) {
            expandBottomBar();
        }
        
        isDragging = false;
    });
}

function collapseBottomBar() {
    isBottomBarCollapsed = true;
    const bottomBar = document.querySelector('.bottom-bar');
    bottomBar.classList.add('collapsed');
    document.body.style.paddingBottom = '35px';
}

function expandBottomBar() {
    isBottomBarCollapsed = false;
    const bottomBar = document.querySelector('.bottom-bar');
    bottomBar.classList.remove('collapsed');
    document.body.style.paddingBottom = '200px';
}

function toggleBottomBar() {
    if (isBottomBarCollapsed) {
        expandBottomBar();
    } else {
        collapseBottomBar();
    }
}

// טעינת Google API
const script1 = document.createElement('script');
script1.src = 'https://apis.google.com/js/api.js';
script1.onload = gapiLoaded;
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://accounts.google.com/gsi/client';
script2.onload = gisLoaded;
document.head.appendChild(script2);

// אתחול ראשוני
if (db.fontSize) {
    updateFontSize(db.fontSize);
}
render();
setTimeout(initBottomBarGesture, 500);
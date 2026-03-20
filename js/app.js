


// Global variables for delete confirmation
let categoryToDelete = null;
let categoryIndexToDelete = null;

function openDeleteCategoryModal(categoryName, categoryIndex) {
    categoryToDelete = categoryName;
    categoryIndexToDelete = categoryIndex;
    
    const nameDisplay = document.getElementById('categoryToDeleteName');
    if (nameDisplay) {
        nameDisplay.textContent = categoryName;
        const color = CATEGORIES[categoryName] || '#7367f0';
        nameDisplay.style.color = color;
    }
    
    openModal('deleteCategoryModal');
}

function executeDeleteCategory() {
    if (categoryToDelete !== null && categoryIndexToDelete !== null) {
        deleteCustomCategory(categoryToDelete, categoryIndexToDelete);
        closeModal('deleteCategoryModal');
        categoryToDelete = null;
        categoryIndexToDelete = null;
    }
}

function deleteCustomCategory(categoryName, categoryIndex) {
    // Remove from customCategories array
    if (db.customCategories && categoryIndex >= 0 && categoryIndex < db.customCategories.length) {
        db.customCategories.splice(categoryIndex, 1);
    }

    // Remove from category memory - find all products assigned to this category
    if (db.categoryMemory) {
        Object.keys(db.categoryMemory).forEach(productName => {
            if (db.categoryMemory[productName] === categoryName) {
                db.categoryMemory[productName] = 'אחר';
            }
        });
    }

    // Update all items in all lists that have this category
    Object.keys(db.lists).forEach(listId => {
        db.lists[listId].items.forEach(item => {
            if (item.category === categoryName) {
                item.category = 'אחר';
            }
        });
    });

    // Update items in history
    if (db.history && db.history.length > 0) {
        db.history.forEach(entry => {
            entry.items.forEach(item => {
                if (item.category === categoryName) {
                    item.category = 'אחר';
                }
            });
        });
    }

    // Remove from CATEGORIES color mapping
    if (CATEGORIES[categoryName]) {
        delete CATEGORIES[categoryName];
    }

    // Save and update UI
    save();
    renderCustomCategoriesList();
    updateCategoryDropdown();
    showNotification(`✅ הקטגוריה '${categoryName}' נמחקה`);
}

function updateCategoryDropdown() {
    const categorySelect = document.getElementById('itemCategory');
    if (!categorySelect) return;

    // Save current value
    const currentValue = categorySelect.value;

    // Rebuild options
    categorySelect.innerHTML = `<option value="">${t('selectCategory')}</option>`;

    // Add default categories
    const categories = categoryTranslations[currentLang] || categoryTranslations['he'];
    for (const hebrewKey in categories) {
        const option = document.createElement('option');
        option.value = hebrewKey;
        option.textContent = categories[hebrewKey];
        categorySelect.appendChild(option);
    }

    // Add custom categories
    if (db.customCategories && db.customCategories.length > 0) {
        db.customCategories.forEach(customCat => {
            const option = document.createElement('option');
            option.value = customCat;
            option.textContent = `✨ ${customCat}`;
            categorySelect.appendChild(option);
        });
    }

    // Restore value if still valid
    if (currentValue && Array.from(categorySelect.options).some(opt => opt.value === currentValue)) {
        categorySelect.value = currentValue;
    }
}

// ========== Data Export/Import ==========
function exportData() {
    const dataStr = JSON.stringify(db, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vplus_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('💾 הנתונים יוצאו בהצלחה!');
    closeModal('settingsModal');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm('האם לשחזר את כל הנתונים? פעולה זו תדרוס את הנתונים הנוכחיים!')) {
                db = importedData;
                save();
                showNotification('✅ הנתונים שוחזרו בהצלחה!');
                closeModal('settingsModal');
            }
        } catch (err) {
            alert('שגיאה בקריאת הקובץ.');
        }
    };
    reader.readAsText(file);
}

// ========== Firebase Integration ==========

// Check for redirect result on load
// ========== Firebase Integration ==========

// Helper function to show detailed errors
// Helper function to show detailed errors with visual display
function showDetailedError(context, error) {
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const errorMessage = error.message || 'Unknown error occurred';

    console.error(`❌ [${context}] שגיאה מפורטת:`, {
        code: errorCode,
        message: errorMessage,
        fullError: error
    });

    let errorTitle = context;
    let userMessage = '';

    // Handle common Firebase Auth errors
    if (errorCode.includes('auth/')) {
        if (errorCode === 'auth/unauthorized-domain') {
            errorTitle = "⚠️ הדומיין לא מורשה";
            userMessage = `הדומיין הזה לא מורשה להתחברות ב-Firebase.

צעדים לפתרון:
1. פתח את Firebase Console
2. עבור ל: Authentication → Settings
3. גלול ל: Authorized domains
4. הוסף את הדומיין: ${window.location.hostname}`;
        } else if (errorCode === 'auth/operation-not-allowed') {
            errorTitle = "⚠️ Google Sign-In לא מופעל";
            userMessage = `שיטת ההתחברות של Google לא מופעלת.

צעדים לפתרון:
1. פתח Firebase Console
2. עבור ל: Authentication → Sign-in method
3. מצא את "Google" ברשימה
4. לחץ עליו ואפשר אותו (Enable)`;
        } else if (errorCode === 'auth/popup-blocked') {
            errorTitle = "⚠️ חלון נחסם";
            userMessage = "הדפדפן חסם את חלון ההתחברות.\n\nאפשר חלונות קופצים לאתר זה.";
        } else if (errorCode === 'auth/network-request-failed') {
            errorTitle = "⚠️ בעיית רשת";
            userMessage = "לא ניתן להתחבר לשרתי Firebase.\n\nבדוק את החיבור לאינטרנט.";
        } else {
            userMessage = `קוד שגיאה: ${errorCode}\n\n${errorMessage}`;
        }
    }
    // Handle Firestore errors  
    else if (errorCode.includes('permission-denied')) {
        errorTitle = "⚠️ אין הרשאה";
        userMessage = 'אין הרשאה לגשת לנתונים.\n\nבדוק הגדרות Firebase Security Rules.';
    }
    else if (errorCode.includes('unavailable')) {
        errorTitle = "⚠️ שירות לא זמין";
        userMessage = 'השירות לא זמין כרגע.\n\nנסה שוב מאוחר יותר.';
    }
    else {
        userMessage = `קוד: ${errorCode}\n\n${errorMessage}`;
    }

    // Show visual error if function exists
    if (typeof window.showFirebaseError === 'function') {
        window.showFirebaseError(errorTitle, userMessage);
    } else {
        // Fallback to notification
        showNotification(`❌ ${errorTitle}\n\n${userMessage}`, 'error');
    }
}

// Wait for Firebase to load before initializing
const checkFirebase = setInterval(() => {
    if (window.firebaseAuth) {
        clearInterval(checkFirebase);
        console.log('✅ Firebase זמין, מאתחל...');
        initFirebaseAuth();

        // NOTE: redirect result is checked in index.html script
        // We don't check it again here to avoid duplicate checks
    }
}, 100);

// Timeout check to warn user if firebase doesn't load
setTimeout(() => {
    if (!window.firebaseAuth) {
        console.warn("⚠️ Firebase לא נטען אחרי 10 שניות");
        showNotification('⚠️ שירות הענן לא זמין - טען מחדש את הדף', 'warning');
        if (typeof window.showFirebaseError === 'function') {
            window.showFirebaseError(
                '⚠️ Firebase לא נטען',
                'שירות הענן לא הצליח להיטען.\n\nנסה לרענן את הדף (F5).'
            );
        }
    }
}, 10000);

function initFirebaseAuth() {
    console.log('🔄 מאתחל Firebase Auth...');

    window.onAuthStateChanged(window.firebaseAuth, (user) => {
        currentUser = user;
        isConnected = !!user;

        console.log('👤 מצב משתמש:', user ? `מחובר: ${user.email} (UID: ${user.uid})` : 'מנותק');

        // Update UI
        updateCloudIndicator(user ? 'connected' : 'disconnected');

        const emailDisplay = document.getElementById('userEmailDisplay');
        const logoutBtn = document.getElementById('logoutBtn');

        // Update email display in settings
        if (emailDisplay) {
            emailDisplay.textContent = user ? `מחובר כ: ${user.email}` : 'לא מחובר';
            emailDisplay.style.color = user ? '#059669' : '#6b7280';
        }

        // Show/hide logout button
        if (logoutBtn) {
            if (user) {
                logoutBtn.classList.remove('hidden');
            } else {
                logoutBtn.classList.add('hidden');
            }
        }

        // Setup Firestore listener or cleanup
        if (user) {
            console.log("✅ משתמש מחובר:", user.email, "UID:", user.uid);
            setupFirestoreListener(user);
        } else {
            console.log("⚠️ אין משתמש מחובר");
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
        }
    });

    // Override cloud button click handler
    const cloudBtn = document.getElementById('cloudBtn');
    if (cloudBtn) {
        cloudBtn.onclick = function () {
            if (wizardMode) {
                wiz('cloudBtn', 'before', () => {
                    if (currentUser) {
                        openModal('settingsModal');
                    } else {
                        loginWithGoogle();
                    }
                });
            } else {
                if (currentUser) {
                    openModal('settingsModal');
                } else {
                    loginWithGoogle();
                }
            }
        };
    }
}

function loginWithGoogle() {
    if (!window.firebaseAuth) {
        showNotification('⏳ שירות הענן עדיין נטען... נסה שוב בעוד רגע', 'warning');
        console.warn('⚠️ Firebase Auth לא זמין');
        return;
    }

    if (!window.googleProvider) {
        showNotification('⚠️ Google provider לא זמין', 'warning');
        console.warn('⚠️ Google Provider לא זמין');
        return;
    }

    // Check if already logged in
    if (window.firebaseAuth.currentUser) {
        showNotification('✅ אתה כבר מחובר', 'success');
        console.log('ℹ️ משתמש כבר מחובר:', window.firebaseAuth.currentUser.email);
        openModal('settingsModal'); // Show settings instead
        return;
    }

    console.log('🔐 מתחיל תהליך התחברות Google...');
    console.log('🔐 Auth:', window.firebaseAuth ? 'זמין' : 'לא זמין');
    console.log('🔐 Provider:', window.googleProvider ? 'זמין' : 'לא זמין');
    updateCloudIndicator('syncing');

    // Use signInWithRedirect for GitHub Pages, signInWithPopup for Firebase domains
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        // GitHub Pages - use Redirect (Popup is blocked)
        console.log('🔐 GitHub Pages detected - using Redirect...');
        showNotification('⏳ מעביר לדף ההתחברות של Google...', 'success');
        window.signInWithRedirect(window.firebaseAuth, window.googleProvider)
            .catch((error) => {
                console.error("❌ שגיאת התחברות:", error);
                showDetailedError('Login', error);
                updateCloudIndicator('disconnected');
            });
    } else {
        // Firebase domains - use Popup (faster UX)
        console.log('🔐 Firebase domain detected - using Popup...');
        window.signInWithPopup(window.firebaseAuth, window.googleProvider)
            .then((result) => {
                console.log('✅ התחברות הצליחה!', result.user.email);
                showNotification('✅ התחברת בהצלחה!', 'success');
                currentUser = result.user;
                isConnected = true;
                updateCloudIndicator('connected');
                setupFirestoreListener(result.user);
            })
            .catch((error) => {
                console.error("❌ שגיאת התחברות:", error);
                console.error("❌ קוד שגיאה:", error.code);
                console.error("❌ הודעת שגיאה:", error.message);
                
                if (error.code === 'auth/popup-closed-by-user') {
                    console.log('ℹ️ המשתמש סגר את חלון ההתחברות');
                    showNotification('ℹ️ חלון ההתחברות נסגר', 'warning');
                } else if (error.code === 'auth/cancelled-popup-request') {
                    console.log('ℹ️ בקשת popup בוטלה');
                    showNotification('ℹ️ ההתחברות בוטלה', 'warning');
                } else if (error.code === 'auth/popup-blocked') {
                    console.log('⚠️ הדפדפן חסם את חלון ההתחברות');
                    showNotification('⚠️ הדפדפן חסם את חלון ההתחברות', 'warning');
                } else {
                    showDetailedError('Login', error);
                }
                updateCloudIndicator('disconnected');
            });
    }
}

function logoutFromCloud() {
    if (!window.firebaseAuth) {
        showNotification('⚠️ שירות הענן לא זמין', 'warning');
        console.warn('⚠️ Firebase Auth לא זמין להתנתקות');
        return;
    }

    console.log('🚪 מתנתק מהענן...');
    updateCloudIndicator('syncing');

    window.signOut(window.firebaseAuth).then(() => {
        currentUser = null;
        isConnected = false;
        console.log('✅ התנתקות הושלמה');
        showNotification('👋 התנתקת מהענן', 'success');
        updateCloudIndicator('disconnected');
        closeModal('settingsModal');
    }).catch((error) => {
        console.error("❌ שגיאת התנתקות:", error);
        showDetailedError('Logout', error);
        updateCloudIndicator('connected'); // Revert to connected state
    });
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    const text = document.getElementById('cloudSyncText');
    const cloudBtn = document.getElementById('cloudBtn');

    if (!indicator || !cloudBtn) {
        console.warn('⚠️ לא נמצאו אלמנטים של כפתור הענן');
        return;
    }

    console.log('🔄 מעדכן אינדיקטור ענן:', status, 'משתמש:', currentUser ? currentUser.email : 'אין');

    if (status === 'connected') {
        // Green indicator - connected successfully
        indicator.className = 'w-2 h-2 bg-green-500 rounded-full';

        // Update button style to green (connected style)
        cloudBtn.className = 'cloud-btn-connected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';

        // Show short status instead of full email to save space
        if (text) text.textContent = "מחובר ✅";
    } else if (status === 'syncing') {
        // Yellow indicator - syncing in progress with pulse animation
        indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
        cloudBtn.className = 'cloud-btn-syncing px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = "מסנכרן...";
    } else {
        // Red indicator - disconnected state
        indicator.className = 'w-2 h-2 bg-red-400 rounded-full';
        cloudBtn.className = 'cloud-btn-disconnected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = "מנותק";
    }
}

function setupFirestoreListener(user) {
    console.log('📡 מגדיר Firestore listener עבור UID:', user.uid);

    const userDocRef = window.doc(window.firebaseDb, "shopping_lists", user.uid);

    unsubscribeSnapshot = window.onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            console.log('☁️ מסמך נמצא בענן');
            const cloudData = docSnap.data();

            // בדיקה: אם הענן ריק אבל יש נתונים מקומיים, העלה אותם לענן
            const cloudIsEmpty = !cloudData.lists || Object.keys(cloudData.lists).length === 0;
            const localHasData = db.lists && Object.keys(db.lists).length > 0;

            if (cloudIsEmpty && localHasData) {
                console.log('☁️ הענן ריק אבל יש נתונים מקומיים - מעלה לענן');
                syncToCloud();
                return;
            }

            // מיזוג חכם: הענן הוא מקור האמת למחיקות
            if (JSON.stringify(cloudData) !== JSON.stringify(db)) {
                console.log('🔄 מבצע סנכרון חכם מהענן...');
                const mergedDb = mergeCloudWithLocal(cloudData, db);

                // הגנה: וודא שקיים אובייקט רשימות
                if (!mergedDb.lists || Object.keys(mergedDb.lists).length === 0) {
                    mergedDb.lists = {
                        'L1': {
                            name: 'הרשימה שלי',
                            url: '',
                            budget: 0,
                            isTemplate: false,
                            items: []
                        }
                    };
                    mergedDb.currentId = 'L1';
                }

                db = mergedDb;
                localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
                render();
                showNotification('☁️ סונכרן מהענן!', 'success');
            }
        } else {
            console.log('📝 מסמך לא קיים בענן, יוצר חדש...');
            syncToCloud();
        }
    }, (error) => {
        console.error("❌ שגיאת Firestore sync:", error);
        showDetailedError('Firestore Sync', error);
        if (currentUser) {
            updateCloudIndicator('connected');
        }
    });
}


// ─── normalizeItem: שומר את כל שדות הפריט כולל תזכורות ─────────────────────
function normalizeItem(item) {
    return {
        name: item.name || '',
        price: item.price || 0,
        qty: item.qty || 1,
        checked: item.checked || false,
        category: item.category || 'אחר',
        note: item.note || '',
        dueDate: item.dueDate || '',
        dueTime: item.dueTime || '',
        paymentUrl: item.paymentUrl || '',
        isPaid: item.isPaid || false,
        lastUpdated: item.lastUpdated || Date.now(),
        cloudId: item.cloudId || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
        // ─ שדות תזכורת — חייבים להישמר! ─
        reminderValue: item.reminderValue || '',
        reminderUnit: item.reminderUnit || '',
        nextAlertTime: item.nextAlertTime || null,
        alertDismissedAt: item.alertDismissedAt || null,
        isGeneralNote: item.isGeneralNote || false
    };
}

function mergeCloudWithLocal(cloudData, localData) {
    console.log('🔄 מבצע מיזוג חכם בין ענן למקומי...');

    const merged = JSON.parse(JSON.stringify(cloudData)); // עותק עמוק של נתוני הענן

    // Normalize all items in cloud data - ensure all fields exist
    Object.keys(merged.lists || {}).forEach(listId => {
        if (merged.lists[listId].items) {
            merged.lists[listId].items = merged.lists[listId].items.map(item => {
                return normalizeItem(item);
            });
        }
    });

    // עבור כל רשימה
    Object.keys(cloudData.lists || {}).forEach(listId => {
        const cloudList = cloudData.lists[listId];
        const localList = localData.lists && localData.lists[listId];

        if (!localList) {
            // אין רשימה מקומית - השתמש בענן
            return;
        }

        // יצירת מפת cloudId לפריטי ענן
        const cloudItemsMap = {};
        (cloudList.items || []).forEach(item => {
            if (item.cloudId) {
                cloudItemsMap[item.cloudId] = item;
            }
        });

        // מעבר על פריטים מקומיים
        (localList.items || []).forEach(localItem => {
            if (!localItem.cloudId) {
                // פריט ללא cloudId - זה פריט ישן או חדש שנוסף לפני השינוי
                // נוסיף לו cloudId ונוסיף אותו
                localItem.cloudId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                // Normalize local item as well
                merged.lists[listId].items.push(normalizeItem(localItem));
                console.log('➕ מוסיף פריט חדש מקומי ללא cloudId:', localItem.name);
            } else if (!cloudItemsMap[localItem.cloudId]) {
                // פריט עם cloudId שלא קיים בענן - זה פריט חדש שנוסף באופליין
                merged.lists[listId].items.push(normalizeItem(localItem));
                console.log('➕ מוסיף פריט חדש מאופליין:', localItem.name);
            } else {
                // פריט קיים גם בענן - עדכן אותו מהענן (הענן מנצח)
                console.log('✓ פריט קיים בשניהם, משתמש בנתוני ענן:', localItem.name);
            }
        });
    });

    // בדיקת רשימות חדשות שנוספו מקומית
    Object.keys(localData.lists || {}).forEach(listId => {
        if (!merged.lists[listId]) {
            console.log('📝 מוסיף רשימה חדשה מקומית:', listId);
            merged.lists[listId] = localData.lists[listId];
            // Normalize items in new local list
            if (merged.lists[listId].items) {
                merged.lists[listId].items = merged.lists[listId].items.map(normalizeItem);
            }
        }
    });

    return merged;
}

async function syncToCloud() {
    if (!currentUser) {
        console.warn('⚠️ אין משתמש מחובר, מדלג על סנכרון');
        return;
    }

    console.log('☁️ מסנכרן לענן... UID:', currentUser.uid);
    updateCloudIndicator('syncing');

    try {
        const userDocRef = window.doc(window.firebaseDb, "shopping_lists", currentUser.uid);
        await window.setDoc(userDocRef, db);
        console.log('✅ סנכרון לענן הושלם בהצלחה');
        // Removed notification - indicator shows sync status
    } catch (error) {
        console.error("❌ שגיאה בכתיבה לענן:", error);
        showDetailedError('Cloud Sync', error);
    } finally {
        // Return to connected state
        updateCloudIndicator('connected');
    }
}

// Initialize language on page load
const html = document.documentElement;
if (currentLang === 'he') {
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', 'he');
} else {
    html.setAttribute('dir', 'ltr');
    html.setAttribute('lang', currentLang);
}

render();
updateUILanguage();

// ========== Excel Import Functions ==========

// פונקציה לזיהוי אינדקס עמודה לפי מילות מפתח - חיפוש גמיש
function findColumnIndex(headerRow, keywords) {
    if (!headerRow || !Array.isArray(headerRow)) return -1;

    for (let i = 0; i < headerRow.length; i++) {
        const cell = headerRow[i];
        if (cell && typeof cell === 'string') {
            const cellNormalized = cell.trim().replace(/\s+/g, ' ').toLowerCase();

            for (const keyword of keywords) {
                const keywordNormalized = keyword.trim().replace(/\s+/g, ' ').toLowerCase();

                // בדיקה אם התא מכיל את מילת המפתח
                if (cellNormalized.includes(keywordNormalized)) {
                    return i;
                }
            }
        }
    }
    return -1;
}

// פונקציה לניקוי וחילוץ מספר מתא מחיר
function extractPrice(priceCell) {
    if (!priceCell) return 0;

    // המרה למחרוזת
    let priceStr = String(priceCell).trim();

    // ניקוי אגרסיבי: הסרת כל מה שלא ספרות, נקודה עשרונית או מינוס
    priceStr = priceStr.replace(/[^\d.-]/g, '');

    // טיפול במקרים של מספרים שליליים או כפולים
    priceStr = priceStr.replace(/--/g, '');

    // המרה למספר והחזרת ערך מוחלט (חיובי)
    const price = parseFloat(priceStr);
    return Math.abs(price) || 0;
}

// בדיקה האם תא מכיל תאריך תקין
function isDateCell(cell) {
    if (!cell || typeof cell !== 'string') return false;

    const cellTrimmed = cell.trim();

    // תבניות תאריך נפוצות
    const datePatterns = [
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,      // DD/MM/YYYY או DD/MM/YY
        /^\d{1,2}-\d{1,2}-\d{2,4}$/,        // DD-MM-YYYY או DD-MM-YY
        /^\d{1,2}\.\d{1,2}\.\d{2,4}$/,      // DD.MM.YYYY או DD.MM.YY
        /^\d{4}-\d{1,2}-\d{1,2}$/,          // YYYY-MM-DD
    ];

    for (const pattern of datePatterns) {
        if (pattern.test(cellTrimmed)) {
            return true;
        }
    }

    return false;
}

// פונקציה ראשית לייבוא אקסל
async function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showNotification('⏳ מעבד קובץ אקסל...', 'info');

        // קריאת הקובץ
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });

        console.log('📂 נפתח קובץ עם', workbook.SheetNames.length, 'גליונות:', workbook.SheetNames);

        // מבנה נתונים לאיסוף עסקאות לפי כרטיס
        // { '1234': [{name, price}, ...], '5678': [...] }
        const cardTransactions = {};
        let totalItemCount = 0;

        // ========== שלב 1: מעבר על כל הגליונות ==========
        for (const sheetName of workbook.SheetNames) {
            console.log(`\n📊 מעבד גיליון: "${sheetName}"`);

            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

            if (rows.length === 0) {
                console.log('⚠️  הגיליון ריק');
                continue;
            }

            // ========== שלב 2: חיפוש שורת כותרת ==========
            let headerRowIndex = -1;
            let nameColIndex = -1;
            let priceColIndex = -1;
            let cardColIndex = -1;

            // מילות מפתח לחיפוש
            const nameKeywords = [
                'שם בית העסק',
                'שם בית עסק',
                'שם העסק',
                'בית עסק',
                'שם עסק',
                'תיאור',
                'שם מוטב'
            ];

            const priceKeywords = [
                'סכום חיוב',
                'סכום',
                'חיוב',
                'סה״כ',
                'מחיר',
                'total',
                'amount'
            ];

            const cardKeywords = [
                '4 ספרות אחרונות של כרטיס האשראי',
                '4 ספרות אחרונות',
                'ספרות אחרונות',
                'כרטיס אשראי',
                'מספר כרטיס'
            ];

            // סריקת עד 40 שורות ראשונות לחיפוש כותרת
            for (let i = 0; i < Math.min(40, rows.length); i++) {
                const currentRow = rows[i];

                // נסה למצוא את עמודת השם, המחיר והכרטיס
                const foundNameCol = findColumnIndex(currentRow, nameKeywords);
                const foundPriceCol = findColumnIndex(currentRow, priceKeywords);
                const foundCardCol = findColumnIndex(currentRow, cardKeywords);

                // אם מצאנו את שלוש העמודות - זו שורת הכותרת!
                if (foundNameCol !== -1 && foundPriceCol !== -1 && foundCardCol !== -1) {
                    headerRowIndex = i;
                    nameColIndex = foundNameCol;
                    priceColIndex = foundPriceCol;
                    cardColIndex = foundCardCol;

                    console.log(`✅ נמצאה שורת כותרת בשורה ${i}:`);
                    console.log(`   📝 עמודת שם (${nameColIndex}): "${currentRow[nameColIndex]}"`);
                    console.log(`   💰 עמודת מחיר (${priceColIndex}): "${currentRow[priceColIndex]}"`);
                    console.log(`   💳 עמודת כרטיס (${cardColIndex}): "${currentRow[cardColIndex]}"`);
                    break;
                }
            }

            if (headerRowIndex === -1) {
                console.log('❌ לא נמצאה שורת כותרת מתאימה בגיליון');
                continue;
            }

            // ========== שלב 3: מציאת תחילת הנתונים ==========
            let dataStartIndex = -1;

            // מחפשים שורה שמתחילה בתאריך (אחרי שורת הכותרת)
            for (let i = headerRowIndex + 1; i < rows.length; i++) {
                const firstCell = rows[i][0];

                if (isDateCell(firstCell)) {
                    dataStartIndex = i;
                    console.log(`✅ תחילת נתונים בשורה ${i}, תאריך ראשון: "${firstCell}"`);
                    break;
                }
            }

            if (dataStartIndex === -1) {
                console.log('❌ לא נמצאו שורות נתונים עם תאריך');
                continue;
            }

            // ========== שלב 4: ייבוא עסקאות ופיצול לפי כרטיסים ==========
            let sheetItemCount = 0;

            for (let i = dataStartIndex; i < rows.length; i++) {
                const row = rows[i];

                // בדיקה שהשורה מתחילה בתאריך (=שורת נתונים תקינה)
                const firstCell = row[0];
                if (!isDateCell(firstCell)) {
                    // הגענו לסוף הנתונים או שורה לא תקינה
                    console.log(`⏹️  עצירה בשורה ${i} (לא תאריך)`);
                    break;
                }

                // חילוץ שם עסק מהעמודה שזיהינו
                const businessName = row[nameColIndex];

                if (!businessName || typeof businessName !== 'string' || businessName.trim() === '') {
                    console.log(`⚠️  שורה ${i}: שם עסק ריק, מדלג`);
                    continue;
                }

                // חילוץ מחיר מהעמודה שזיהינו
                const priceCell = row[priceColIndex];
                const price = extractPrice(priceCell);

                // חילוץ מספר כרטיס (4 ספרות אחרונות)
                const cardCell = row[cardColIndex];
                let cardNumber = '';

                if (cardCell && typeof cardCell === 'string') {
                    // חילוץ רק הספרות מהתא
                    cardNumber = cardCell.replace(/\D/g, '');
                    // אם יש יותר מ-4 ספרות, קח את ה-4 אחרונות
                    if (cardNumber.length > 4) {
                        cardNumber = cardNumber.slice(-4);
                    }
                } else if (cardCell && typeof cardCell === 'number') {
                    cardNumber = String(cardCell).slice(-4);
                }

                // אם לא מצאנו מספר כרטיס תקין, דלג על השורה
                if (!cardNumber || cardNumber.length !== 4) {
                    console.log(`⚠️  שורה ${i}: מספר כרטיס לא תקין (${cardCell}), מדלג`);
                    continue;
                }

                // אם זה הכרטיס הראשון שנתקלנו בו, צור לו מערך ריק
                if (!cardTransactions[cardNumber]) {
                    cardTransactions[cardNumber] = [];
                    console.log(`💳 כרטיס חדש זוהה: ${cardNumber}`);
                }

                // הוסף את העסקה למערך של הכרטיס הספציפי
                cardTransactions[cardNumber].push({
                    name: businessName.trim(),
                    price: price
                });

                sheetItemCount++;
                totalItemCount++;
            }

            console.log(`✅ מגיליון "${sheetName}" יובאו ${sheetItemCount} עסקאות`);
        }

        // ========== שלב 5: יצירת רשימות נפרדות לכל כרטיס ==========
        if (totalItemCount === 0) {
            console.log('❌ לא נמצאו עסקאות לייבוא');
            showNotification('❌ לא נמצאו עסקאות תקינות בקובץ האקסל', 'error');
            event.target.value = '';
            return;
        }

        const cardNumbers = Object.keys(cardTransactions);
        console.log(`\n💳 נמצאו ${cardNumbers.length} כרטיסים שונים:`, cardNumbers);

        let firstListId = null;

        for (const cardNumber of cardNumbers) {
            const transactions = cardTransactions[cardNumber];

            // יצירת רשימה חדשה לכרטיס
            const listId = 'L' + Date.now() + '_' + cardNumber;
            const listName = `אשראי ${cardNumber}`;

            db.lists[listId] = {
                name: listName,
                items: [],
                url: '',
                budget: 0,
                createdAt: Date.now(),
                isTemplate: false,
                cloudId: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };

            // הוספת כל העסקאות לרשימה
            for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                db.lists[listId].items.push({
                    name: transaction.name,
                    price: transaction.price,
                    qty: 1,
                    checked: false,
                    category: 'אחר',  // קטגוריה קבועה לכל העסקאות
                    cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i
                });
            }

            console.log(`✅ נוצרה רשימה "${listName}" עם ${transactions.length} עסקאות`);

            // שמור את הרשימה הראשונה למעבר אליה
            if (!firstListId) {
                firstListId = listId;
            }
        }

        // ========== שלב 6: מעבר לרשימה הראשונה ==========
        if (firstListId) {
            db.currentId = firstListId;
        }

        save();

        console.log(`\n🎉 סה"כ יובאו ${totalItemCount} עסקאות ל-${cardNumbers.length} רשימות`);
        showNotification(`✅ נוצרו ${cardNumbers.length} רשימות עם סה"כ ${totalItemCount} עסקאות!`);
        event.target.value = '';

    } catch (error) {
        console.error('❌ Excel Import Error:', error);
        showNotification('❌ שגיאה בקריאת קובץ האקסל: ' + error.message, 'error');
        event.target.value = '';
    }
}

// ========== BANK IMPORT FUNCTIONALITY ==========

/**
 * Main function to handle bank file imports (XLS/PDF)
 * This function is called when user selects a file via the bank import button
 */
async function importBankFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`📄 ייבוא קובץ בנקאי: ${file.name} (${file.type})`);
    showNotification('⏳ מעבד קובץ בנקאי...');

    const fileExtension = file.name.toLowerCase().split('.').pop();

    try {
        if (fileExtension === 'pdf') {
            await importBankPDF(file);
        } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
            await importBankXLS(file);
        } else {
            showNotification('❌ פורמט קובץ לא נתמך. השתמש ב-XLS או PDF', 'error');
        }
    } catch (error) {
        console.error('❌ שגיאה בייבוא בנקאי:', error);
        showNotification('❌ שגיאה בעיבוד הקובץ: ' + error.message, 'error');
    }

    event.target.value = '';
}

/**
 * Import bank transactions from XLS file (actually HTML table disguised as XLS)
 * The file contains multiple tables (transfers, checks, credit cards) that need to be unified
 */
async function importBankXLS(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                console.log('📊 מתחיל עיבוד קובץ XLS בנקאי...');

                // Use readAsBinaryString for Android compatibility
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                console.log(`📋 נמצאו ${workbook.SheetNames.length} גיליונות:`, workbook.SheetNames);

                const allTransactions = [];

                // Process each sheet in the workbook
                for (const sheetName of workbook.SheetNames) {
                    console.log(`\n🔍 מעבד גיליון: "${sheetName}"`);
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                    console.log(`📝 סה"כ ${rows.length} שורות בגיליון`);

                    // Extract transactions from this sheet
                    const sheetTransactions = extractTransactionsFromSheet(rows, sheetName);
                    allTransactions.push(...sheetTransactions);

                    console.log(`✅ חולצו ${sheetTransactions.length} עסקאות מגיליון "${sheetName}"`);
                }

                if (allTransactions.length === 0) {
                    showNotification('❌ לא נמצאו עסקאות בקובץ', 'error');
                    resolve();
                    return;
                }

                console.log(`\n💾 סה"כ ${allTransactions.length} עסקאות לשמירה`);

                // Save transactions to Firebase (with duplicate prevention)
                await saveTransactionsToFirebase(allTransactions);

                showNotification(`✅ יובאו ${allTransactions.length} עסקאות בהצלחה!`);
                resolve();

            } catch (error) {
                console.error('❌ שגיאה בעיבוד XLS:', error);
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('שגיאה בקריאת הקובץ'));
        };

        // Use readAsBinaryString for Android compatibility
        reader.readAsBinaryString(file);
    });
}

/**
 * Extract transactions from a single sheet
 * Handles multiple tables in one sheet and filters out totals rows
 */
function extractTransactionsFromSheet(rows, sheetName) {
    const transactions = [];

    // Find header row (contains "תאריך", "תיאור", "סכום" or similar)
    let headerRowIndex = -1;
    let dateColIndex = -1;
    let descriptionColIndex = -1;
    let amountColIndex = -1;

    // Search for header row
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i];

        for (let j = 0; j < row.length; j++) {
            const cell = String(row[j]).trim();

            // Check for date column
            if (cell.includes('תאריך') || cell.toLowerCase().includes('date')) {
                dateColIndex = j;
            }

            // Check for description column
            if (cell.includes('תיאור') || cell.includes('פרטים') || cell.includes('אסמכתא') ||
                cell.toLowerCase().includes('description') || cell.toLowerCase().includes('details')) {
                descriptionColIndex = j;
            }

            // Check for amount column
            if (cell.includes('סכום') || cell.includes('חיוב') || cell.includes('זכות') ||
                cell.toLowerCase().includes('amount') || cell.toLowerCase().includes('debit') ||
                cell.toLowerCase().includes('credit')) {
                amountColIndex = j;
            }
        }

        // If we found all three columns, this is our header row
        if (dateColIndex !== -1 && descriptionColIndex !== -1 && amountColIndex !== -1) {
            headerRowIndex = i;
            console.log(`✓ שורת כותרת נמצאה בשורה ${i}: תאריך=${dateColIndex}, תיאור=${descriptionColIndex}, סכום=${amountColIndex}`);
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.log(`⚠️  לא נמצאה שורת כותרת בגיליון "${sheetName}"`);
        return transactions;
    }

    // Process data rows (starting after header)
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];

        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
            continue;
        }

        const dateCell = row[dateColIndex];
        const descriptionCell = row[descriptionColIndex];
        const amountCell = row[amountColIndex];

        // Skip if missing critical data
        if (!descriptionCell || String(descriptionCell).trim() === '') {
            continue;
        }

        const description = String(descriptionCell).trim();

        // Filter out summary/total rows
        if (isTotalRow(description)) {
            console.log(`⏭️  מדלג על שורת סיכום: "${description}"`);
            continue;
        }

        // Parse date
        const date = parseDate(dateCell);
        if (!date) {
            console.log(`⚠️  שורה ${i}: תאריך לא תקין (${dateCell}), מדלג`);
            continue;
        }

        // Parse amount
        const amount = parseAmount(amountCell);
        if (amount === 0) {
            console.log(`⚠️  שורה ${i}: סכום אפס או לא תקין (${amountCell}), מדלג`);
            continue;
        }

        // Add transaction
        transactions.push({
            date: date,
            description: description,
            amount: amount,
            source: sheetName
        });
    }

    return transactions;
}

/**
 * Import bank transactions from PDF file
 * Extracts date, description, and amount from PDF text
 */
async function importBankPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                console.log('📄 מתחיל עיבוד קובץ PDF בנקאי...');

                // Use readAsArrayBuffer for Android compatibility with PDF.js
                const arrayBuffer = e.target.result;

                // Load PDF document
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                console.log(`📖 PDF נטען: ${pdf.numPages} עמודים`);

                const allTransactions = [];

                // Process each page
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    // Extract text from page
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    console.log(`📄 עמוד ${pageNum}: ${pageText.length} תווים`);

                    // DEBUG: הצג את הטקסט שנחלץ
                    console.log('🔍 טקסט שנחלץ מהעמוד:', pageText.substring(0, 500));

                    // Extract transactions from page text
                    const pageTransactions = extractTransactionsFromPDFText(pageText);
                    allTransactions.push(...pageTransactions);

                    console.log(`✅ חולצו ${pageTransactions.length} עסקאות מעמוד ${pageNum}`);
                }

                if (allTransactions.length === 0) {
                    showNotification('❌ לא נמצאו עסקאות ב-PDF', 'error');
                    resolve();
                    return;
                }

                console.log(`\n💾 סה"כ ${allTransactions.length} עסקאות לשמירה`);

                // Save transactions to Firebase (with duplicate prevention)
                await saveTransactionsToFirebase(allTransactions);

                showNotification(`✅ יובאו ${allTransactions.length} עסקאות בהצלחה!`);
                resolve();

            } catch (error) {
                console.error('❌ שגיאה בעיבוד PDF:', error);
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('שגיאה בקריאת הקובץ'));
        };

        // Use readAsArrayBuffer for Android compatibility with PDF.js
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Extract transactions from PDF text content
 * Looks for patterns of date, description, and amount
 */
function extractTransactionsFromPDFText(text) {
    const transactions = [];
    const lines = text.split(/\r?\n/);

    console.log(`🔍 מעבד ${lines.length} שורות מה-PDF`);

    // פורמט בנק הפועלים: טבלה עם עמודות
    // תאריך | תאריך ערך | תיאור | אסמכתא | חובה | זכות | יתרה
    // דוגמה: "06/01/2026 06/01/2026 כרטיס דביט 41657 50.03 -28,599.22"

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line || line.length < 20) {
            continue; // שורה ריקה או קצרה מדי
        }

        // חיפוש תאריך בתחילת השורה (DD/MM/YYYY)
        const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);

        if (!dateMatch) {
            continue; // אין תאריך - דלג
        }

        const dateStr = dateMatch[1];
        let restOfLine = line.substring(dateStr.length).trim();

        // הסר תאריך ערך נוסף אם קיים
        restOfLine = restOfLine.replace(/^\d{2}\/\d{2}\/\d{4}\s+/, '');

        // חילוץ כל המספרים בשורה (כולל אלה עם פסיקים)
        // דוגמה: ["41657", "50.03", "28,599.22"] או ["99012", "350.00", "28,249.22"]
        const numberMatches = restOfLine.match(/[\d,]+\.?\d*/g);

        if (!numberMatches || numberMatches.length < 2) {
            continue; // לא מספיק מספרים
        }

        // המספר האחרון = היתרה (בפורמט: -28,599.22)
        // המספר לפני אחרון = הסכום (חובה או זכות)
        const balanceStr = numberMatches[numberMatches.length - 1];
        const amountStr = numberMatches[numberMatches.length - 2];

        // חילוץ התיאור - הכל עד המספר האחרון לפני הסכום
        let description = restOfLine;

        // הסר את שני המספרים האחרונים (סכום + יתרה)
        const lastBalanceIndex = description.lastIndexOf(balanceStr);
        if (lastBalanceIndex > 0) {
            description = description.substring(0, lastBalanceIndex).trim();
        }

        const lastAmountIndex = description.lastIndexOf(amountStr);
        if (lastAmountIndex > 0) {
            description = description.substring(0, lastAmountIndex).trim();
        }

        // הסר מספר אסמכתא אם קיים (בדרך כלל המספר האחרון שנשאר)
        // למשל: "כרטיס דביט 41657" -> "כרטיס דביט"
        const remainingNumbers = description.match(/\d+/g);
        if (remainingNumbers && remainingNumbers.length > 0) {
            const lastNum = remainingNumbers[remainingNumbers.length - 1];
            const lastNumIndex = description.lastIndexOf(lastNum);
            description = description.substring(0, lastNumIndex).trim();
        }

        // נקה רווחים מיותרים
        description = description.replace(/\s+/g, ' ').trim();

        // בדיקות תקינות
        if (!description || description.length < 3) {
            continue; // תיאור קצר מדי
        }

        // דלג על שורות כותרת וסיכום
        if (isTotalRow(description) ||
            description.includes('תאריך') ||
            description.includes('יתרה') ||
            description.includes('אסמכתא') ||
            description.includes('חובה') ||
            description.includes('זכות')) {
            continue;
        }

        // Parse date
        const date = parseDate(dateStr);
        if (!date) {
            continue;
        }

        // Parse amount
        const amount = parseAmount(amountStr);
        if (amount === 0) {
            continue;
        }

        console.log(`✅ נמצא: ${dateStr} | ${description} | ${amount}`);

        transactions.push({
            date: date,
            description: description,
            amount: amount,
            source: 'PDF'
        });
    }

    console.log(`📊 סה"כ ${transactions.length} עסקאות חולצו`);
    return transactions;
}

/**
 * Check if a description indicates a total/summary row
 */
function isTotalRow(description) {
    const totalKeywords = [
        'סה"כ', 'סהכ', 'סך הכל', 'total', 'sum', 'subtotal',
        'יתרה', 'balance', 'סיכום', 'summary', 'מחזור'
    ];

    const lowerDesc = description.toLowerCase();
    return totalKeywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()));
}

/**
 * Parse date from various formats
 * Supports: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD/MM/YY
 */
function parseDate(dateCell) {
    if (!dateCell) return null;

    let dateStr = String(dateCell).trim();

    // If it's already a date object from Excel
    if (dateCell instanceof Date) {
        return formatDate(dateCell);
    }

    // Remove any non-date characters
    dateStr = dateStr.replace(/[^\d\/\-\.]/g, '');

    // Try to parse different date formats
    const datePatterns = [
        /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,  // DD/MM/YYYY
        /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})/    // DD/MM/YY
    ];

    for (const pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
            let day = match[1];
            let month = match[2];
            let year = match[3];

            // Convert 2-digit year to 4-digit
            if (year.length === 2) {
                year = '20' + year;
            }

            return `${day}/${month}/${year}`;
        }
    }

    return null;
}

/**
 * Format Date object to DD/MM/YYYY string
 */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Parse amount from various formats
 * Handles: -150.50, 150.50, -150,50, 150,50, (150.50)
 */
function parseAmount(amountCell) {
    if (!amountCell && amountCell !== 0) return 0;

    let amountStr = String(amountCell).trim();

    // Remove currency symbols and spaces
    amountStr = amountStr.replace(/[₪$€£\s]/g, '');

    // Handle parentheses as negative (accounting format)
    if (amountStr.startsWith('(') && amountStr.endsWith(')')) {
        amountStr = '-' + amountStr.slice(1, -1);
    }

    // Replace comma with dot for decimal point
    amountStr = amountStr.replace(',', '.');

    // Parse to float
    const amount = parseFloat(amountStr);

    return isNaN(amount) ? 0 : Math.abs(amount); // Return absolute value
}

/**
 * Save transactions to Firebase with duplicate prevention and create list
 * Creates a new list from bank transactions and switches to it
 */
async function saveTransactionsToFirebase(transactions) {
    console.log(`📋 מעבד ${transactions.length} עסקאות...`);

    if (transactions.length === 0) {
        showNotification('⚠️ לא נמצאו עסקאות לייבוא');
        return;
    }

    // א. יצירת רשימה חדשה
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const newListName = `ייבוא בנקאי ${dateStr}`;
    const newListId = 'list_' + Date.now();

    // ב. המרת עסקאות למוצרים עם תיקון שדות
    const items = [];
    for (const transaction of transactions) {
        const category = detectCategory(transaction.description);

        // יצירת cloudId ייחודי למניעת בעיות סנכרון
        const cloudId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // וידוא שה-price הוא מספר תקין ולא NaN
        let itemPrice = parseFloat(transaction.amount);

        // ניקוי הסכום מסימני מטבע ופסיקים
        if (typeof transaction.amount === 'string') {
            const cleanAmount = transaction.amount.replace(/[₪$€£\s,]/g, '').replace(',', '.');
            itemPrice = parseFloat(cleanAmount);
        }

        // בדיקת תקינות
        if (isNaN(itemPrice) || itemPrice === null || itemPrice === undefined) {
            itemPrice = 0;
        }

        items.push({
            name: transaction.description,
            qty: 1,  // חשוב: qty ולא quantity - זה השדה שהאפליקציה משתמשת בו
            price: itemPrice,  // מספר תקין בלבד, ללא NaN
            category: category,
            checked: false,
            cloudId: cloudId  // cloudId ייחודי לסנכרון ענן
        });
    }

    // יצירת הרשימה החדשה
    db.lists[newListId] = {
        name: newListName,
        items: items,
        createdAt: Date.now(),
        completed: false,
        isTemplate: false
    };

    // ג. מעבר אוטומטי לרשימה החדשה
    db.currentId = newListId;
    activePage = 'lists';

    // ד. סנכרון - שמירה ורינדור (ללא switchTab שלא קיים)
    save();
    render();  // רענון המסך להצגת הרשימה החדשה

    // ה. מניעת כפילויות - שמירת העסקאות ב-Firebase תחת transactions
    if (window.firebaseDb && window.firebaseAuth) {
        const user = window.firebaseAuth.currentUser;
        if (user) {
            let savedCount = 0;
            let duplicateCount = 0;

            for (const transaction of transactions) {
                try {
                    // Create unique ID from transaction data
                    const uniqueId = btoa(`${transaction.date}_${transaction.description}_${transaction.amount}`)
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .substring(0, 100);

                    const docRef = window.doc(
                        window.firebaseDb,
                        "shopping_lists",
                        user.uid,
                        "transactions",
                        uniqueId
                    );

                    const docSnap = await window.getDoc(docRef);

                    if (!docSnap.exists()) {
                        await window.setDoc(docRef, {
                            date: transaction.date,
                            description: transaction.description,
                            amount: transaction.amount,
                            source: transaction.source,
                            createdAt: Date.now()
                        });
                        savedCount++;
                    } else {
                        duplicateCount++;
                    }
                } catch (error) {
                    console.error(`❌ שגיאה בשמירת עסקה "${transaction.description}":`, error);
                }
            }

            console.log(`✅ Firebase: ${savedCount} נשמרו, ${duplicateCount} כפילויות דולגו`);
        }
    }

    showNotification(`✅ נוצרה רשימה חדשה עם ${items.length} מוצרים!`);
    closeModal('importModal');
}


// ========== BANK IMPORT FUNCTIONS ==========

/**
 * Main entry point for bank file import
 * Handles both Excel (.xlsx, .xls) and PDF files
 */
async function importBankFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    try {
        showNotification('📂 קורא קובץ...');

        let items = [];

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            items = await parseBankExcel(file);
        } else if (fileExtension === 'pdf') {
            items = await parseBankPDF(file);
        } else {
            showNotification('❌ פורמט קובץ לא נתמך. אנא בחר קובץ Excel או PDF');
            return;
        }

        if (items.length === 0) {
            showNotification('⚠️ לא נמצאו תנועות בנקאיות בקובץ');
            return;
        }

        addBankItemsToList(items);

    } catch (error) {
        console.error('Error importing bank file:', error);
        showNotification('❌ שגיאה בקריאת הקובץ: ' + error.message);
    } finally {
        // Reset file input
        event.target.value = '';
    }
}

/**
 * Parse Excel bank statement
 * Looks for columns: תאריך, תיאור, בחובה
 */
async function parseBankExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    resolve([]);
                    return;
                }

                // Find column indices
                const headers = jsonData[0];
                let dateCol = -1, descCol = -1, debitCol = -1;

                // Debug: log headers to console
                console.log('📊 Excel Headers:', headers);

                headers.forEach((header, index) => {
                    const h = String(header).toLowerCase().trim();

                    // Date column - more flexible matching
                    if (h.includes('תאריך') || h.includes('date') || h.includes('תאר')) {
                        dateCol = index;
                        console.log(`✅ Found date column at index ${index}: "${header}"`);
                    }
                    // Description column - more flexible matching
                    if (h.includes('תיאור') || h.includes('description') || h.includes('פירוט') || h.includes('תאור')) {
                        descCol = index;
                        console.log(`✅ Found description column at index ${index}: "${header}"`);
                    }
                    // Debit column (amount charged) - more flexible matching
                    if (h.includes('בחובה') || h.includes('חובה') || h.includes('debit') || h.includes('חיוב') || h.includes('זכות')) {
                        debitCol = index;
                        console.log(`✅ Found debit column at index ${index}: "${header}"`);
                    }
                });

                console.log('🔍 Column indices:', { dateCol, descCol, debitCol });

                // If we didn't find the debit column, try to find any column with numbers
                if (debitCol === -1 && dateCol !== -1 && descCol !== -1) {
                    console.log('⚠️ Debit column not found by name, searching for numeric column...');
                    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                        if (colIndex === dateCol || colIndex === descCol) continue;
                        // Check if this column has numeric values in first few rows
                        let hasNumbers = false;
                        for (let rowIndex = 1; rowIndex < Math.min(5, jsonData.length); rowIndex++) {
                            const val = jsonData[rowIndex][colIndex];
                            if (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)))) {
                                hasNumbers = true;
                                break;
                            }
                        }
                        if (hasNumbers) {
                            debitCol = colIndex;
                            console.log(`✅ Found numeric column at index ${colIndex}: "${headers[colIndex]}"`);
                            break;
                        }
                    }
                }

                // FALLBACK: If columns not found by name, use LAST 3 columns (Hebrew RTL)
                if (dateCol === -1 || descCol === -1) {
                    console.log('⚠️ Using fallback: last 3 columns (RTL) as date, description, amount');
                    if (headers.length >= 3) {
                        // Hebrew files are RTL, so rightmost columns are first
                        const lastCol = headers.length - 1;
                        dateCol = lastCol;      // Rightmost column = date
                        descCol = lastCol - 1;  // Second from right = description
                        if (debitCol === -1) {
                            debitCol = lastCol - 2;  // Third from right = amount
                        }
                        console.log('📍 Fallback columns (RTL):', { dateCol, descCol, debitCol });
                        console.log(`📍 Using: Date="${headers[dateCol]}", Desc="${headers[descCol]}", Amount="${headers[debitCol]}"`);
                    } else if (headers.length >= 2) {
                        // Only 2 columns - use last 2
                        const lastCol = headers.length - 1;
                        dateCol = lastCol;
                        descCol = lastCol - 1;
                        console.log('📍 Fallback columns (2 cols):', { dateCol, descCol, debitCol });
                    } else {
                        console.error('❌ Not enough columns in file');
                        reject(new Error('הקובץ לא מכיל מספיק עמודות'));
                        return;
                    }
                }

                console.log('🎯 Final columns:', { dateCol, descCol, debitCol });

                // Parse rows
                const items = [];
                console.log(`📋 Processing ${jsonData.length - 1} rows...`);

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];

                    if (!row || row.length === 0) continue;

                    const date = row[dateCol];
                    const description = row[descCol];
                    const debit = debitCol !== -1 ? row[debitCol] : null;

                    // Skip if no description AND no date (completely empty row)
                    if (!description && !date) {
                        console.log(`⏭️ Row ${i}: Skipping empty row`);
                        continue;
                    }

                    // Parse amount
                    let amount = 0;
                    if (debit !== null && debit !== undefined && debit !== '') {
                        if (typeof debit === 'number') {
                            amount = Math.abs(debit);
                        } else if (typeof debit === 'string') {
                            // Remove currency symbols, spaces, and parse
                            const cleanAmount = debit.replace(/[^\d.-]/g, '');
                            if (cleanAmount) {
                                amount = Math.abs(parseFloat(cleanAmount));
                            }
                        }
                    }

                    // Only include rows with a valid debit amount
                    if (isNaN(amount) || amount === 0) {
                        console.log(`⏭️ Row ${i}: No valid debit amount (${debit})`);
                        continue;
                    }

                    // Format date
                    const formattedDate = formatBankDate(date);

                    // Use description or fallback to "תנועה" if empty
                    const finalDescription = description ? String(description).trim() : 'תנועה';

                    console.log(`✅ Row ${i}: ${finalDescription} - ${formattedDate} - ₪${amount}`);

                    items.push({
                        date: formattedDate,
                        description: finalDescription,
                        amount: amount
                    });
                }

                console.log(`✅ Total items parsed: ${items.length}`);
                resolve(items);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('שגיאה בקריאת הקובץ'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse PDF bank statement
 * Extracts text and looks for transaction patterns
 */
async function parseBankPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                const typedArray = new Uint8Array(e.target.result);

                // Load PDF
                const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

                let fullText = '';

                // Extract text from all pages
                console.log(`📄 PDF has ${pdf.numPages} pages`);
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    // Better text extraction - preserve line structure
                    let lastY = -1;
                    let pageText = '';
                    textContent.items.forEach(item => {
                        // Add newline if Y position changed significantly (new line)
                        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                            pageText += '\n';
                        }
                        pageText += item.str + ' ';
                        lastY = item.transform[5];
                    });

                    fullText += pageText + '\n';
                }

                console.log('📝 Extracted text length:', fullText.length);
                console.log('📝 First 500 chars:', fullText.substring(0, 500));

                // Parse transactions from text
                const items = parseTransactionsFromText(fullText);

                resolve(items);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('שגיאה בקריאת קובץ PDF'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse transactions from PDF text
 * Israeli bank format: Amount Number Description Date
 * Example: 655.80 8547 כרטיסי אשראי-י 11/01/2026
 */
function parseTransactionsFromText(text) {
    const items = [];
    const lines = text.split('\n');

    console.log(`🔍 Parsing ${lines.length} lines from PDF...`);

    // Regex patterns for Israeli bank statements
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})/g;
    const amountPattern = /^[\s]*(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 10) continue;

        // Skip balance lines (יתרה בש"ח)
        if (line.includes('יתרה') || line.includes('balance')) {
            console.log(`⏭️ Skipping balance line: "${line}"`);
            continue;
        }

        // Look for dates first
        const dates = [];
        let dateMatch;
        const dateRegex = new RegExp(datePattern);
        while ((dateMatch = dateRegex.exec(line)) !== null) {
            dates.push(dateMatch[1]);
        }

        if (dates.length === 0) continue;

        // Find ALL decimal numbers in the line (numbers with a dot)
        const decimalPattern = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
        const decimalNumbers = [];
        let numMatch;
        while ((numMatch = decimalPattern.exec(line)) !== null) {
            const num = parseFloat(numMatch[0].replace(/,/g, ''));
            if (!isNaN(num) && num > 0) {
                decimalNumbers.push({ value: num, text: numMatch[0] });
            }
        }

        console.log(`🔍 Line ${i}: "${line}"`);
        console.log(`📅 Dates: ${dates.join(', ')}`);
        console.log(`💰 Decimal numbers found: ${decimalNumbers.map(n => `${n.text}=${n.value}`).join(', ')}`);

        if (decimalNumbers.length === 0) {
            console.log(`⏭️ No decimal numbers, skipping`);
            continue;
        }

        // Use the SMALLEST decimal number between 10-10000 as the amount
        // This filters out balance numbers (>10000) while keeping transaction amounts
        const validAmounts = decimalNumbers.filter(n => n.value >= 10 && n.value < 10000).sort((a, b) => a.value - b.value);

        if (validAmounts.length === 0) {
            console.log(`⏭️ No valid amounts (>= 10), skipping`);
            continue;
        }

        const amount = validAmounts[0].value;
        const amountText = validAmounts[0].text;

        console.log(`✅ Using amount: ${amount} from "${amountText}" (smallest >= 10)`);

        const date = dates[dates.length - 1];

        // Extract description: remove all numbers and dates
        let description = line;

        // Remove all decimal numbers
        decimalNumbers.forEach(num => {
            description = description.replace(num.text, '').trim();
        });

        // Remove all dates
        dates.forEach(d => {
            description = description.replace(d, '').trim();
        });

        // Remove any remaining numbers (IDs, etc.)
        description = description.replace(/\d+/g, '').trim();

        // Clean up extra spaces and special characters
        description = description.replace(/\s+/g, ' ').trim();
        description = description.replace(/^[\s\-\.]+|[\s\-\.]+$/g, '').trim();

        if (description.length < 2) {
            description = 'תנועה בנקאית';
        }

        console.log(`✅ Final: "${description}" - ${date} - ₪${amount}`);

        items.push({
            date: formatBankDate(date),
            description: description,
            amount: amount
        });
    }

    console.log(`✅ Total PDF transactions: ${items.length}`);
    return items;
}

/**
 * Add parsed bank items to a NEW list
 */
function addBankItemsToList(items) {
    if (!items || items.length === 0) return;

    // Create a new list for the bank import
    const newListId = 'L' + Date.now();
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    db.lists[newListId] = {
        name: `ייבוא בנקאי ${dateStr}`,
        url: '',
        budget: 0,
        isTemplate: false,
        items: []
    };

    let addedCount = 0;

    items.forEach(item => {
        // Create item name: Description (Date)
        const itemName = `${item.description} (${item.date})`;

        // Add to NEW list with "אחר" category
        db.lists[newListId].items.push({
            name: itemName,
            price: item.amount,
            qty: 1,
            checked: false,
            category: 'אחר',
            cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });

        addedCount++;
    });

    // Switch to the new list
    db.currentId = newListId;

    save();
    showNotification(`✅ נוצרה רשימה חדשה עם ${addedCount} תנועות בנקאיות!`);
}

/**
 * Format date to consistent DD/MM/YYYY format
 */
function formatBankDate(dateInput) {
    if (!dateInput) return '';

    let dateStr = String(dateInput).trim();

    // Handle Excel date numbers
    if (!isNaN(dateInput) && typeof dateInput === 'number') {
        // Excel dates are days since 1900-01-01
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (dateInput - 2) * 24 * 60 * 60 * 1000);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Handle string dates
    // Replace dots and dashes with slashes
    dateStr = dateStr.replace(/[.-]/g, '/');

    // Parse date parts
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;

    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];

    // Handle 2-digit years
    if (year.length === 2) {
        year = '20' + year;
    }

    return `${day}/${month}/${year}`;
}

// ========== NOTES FEATURE ==========
// פתיחת modal להוספה/עריכת הערה למוצר
function openItemNoteModal(itemIndex) {
    currentNoteItemIndex = itemIndex;
    const item = db.lists[db.currentId].items[itemIndex];
    const noteInput = document.getElementById('itemNoteInput');

    // טען הערה קיימת אם יש
    if (noteInput) {
        noteInput.value = item.note || '';
    }

    openModal('itemNoteModal');
}

// Helper function called from metadata HTML
function openItemNote(idx) {
    openItemNoteModal(idx);
}

// שמירת הערה למוצר
function saveItemNote() {
    if (currentNoteItemIndex === null || currentNoteItemIndex === undefined) {
        console.error('currentNoteItemIndex is null or undefined');
        return;
    }

    const noteInput = document.getElementById('itemNoteInput');
    if (!noteInput) {
        console.error('itemNoteInput element not found');
        return;
    }

    const note = noteInput.value.trim();

    // עדכון ההערה ב-DB
    if (db.lists[db.currentId] && db.lists[db.currentId].items[currentNoteItemIndex]) {
        db.lists[db.currentId].items[currentNoteItemIndex].note = note;

        save();
        closeModal('itemNoteModal');
        currentNoteItemIndex = null; // איפוס המשתנה

        if (note) {
            showNotification('✅ ההערה נשמרה');
        } else {
            showNotification('🗑️ ההערה נמחקה');
        }
    } else {
        console.error('Invalid item index or list');
    }
}

// ========== SMART PRICE HISTORY ==========
// מילוי אוטומטי של מחיר מהיסטוריה
function autofillFromHistory(itemName) {
    if (!itemName || itemName.length < 2) return;

    const nameLower = itemName.toLowerCase().trim();

    // חיפוש בכל הרשימות
    let lastPrice = null;
    let lastDate = 0;

    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            if (item.name.toLowerCase().trim() === nameLower && item.price > 0) {
                // השתמש בתאריך עדכון אם קיים, אחרת השתמש ב-0
                const itemDate = item.lastUpdated || 0;
                if (itemDate > lastDate) {
                    lastDate = itemDate;
                    lastPrice = item.price;
                }
            }
        });
    });

    // מילוי שדה המחיר אם נמצא
    const priceInput = document.getElementById('itemPrice');
    if (lastPrice && priceInput && !priceInput.value) {
        priceInput.value = lastPrice;
        priceInput.style.backgroundColor = '#fef3c7';  // צהוב בהיר לסימון
        setTimeout(() => {
            priceInput.style.backgroundColor = '';
        }, 1500);
    }
}

// עדכון מחיר בהיסטוריה - מעדכן את כל המופעים של המוצר
function updatePriceInHistory(itemName, newPrice) {
    if (!itemName || !newPrice) return;

    const nameLower = itemName.toLowerCase().trim();
    const timestamp = Date.now();

    // עדכון בכל הרשימות
    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            if (item.name.toLowerCase().trim() === nameLower) {
                item.price = newPrice;
                item.lastUpdated = timestamp;
            }
        });
    });
}

// מחיקת פריט מהיסטוריית החיפוש
function deleteFromSearchHistory(itemName) {
    if (!itemName) return;

    const nameLower = itemName.toLowerCase().trim();
    let removedCount = 0;

    // הסרה מכל הרשימות
    Object.values(db.lists).forEach(list => {
        const initialLength = list.items.length;
        list.items = list.items.filter(item =>
            item.name.toLowerCase().trim() !== nameLower
        );
        removedCount += initialLength - list.items.length;
    });

    if (removedCount > 0) {
        save();
        render();
        showNotification(`🗑️ הוסרו ${removedCount} מופעים`);
    }
}

// עדכון פונקציית updateSuggestions להוספת כפתור X
const originalUpdateSuggestions = window.updateSuggestions || function () { };
window.updateSuggestions = function (searchText) {
    // קריאה לפונקציה המקורית אם קיימת
    if (typeof originalUpdateSuggestions === 'function') {
        originalUpdateSuggestions(searchText);
    }
};


// ========== DUAL-LAYER SORTING ==========
// מיון דו-שכבתי: לפי סטטוס (לא מסומן/מסומן) ואז לפי קטגוריה
function sortItemsByStatusAndCategory(items) {
    return items.slice().sort((a, b) => {
        // שכבה 1: פריטים לא מסומנים לפני מסומנים
        if (a.checked !== b.checked) {
            return a.checked ? 1 : -1;
        }

        // שכבה 2: מיון לפי קטגוריה בתוך כל קבוצה
        const catA = a.category || 'אחר';
        const catB = b.category || 'אחר';

        // סדר קטגוריות מותאם
        const categoryOrder = [
            'פירות וירקות',
            'בשר ודגים',
            'חלב וביצים',
            'לחם ומאפים',
            'שימורים',
            'חטיפים',
            'משקאות',
            'ניקיון',
            'היגיינה',
            'אחר'
        ];

        const indexA = categoryOrder.indexOf(catA);
        const indexB = categoryOrder.indexOf(catB);

        // אם קטגוריה לא נמצאה ברשימה, שים אותה בסוף
        const orderA = indexA === -1 ? categoryOrder.length : indexA;
        const orderB = indexB === -1 ? categoryOrder.length : indexB;

        return orderA - orderB;
    });
}


// ========== EXCEL IMPORT FUNCTIONALITY ==========
/**
 * Handle Excel file upload and create a new shopping list
 * Parses XLSX file and extracts data from columns B, C, D, E
 * Creates products with format: [Business Name] ([Date]) כרטיס [Card Number]
 */
function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        showNotification('❌ אנא בחר קובץ Excel תקין (.xlsx או .xls)');
        event.target.value = ''; // Reset input
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            // Parse Excel file
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert sheet to JSON with header option to get raw data
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,  // Use array of arrays format
                defval: ''  // Default value for empty cells
            });

            console.log('🔥 EXCEL IMPORT v2.0 - CODE UPDATED! 🔥');
            console.log('Expected: Column 1=name, Column 3=PRICE, Column 6=card, Column 7=date');

            // Skip header row (index 0) and process data rows
            const products = [];

            console.log('📊 Excel Import Debug - First 3 rows:');
            for (let i = 0; i < Math.min(3, jsonData.length); i++) {
                console.log(`Row ${i}:`, jsonData[i]);
                if (i === 0) {
                    // Show header row
                    console.log('Header row breakdown:');
                    for (let j = 0; j < jsonData[i].length; j++) {
                        console.log(`  Column ${j}: "${jsonData[i][j]}"`);
                    }
                }
                if (i === 1 || i === 2) {
                    // Show first 2 data rows in detail
                    console.log(`Data row ${i} breakdown:`);
                    for (let j = 0; j < jsonData[i].length; j++) {
                        console.log(`  Column ${j}: "${jsonData[i][j]}"`);
                    }
                    console.log(`Data row ${i} FULL JSON:`, JSON.stringify(jsonData[i]));
                }
            }

            // Check if data is all in one column (needs splitting)
            // If header row has all column names in column 0, we need to split
            const headerRow = jsonData[0];
            const firstDataRow = jsonData[1];
            const needsSplitting = (headerRow && headerRow[0] && String(headerRow[0]).includes('\t')) ||
                (firstDataRow && firstDataRow[0] && String(firstDataRow[0]).includes('\t'));

            if (needsSplitting) {
                console.log('⚠️ Detected single-column format with tabs - will split data by tabs');
            } else {
                console.log('📊 Using multi-column format');
            }

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];

                if (i <= 3) {
                    console.log(`\n=== Processing row index ${i} ===`);
                    console.log(`Row ${i} full data:`, JSON.stringify(row));
                }

                let businessName = '';
                let amount = 0;
                let cardNumber = '';
                let billingDate = '';

                if (needsSplitting && row[0]) {
                    // Split the single column by tabs
                    const rowData = String(row[0]);
                    const parts = rowData.split('\t').map(p => p.trim()).filter(p => p);

                    console.log(`Row ${i} split into ${parts.length} parts:`, parts);

                    // Based on Excel structure (right to left in Hebrew):
                    // parts[0] = row number
                    // parts[1] = business name (שם בית עסק)
                    // parts[2] = transaction date (תאריך עסקה)
                    // parts[3] = charge amount (סכום חיוב) - THE PRICE!
                    // parts[4] = credit amount (סכום זיכוי)
                    // parts[5] = balance (יתרה)
                    // parts[6] = card (כרטיס)
                    // parts[7] = billing date (מועד חיוב)

                    if (parts.length >= 2) businessName = parts[1];
                    if (parts.length >= 4) {
                        const amountStr = parts[3].replace(/[₪$€£,\s]/g, '').replace(/[^\d.-]/g, '');
                        amount = parseFloat(amountStr);
                        if (isNaN(amount)) amount = 0;
                    }
                    if (parts.length >= 7) cardNumber = parts[6];
                    if (parts.length >= 8) {
                        const rawDate = parts[7];
                        if (typeof rawDate === 'number' || !isNaN(parseFloat(rawDate))) {
                            // Excel serial date
                            const dateNum = parseFloat(rawDate);
                            const excelEpoch = new Date(1899, 11, 30);
                            const date = new Date(excelEpoch.getTime() + dateNum * 86400000);
                            billingDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear() % 100}`;
                        } else {
                            billingDate = rawDate;
                        }
                    }
                } else {
                    // Original multi-column logic
                    // SMART COLUMN DETECTION - Find columns by header names
                    const headerRow = jsonData[0];
                    let businessNameCol = -1;
                    let amountCol = -1;
                    let cardCol = -1;
                    let dateCol = -1;

                    // Search for column headers (case-insensitive, partial match)
                    for (let j = 0; j < headerRow.length; j++) {
                        const header = String(headerRow[j]).toLowerCase().trim();

                        if (header.includes('שם') && header.includes('עסק')) {
                            businessNameCol = j;
                            console.log(`✓ Found business name column at index ${j}`);
                        } else if (header.includes('סכום') && header.includes('חיוב')) {
                            amountCol = j;
                            console.log(`✓ Found amount column at index ${j}`);
                        } else if (header.includes('כרטיס')) {
                            cardCol = j;
                            console.log(`✓ Found card column at index ${j}`);
                        } else if (header.includes('מועד') && header.includes('חיוב')) {
                            dateCol = j;
                            console.log(`✓ Found date column at index ${j}`);
                        }
                    }

                    // Fallback to correct column indices based on actual Excel structure
                    if (businessNameCol === -1) {
                        businessNameCol = 1;
                        console.log(`⚠️ Business name column not found in headers, using index ${businessNameCol}`);
                    }
                    if (amountCol === -1) {
                        amountCol = 2;  // FIXED: Price is in column C (index 2)
                        console.log(`⚠️ Amount column not found in headers, using index ${amountCol}`);
                    }
                    if (cardCol === -1) {
                        cardCol = 3;  // FIXED: Card is in column D (index 3) - format: "יתרה 6353"
                        console.log(`⚠️ Card column not found in headers, using index ${cardCol}`);
                    }
                    if (dateCol === -1) {
                        dateCol = 4;  // FIXED: Billing date is in column E (index 4)
                        console.log(`⚠️ Date column not found in headers, using index ${dateCol}`);
                    }

                    // Use detected column indices
                    businessName = row[businessNameCol] ? String(row[businessNameCol]).trim() : '';

                    // Try to parse amount
                    const rawAmount = row[amountCol];

                    if (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') {
                        if (typeof rawAmount === 'number') {
                            amount = rawAmount;
                        } else {
                            // Handle string format
                            let amountStr = String(rawAmount);
                            // Remove currency symbols (₪, $, etc), commas, spaces
                            amountStr = amountStr.replace(/[₪$€£,\s]/g, '');
                            // Keep only digits, dots, and minus signs
                            amountStr = amountStr.replace(/[^\d.-]/g, '');
                            amount = parseFloat(amountStr);
                        }

                        if (isNaN(amount) || !isFinite(amount)) {
                            amount = 0;
                        }
                    }

                    // Column 3 contains card with balance (e.g., "יתרה 6353")
                    // Extract only the card number (digits after "יתרה")
                    const cardData = row[cardCol] ? String(row[cardCol]).trim() : '';
                    const cardMatch = cardData.match(/(\d{4})/);
                    cardNumber = cardMatch ? cardMatch[1] : '';

                    // Handle date - convert Excel serial number to readable format
                    const rawDate = row[dateCol];
                    if (rawDate !== undefined && rawDate !== null && rawDate !== '') {
                        if (typeof rawDate === 'number') {
                            // Excel serial date - convert to readable format
                            const excelEpoch = new Date(1899, 11, 30);
                            const date = new Date(excelEpoch.getTime() + rawDate * 86400000);
                            billingDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear() % 100}`;
                        } else {
                            billingDate = String(rawDate).trim();
                        }
                    }

                    // Debug log for first few rows
                    if (i <= 3) {
                        console.log(`Row ${i} parsed: business="${businessName}", amount=${amount}, card="${cardNumber}", date="${billingDate}"`);
                        console.log(`  → Read from columns: businessNameCol=${businessNameCol}, amountCol=${amountCol}, cardCol=${cardCol}, dateCol=${dateCol}`);
                        console.log(`  → Raw values: row[${businessNameCol}]="${row[businessNameCol]}", row[${amountCol}]="${row[amountCol]}", row[${cardCol}]="${row[cardCol]}", row[${dateCol}]="${row[dateCol]}"`);
                    }
                }



                // Skip rows with no business name
                if (!businessName) {
                    console.log(`Skipping row ${i}: no business name`);
                    continue;
                }

                // Format product name: [Business Name] ([Date]) כרטיס [Card]
                let productName = businessName;

                if (billingDate) {
                    productName += ` (${billingDate})`;
                }

                if (cardNumber) {
                    // Extract last 4 digits if card number is longer
                    const cardDigits = cardNumber.replace(/\D/g, '').slice(-4);
                    if (cardDigits) {
                        productName += ` כרטיס ${cardDigits}`;
                    }
                }

                // Create product object
                const product = {
                    name: productName,
                    price: amount,
                    qty: 1,  // Changed from 'quantity' to 'qty' to match app structure
                    checked: false,
                    category: detectCategory(businessName),
                    note: '',
                    cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };

                products.push(product);
                console.log(`✅ Created product: ${productName}, price: ${amount}`);
            }

            // Check if any products were found
            if (products.length === 0) {
                showNotification('❌ לא נמצאו מוצרים בקובץ האקסל');
                event.target.value = '';
                return;
            }

            console.log(`📦 Total products created: ${products.length}`);

            // Create new list name from Excel filename (remove extension)
            const listName = file.name.replace(/\.(xlsx|xls)$/i, '');

            // Generate unique list ID
            const existingIds = Object.keys(db.lists).map(id => {
                const match = id.match(/^L(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            });
            const nextId = Math.max(...existingIds, 0) + 1;
            const newListId = `L${nextId}`;

            // Create new list
            db.lists[newListId] = {
                name: listName,
                url: '',
                budget: 0,
                isTemplate: false,
                items: products
            };

            // Switch to the new list
            db.currentId = newListId;

            // Save to database and Firebase
            save();

            // Show success notification
            showNotification(`✅ נוצרה רשימה "${listName}" עם ${products.length} מוצרים!`);

            // Reset file input
            event.target.value = '';

        } catch (error) {
            console.error('Error parsing Excel file:', error);
            showNotification('❌ שגיאה בקריאת קובץ האקסל. אנא ודא שהקובץ תקין.');
            event.target.value = '';
        }
    };

    reader.onerror = function () {
        showNotification('❌ שגיאה בקריאת הקובץ');
        event.target.value = '';
    };

    reader.readAsArrayBuffer(file);
}

// ========== Initialize Category Dropdown on Load ==========
// Make sure custom categories are loaded into dropdown when page loads
if (typeof updateCategoryDropdown === 'function') {
    updateCategoryDropdown();
}

// ========== Peace of Mind Features ==========

// Check for urgent payments on page load and display alerts
// flag: כשמגיעים מלחיצה על התראה, נציג גם פריטים שסומנו כ-dismissed
let _forceShowAfterNotificationClick = false;

function checkUrgentPayments() {
    const now = Date.now();
    const alertItems = [];

    // בדוק אם הגענו מלחיצה על התראה (דרך flag או sessionStorage)
    let forceShow = _forceShowAfterNotificationClick;
    _forceShowAfterNotificationClick = false;

    // קרא גם מ-sessionStorage (מקרה של פתיחת חלון חדש מהתראה)
    let pendingNotifItemName = window._notifClickItemName || null;
    window._notifClickItemName = null;

    try {
        const pending = sessionStorage.getItem('vplus_pending_notif');
        if (pending) {
            sessionStorage.removeItem('vplus_pending_notif');
            const notifData = JSON.parse(pending);
            forceShow = true;
            if (notifData.itemName) pendingNotifItemName = notifData.itemName;
        }
    } catch(e) {}

    Object.keys(db.lists).forEach(listId => {
        const list = db.lists[listId];
        list.items.forEach((item, idx) => {
            if (item.checked || item.isPaid) return;
            if (!item.dueDate) return;

            // Get the scheduled alert time
            let alertTime = item.nextAlertTime;
            if (!alertTime && item.reminderValue && item.reminderUnit) {
                alertTime = computeNextAlertTime(item);
                item.nextAlertTime = alertTime; // sync it
            }
            if (!alertTime) return;

            // אם הגענו מלחיצה על התראה ספציפית — הצג רק אותה (אם ידועה), אחרת הצג כל שעבר זמנו
            if (pendingNotifItemName) {
                // הצג רק הפריט שנלחץ עליו — ללא תלות בזמן
                if (item.name === pendingNotifItemName) {
                    alertItems.push({ item, idx, listId });
                }
                return;
            }

            if (now < alertTime) return; // not yet

            // Skip if user dismissed this alert — אלא אם כן הגענו מלחיצה על התראה
            if (!forceShow && item.alertDismissedAt && item.alertDismissedAt >= alertTime) return;

            alertItems.push({ item, idx, listId });
        });
    });

    updateNotificationBadge();

    if (alertItems.length > 0) {
        showUrgentAlertModal(alertItems.map(a => a.item));
    }
}

// Update app badge with overdue count
function updateAppBadge(count) {
    if ('setAppBadge' in navigator) {
        if (count > 0) {
            navigator.setAppBadge(count).catch(err => {
                console.log('App badge not supported:', err);
            });
        } else {
            navigator.clearAppBadge().catch(err => {
                console.log('App badge not supported:', err);
            });
        }
    }
}

// Legacy - snooze is now per-item via nextAlertTime
function checkSnoozeStatus() { return true; }

// Show the urgent alert modal with overdue items
function showUrgentAlertModal(urgentItems) {
    const modal = document.getElementById('urgentAlertModal');
    const itemsList = document.getElementById('urgentItemsList');

    if (!modal || !itemsList) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build items HTML - separate overdue and upcoming
    const overdueItemsFiltered = urgentItems.filter(item => {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    });
    
    const upcomingItemsFiltered = urgentItems.filter(item => {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
    });
    
    let itemsHTML = '';
    
    // הצגת פריטים באיחור
    if (overdueItemsFiltered.length > 0) {
        itemsHTML += '<div style="font-weight: bold; color: #ef4444; margin-bottom: 10px;">⚠️ באיחור:</div>';
        overdueItemsFiltered.forEach(item => {
            const formattedDate = formatDate(item.dueDate);
            const escapedName = (item.name || '').replace(/'/g, "\\'");
            itemsHTML += `
                <div class="urgent-item" style="border-right: 3px solid #ef4444; cursor:pointer;" onclick="goToItemFromAlert('${escapedName}')">
                    <div class="urgent-item-name">${item.name}</div>
                    <div class="urgent-item-date">📅 תאריך יעד: ${formattedDate}</div>
                    <div style="font-size:0.72rem; color:#7367f0; margin-top:4px;">לחץ לצפייה במוצר ←</div>
                </div>
            `;
        });
    }
    
    // הצגת תזכורות עתידיות
    if (upcomingItemsFiltered.length > 0) {
        if (overdueItemsFiltered.length > 0) {
            itemsHTML += '<div style="margin-top: 15px;"></div>';
        }
        itemsHTML += '<div style="font-weight: bold; color: #3b82f6; margin-bottom: 10px;">🔔 תזכורות:</div>';
        upcomingItemsFiltered.forEach(item => {
            const formattedDate = formatDate(item.dueDate);
            const dueDate = new Date(item.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.floor((dueDate - today) / 86400000);
            const daysText = daysUntil === 0 ? 'היום' : daysUntil === 1 ? 'מחר' : `בעוד ${daysUntil} ימים`;
            
            let reminderText = '';
            if (item.reminderValue && item.reminderUnit) {
                reminderText = ` (התראה: ${formatReminderText(item.reminderValue, item.reminderUnit)} לפני)`;
            }
            
            const escapedName = (item.name || '').replace(/'/g, "\\'");
            itemsHTML += `
                <div class="urgent-item" style="border-right: 3px solid #3b82f6; cursor:pointer;" onclick="goToItemFromAlert('${escapedName}')">
                    <div class="urgent-item-name">${item.name}</div>
                    <div class="urgent-item-date">📅 תאריך יעד: ${formattedDate} (${daysText})${reminderText}</div>
                    <div style="font-size:0.72rem; color:#7367f0; margin-top:4px;">לחץ לצפייה במוצר ←</div>
                </div>
            `;
        });
    }

    itemsList.innerHTML = itemsHTML;
    modal.classList.add('active');
}

// Snooze all currently-alerting items
function snoozeUrgentAlert(ms) {
    const now = Date.now();
    const snoozeUntil = now + ms;
    let snoozedAny = false;

    Object.keys(db.lists).forEach(listId => {
        db.lists[listId].items.forEach(item => {
            if (item.checked || item.isPaid) return;
            if (!item.dueDate) return;

            const alertTime = item.nextAlertTime || computeNextAlertTime(item);
            if (!alertTime) return;
            // snooze פריטים שהתראה שלהם הגיעה (עבר זמנם) — כולל כאלה שסומנו כ-dismissed
            // המשתמש לחץ בכוונה על snooze, אז זה override
            if (now < alertTime) return;

            item.nextAlertTime = snoozeUntil;
            item.alertDismissedAt = null; // נקה dismiss כדי שיופיע שוב
            snoozedAny = true;
        });
    });

    if (!snoozedAny) {
        // fallback: snooze את כל הפריטים עם dueDate (גם אם alertDismissedAt קיים)
        Object.keys(db.lists).forEach(listId => {
            db.lists[listId].items.forEach(item => {
                if (item.checked || item.isPaid) return;
                if (!item.dueDate || !item.reminderValue) return;
                item.nextAlertTime = snoozeUntil;
                item.alertDismissedAt = null;
            });
        });
    }

    save();
    closeModal('urgentAlertModal');
    showNotification('⏰ תוזכר שוב בקרוב');
    // Re-schedule timers so the snoozed time is picked up
    checkAndScheduleNotifications();
}

// Close/dismiss urgent alert — mark as dismissed so it won't auto-popup again
function closeUrgentAlert() {
    const now = Date.now();
    Object.keys(db.lists).forEach(listId => {
        db.lists[listId].items.forEach(item => {
            if (item.checked || item.isPaid) return;
            if (!item.dueDate) return;

            const alertTime = item.nextAlertTime || computeNextAlertTime(item);
            if (!alertTime) return;
            if (now < alertTime) return;
            if (item.alertDismissedAt && item.alertDismissedAt >= alertTime) return;

            item.alertDismissedAt = now; // mark dismissed — stays in notification center
        });
    });
    save();
    closeModal('urgentAlertModal');
}

// Navigate to the specific item from the notification alert
function goToItemFromAlert(itemName) {
    closeModal('urgentAlertModal');

    // חפש את הפריט בכל הרשימות
    let foundListId = null;
    let foundItemIdx = null;

    Object.keys(db.lists).forEach(listId => {
        db.lists[listId].items.forEach((item, idx) => {
            if (item.name === itemName && !item.checked && !item.isPaid) {
                if (!foundListId) {
                    foundListId = listId;
                    foundItemIdx = idx;
                }
            }
        });
    });

    if (foundListId) {
        // עבור לרשימה הנכונה
        if (db.currentId !== foundListId) {
            db.currentId = foundListId;
            save();
            render();
        }

        // גלול לפריט והדגש אותו
        setTimeout(() => {
            const cards = document.querySelectorAll('.item-card');
            // מצא לפי אינדקס בתצוגה (לאחר render)
            const currentItems = db.lists[foundListId].items;
            // סינון לפי תצוגה נוכחית (כולל unchecked)
            let visibleIdx = 0;
            let targetCard = null;
            currentItems.forEach((item, i) => {
                if (i === foundItemIdx) {
                    targetCard = cards[visibleIdx];
                }
                if (!item.checked) visibleIdx++;
            });

            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetCard.style.transition = 'box-shadow 0.3s, transform 0.3s';
                targetCard.style.boxShadow = '0 0 0 3px #7367f0, 0 8px 30px rgba(115,103,240,0.3)';
                targetCard.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    targetCard.style.boxShadow = '';
                    targetCard.style.transform = '';
                }, 2000);
            }
        }, 350);
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Auto-link URLs in notes
function autoLinkNotes(text) {
    if (!text) return '';
    
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    
    return text.replace(urlPattern, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

// Toggle item paid status and update badge
function toggleItemPaid(idx) {
    const list = db.lists[db.currentId];
    if (!list || !list.items[idx]) return;

    list.items[idx].isPaid = !list.items[idx].isPaid;
    
    // Also mark as checked when paid
    if (list.items[idx].isPaid) {
        list.items[idx].checked = true;
    }

    save();
    checkUrgentPayments();
}

// Open inline editor for due date
function editDueDate(idx) {
    currentEditItemIndex = idx;
    currentEditField = 'dueDate';
    
    const list = db.lists[db.currentId];
    const item = list.items[idx];
    
    // Create inline date input
    const dateDisplay = document.querySelector(`[data-duedate-idx="${idx}"]`);
    if (!dateDisplay) return;
    
    const currentValue = item.dueDate || '';
    const input = document.createElement('input');
    input.type = 'date';
    input.value = currentValue;
    input.className = 'modal-input';
    input.style.display = 'inline-block';
    input.style.width = 'auto';
    input.style.padding = '4px 8px';
    input.style.fontSize = '0.85em';
    
    input.onchange = function() {
        list.items[idx].dueDate = input.value;
        save();
        checkUrgentPayments();
    };
    
    input.onblur = function() {
        setTimeout(() => {
            if (input.parentNode) {
                input.remove();
            }
        }, 200);
    };
    
    dateDisplay.parentNode.insertBefore(input, dateDisplay);
    dateDisplay.style.display = 'none';
    input.focus();
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

// Open inline editor for notes
function editNotes(idx) {
    currentEditItemIndex = idx;
    currentEditField = 'notes';
    
    const list = db.lists[db.currentId];
    const item = list.items[idx];
    
    // Create inline text input
    const notesDisplay = document.querySelector(`[data-notes-idx="${idx}"]`);
    if (!notesDisplay) return;
    
    const currentValue = item.note || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'modal-input';
    input.style.display = 'inline-block';
    input.style.width = '100%';
    input.style.padding = '4px 8px';
    input.style.fontSize = '0.85em';
    
    input.onchange = function() {
        list.items[idx].note = input.value;
        save();
    };
    
    input.onblur = function() {
        setTimeout(() => {
            if (input.parentNode) {
                input.remove();
            }
        }, 200);
    };
    
    notesDisplay.parentNode.insertBefore(input, notesDisplay);
    notesDisplay.style.display = 'none';
    input.focus();
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

// Initialize Peace of Mind features on page load
document.addEventListener('DOMContentLoaded', function() {
    // טען GitHub Token
    if (typeof loadGithubToken === 'function') loadGithubToken();
    updateGithubTokenStatus();
    setTimeout(() => { checkUrgentPayments(); }, 1000);
    checkFirstRunDemo();
});

// Override the original render function to include Peace of Mind display elements
const originalRender = window.render || function() {};

// We'll need to modify the render function, but since it's complex,
// let's add a helper to enhance item rendering
function enhanceItemHTML(item, idx, originalHTML) {
    let enhanced = originalHTML;
    
    // Add due date display if exists
    if (item.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const isOverdue = dueDate < today && !item.isPaid && !item.checked;
        const dueDateClass = isOverdue ? 'item-duedate-display overdue' : 'item-duedate-display';
        
        const dueDateHTML = `
            <div class="${dueDateClass}" data-duedate-idx="${idx}" onclick="editDueDate(${idx})">
                📅 ${formatDate(item.dueDate)}${isOverdue ? ' (פג תוקף!)' : ''}
            </div>
        `;
        
        // Insert after category badge
        const categoryPos = enhanced.lastIndexOf('</div>', enhanced.indexOf('item-number'));
        if (categoryPos > -1) {
            enhanced = enhanced.slice(0, categoryPos) + dueDateHTML + enhanced.slice(categoryPos);
        }
    }
    
    // Add notes display if exists
    if (item.note) {
        const linkedNotes = autoLinkNotes(item.note);
        const notesHTML = `
            <div class="item-notes-display" data-notes-idx="${idx}" onclick="editNotes(${idx})">
                📝 ${linkedNotes}
            </div>
        `;
        
        // Insert after category badge or due date
        const insertPos = enhanced.lastIndexOf('</div>', enhanced.indexOf('flex justify-between items-center mb-4'));
        if (insertPos > -1) {
            enhanced = enhanced.slice(0, insertPos) + notesHTML + enhanced.slice(insertPos);
        }
    }
    
    return enhanced;
}

// ========== Notification Center Functions ==========
// ── dismissed notifications stored in localStorage ────────────────
function getDismissedNotifications() {
    try { return JSON.parse(localStorage.getItem('vplus_dismissed_notifs') || '[]'); }
    catch(e) { return []; }
}
function saveDismissedNotifications(arr) {
    localStorage.setItem('vplus_dismissed_notifs', JSON.stringify(arr));
}
function makeNotifKey(listId, itemIdx, dueDateMs) {
    return `${listId}__${itemIdx}__${dueDateMs}`;
}

function getNotificationItems() {
    const notificationItems = [];
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dismissed = getDismissedNotifications();
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    Object.keys(db.lists).forEach(listId => {
        const list = db.lists[listId];
        list.items.forEach((item, idx) => {
            if (item.dueDate && !item.checked && !item.isPaid) {
                const dueDate = new Date(item.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                
                let reminderTimeMs = 0;
                if (item.reminderValue && item.reminderUnit) {
                    reminderTimeMs = getReminderMilliseconds(item.reminderValue, item.reminderUnit);
                }
                
                const dueDateMs = dueDate.getTime();
                const reminderDate = new Date(dueDateMs - reminderTimeMs);
                
                const isOverdue = dueDate < today;
                const isReminderTime = reminderTimeMs > 0 && now >= reminderDate.getTime() && now <= dueDateMs + (24 * 60 * 60 * 1000);
                const shouldNotify = isOverdue || isReminderTime;

                // בדוק אם נמחקה ידנית ממרכז ההתראות
                const notifKey = makeNotifKey(listId, idx, dueDateMs);
                if (dismissed.includes(notifKey)) return;
                
                // הצג במרכז התראות רק אם יש התראה מוגדרת
                const hasReminder = !!(item.reminderValue && item.reminderUnit) || !!(item.nextAlertTime && item.nextAlertTime > 0);
                if (!hasReminder) return;

                // הצג את הפריט — יש התראה (לא משנה אם הגיע הזמן עדיין)
                {
                    const isToday = dueDate.getTime() === today.getTime();
                    const isTomorrow = dueDate.getTime() === new Date(today.getTime() + 86400000).getTime();
                    
                    let urgency = 0;
                    if (isOverdue) urgency = 3;
                    else if (isToday) urgency = 2;
                    else if (isTomorrow) urgency = 1;
                    else urgency = 0;
                    
                    notificationItems.push({
                        item,
                        itemIdx: idx,
                        listId,
                        listName: list.name,
                        dueDate,
                        dueDateMs,
                        urgency,
                        isOverdue,
                        isToday,
                        isTomorrow,
                        isUpcoming: !isOverdue && isReminderTime,
                        reminderValue: item.reminderValue,
                        reminderUnit: item.reminderUnit
                    });
                }
            }
        });
    });
    
    notificationItems.sort((a, b) => {
        if (b.urgency !== a.urgency) return b.urgency - a.urgency;
        return a.dueDate - b.dueDate;
    });
    
    return notificationItems;
}

function updateNotificationBadge() {
    const notificationItems = getNotificationItems();
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const count = notificationItems.length;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function dismissNotification(listId, itemIdx, dueDateMs, e) {
    if (e) e.stopPropagation();
    const key = makeNotifKey(listId, itemIdx, dueDateMs);
    const dismissed = getDismissedNotifications();
    if (!dismissed.includes(key)) dismissed.push(key);
    saveDismissedNotifications(dismissed);
    updateNotificationBadge();
    // רענן badge ו-clear-all בלבד, ללא re-render מלא (ה-swipe עצמו מוריד את הקלף)
    const items = getNotificationItems();
    const btn = document.getElementById('clearAllNotifsBtn');
    if (btn) btn.style.display = items.length > 0 ? 'flex' : 'none';
    const hint = document.getElementById('ncSwipeHint');
    if (hint) hint.style.display = items.length > 0 ? 'block' : 'none';
    if (items.length === 0) {
        const container = document.getElementById('notificationsList');
        if (container) container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
                <div style="color:#7367f0;font-weight:700;font-size:1rem;">אין התראות כרגע</div>
                <div style="color:#c4b5fd;font-size:0.82rem;margin-top:6px;">הכל תחת שליטה!</div>
            </div>`;
    }
}

function dismissAllNotifications() {
    const items = getNotificationItems();
    const dismissed = getDismissedNotifications();
    items.forEach(n => {
        const key = makeNotifKey(n.listId, n.itemIdx, n.dueDateMs);
        if (!dismissed.includes(key)) dismissed.push(key);
    });
    saveDismissedNotifications(dismissed);
    updateNotificationBadge();
    openNotificationCenter(); // רענן
}

function openNotificationCenter() {
    // If a wizard card is open, forcibly close it before opening notification center
    if (typeof _wizForceClose === 'function') _wizForceClose();

    const notificationItems = getNotificationItems();
    const container   = document.getElementById('notificationsList');
    const clearAllBtn = document.getElementById('clearAllNotifsBtn');
    const swipeHint   = document.getElementById('ncSwipeHint');

    // Show/hide clear-all button
    if (clearAllBtn) clearAllBtn.style.display = notificationItems.length > 0 ? 'flex' : 'none';

    if (notificationItems.length === 0) {
        if (swipeHint) swipeHint.style.display = 'none';
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
                <div style="color:#7367f0;font-weight:700;font-size:1rem;">אין התראות כרגע</div>
                <div style="color:#c4b5fd;font-size:0.82rem;margin-top:6px;">הכל תחת שליטה!</div>
            </div>`;
    } else {
        if (swipeHint) swipeHint.style.display = 'block';
        container.innerHTML = '';

        notificationItems.forEach(notif => {
            // Wrapper for swipe
            const wrap = document.createElement('div');
            wrap.className = 'nc-card-wrap';

            // Background layers (left & right swipe)
            wrap.innerHTML = `
                <div class="nc-swipe-bg left-swipe">🗑️ מחק</div>
                <div class="nc-swipe-bg right-swipe">🗑️ מחק</div>
            `;

            // Card
            let notifClass = 'soon';
            if (notif.isOverdue) notifClass = 'overdue';
            else if (notif.isUpcoming && !notif.isToday) notifClass = 'upcoming';

            let dateText = '';
            if (notif.isOverdue) {
                const d = Math.floor((new Date().setHours(0,0,0,0) - notif.dueDate) / 86400000);
                dateText = `⚠️ איחור ${d} ${d === 1 ? 'יום' : 'ימים'}`;
            } else if (notif.isToday) {
                dateText = '📅 היום!';
            } else if (notif.isTomorrow) {
                dateText = '📅 מחר';
            } else {
                const d = Math.floor((notif.dueDate - new Date().setHours(0,0,0,0)) / 86400000);
                if (notif.isUpcoming && notif.reminderValue && notif.reminderUnit) {
                    dateText = `🔔 תזכורת ${formatReminderText(notif.reminderValue, notif.reminderUnit)} לפני — בעוד ${d} ${d === 1 ? 'יום' : 'ימים'}`;
                } else {
                    dateText = `📅 בעוד ${d} ${d === 1 ? 'יום' : 'ימים'}`;
                }
            }

            const card = document.createElement('div');
            card.className = `notification-item ${notifClass}`;
            card.innerHTML = `
                <div class="notification-item-title">${notif.item.name}</div>
                <div class="notification-item-date">${dateText}</div>
                <div class="notification-item-list">📋 ${notif.listName}</div>
            `;
            card.addEventListener('click', () => jumpToItem(notif.listId, notif.itemIdx));

            wrap.appendChild(card);
            container.appendChild(wrap);

            // ── Swipe to dismiss ──
            attachSwipeDismiss(wrap, card, notif);
        });
    }

    openModal('notificationCenterModal');
}

function attachSwipeDismiss(wrap, card, notif) {
    const THRESHOLD      = 90;   // px to trigger dismiss
    const DIR_LOCK_PX    = 8;    // px moved before direction is locked
    const HORIZ_RATIO    = 1.8;  // horizontal must be this times larger than vertical

    let startX = 0, startY = 0;
    let currentX = 0;
    let dragging = false;       // touch has started
    let dirLocked = false;      // direction (horiz/vert) has been decided
    let isHoriz = false;        // locked as horizontal swipe

    const leftBg  = wrap.querySelector('.left-swipe');
    const rightBg = wrap.querySelector('.right-swipe');

    function reset() {
        dragging  = false;
        dirLocked = false;
        isHoriz   = false;
        currentX  = 0;
    }

    function snapBack() {
        card.style.transition = 'transform 0.22s cubic-bezier(0.34,1.4,0.64,1)';
        card.style.transform  = 'translateX(0)';
        if (leftBg)  { leftBg.style.opacity  = '0'; leftBg.classList.remove('reveal');  }
        if (rightBg) { rightBg.style.opacity = '0'; rightBg.classList.remove('reveal'); }
    }

    function onTouchStart(e) {
        startX   = e.touches[0].clientX;
        startY   = e.touches[0].clientY;
        currentX = 0;
        dragging  = true;
        dirLocked = false;
        isHoriz   = false;
        card.style.transition = 'none';
    }

    function onTouchMove(e) {
        if (!dragging) return;

        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Wait until we have enough movement to decide direction
        if (!dirLocked && (absDx > DIR_LOCK_PX || absDy > DIR_LOCK_PX)) {
            dirLocked = true;
            isHoriz   = absDx > absDy * HORIZ_RATIO;
        }

        if (!dirLocked || !isHoriz) return; // vertical scroll — don't touch the card

        // Horizontal swipe confirmed
        currentX = dx;
        card.style.transform = `translateX(${currentX}px)`;

        const ratio = Math.min(absDx / THRESHOLD, 1);
        if (currentX < 0) {
            if (leftBg)  { leftBg.classList.add('reveal');    leftBg.style.opacity  = ratio; }
            if (rightBg) { rightBg.classList.remove('reveal'); rightBg.style.opacity = 0; }
        } else {
            if (rightBg) { rightBg.classList.add('reveal');   rightBg.style.opacity = ratio; }
            if (leftBg)  { leftBg.classList.remove('reveal'); leftBg.style.opacity  = 0; }
        }
    }

    function onTouchEnd() {
        if (!dragging) return;
        const wasHoriz = isHoriz;
        const savedX   = currentX;
        reset();

        if (!wasHoriz) return; // was a scroll — nothing to do

        if (Math.abs(savedX) >= THRESHOLD) {
            // Dismiss
            const dir = savedX < 0 ? -1 : 1;
            card.style.transition = 'transform 0.26s ease, opacity 0.26s ease';
            card.style.transform  = `translateX(${dir * window.innerWidth}px)`;
            card.style.opacity    = '0';
            wrap.style.transition = 'max-height 0.3s ease 0.2s, margin-bottom 0.3s ease 0.2s, opacity 0.3s ease 0.2s';
            wrap.style.overflow   = 'hidden';
            setTimeout(() => {
                wrap.style.maxHeight    = '0';
                wrap.style.marginBottom = '0';
                wrap.style.opacity      = '0';
            }, 50);
            setTimeout(() => {
                dismissNotification(notif.listId, notif.itemIdx, notif.dueDateMs, null);
            }, 380);
        } else {
            snapBack();
        }
    }

    // Touch events — touchmove is NOT passive so we keep native scroll for vertical
    card.addEventListener('touchstart',  onTouchStart,  { passive: true });
    card.addEventListener('touchmove',   onTouchMove,   { passive: true });
    card.addEventListener('touchend',    onTouchEnd,    { passive: true });
    card.addEventListener('touchcancel', onTouchEnd,    { passive: true });

    // Mouse (desktop)
    card.addEventListener('mousedown', e => {
        startX = e.clientX; startY = e.clientY;
        currentX = 0; dragging = true; dirLocked = false; isHoriz = false;
        card.style.transition = 'none';
        e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!dirLocked && (Math.abs(dx) > DIR_LOCK_PX || Math.abs(dy) > DIR_LOCK_PX)) {
            dirLocked = true;
            isHoriz   = Math.abs(dx) > Math.abs(dy) * HORIZ_RATIO;
        }
        if (!isHoriz) return;
        currentX = dx;
        card.style.transform = `translateX(${currentX}px)`;
        const ratio = Math.min(Math.abs(dx) / THRESHOLD, 1);
        if (dx < 0) {
            if (leftBg)  { leftBg.classList.add('reveal');    leftBg.style.opacity = ratio; }
            if (rightBg) { rightBg.classList.remove('reveal'); rightBg.style.opacity = 0; }
        } else {
            if (rightBg) { rightBg.classList.add('reveal');   rightBg.style.opacity = ratio; }
            if (leftBg)  { leftBg.classList.remove('reveal'); leftBg.style.opacity = 0; }
        }
    });
    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        onTouchEnd();
    });
}

function jumpToItem(listId, itemIdx) {
    closeModal('notificationCenterModal');
    db.currentId = listId;
    activePage = 'lists';
    
    setTimeout(() => {
        render();
        
        const itemCard = document.querySelector(`[data-id="${itemIdx}"]`);
        if (itemCard) {
            itemCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            itemCard.classList.add('highlight-item');
            
            setTimeout(() => {
                itemCard.classList.remove('highlight-item');
            }, 2000);
        }
    }, 100);
}

// ========== Auto-link notes utility ==========
function autoLinkNotes(noteText) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return noteText.replace(urlRegex, '<a href="$1" target="_blank" style="color: #7367f0; text-decoration: underline;">קישור</a>');
}

function toggleVoiceInput() {
    const input = document.getElementById('newItemInput');
    if (!input) return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('הדפדפן לא תומך בזיהוי קולי', 'error');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    
    const voiceIcon = document.getElementById('voiceIcon');
    voiceIcon.textContent = '⏺️';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        voiceIcon.textContent = '🎤';
        showNotification('✅ זוהה: ' + transcript);
    };
    
    recognition.onerror = () => {
        voiceIcon.textContent = '🎤';
        showNotification('שגיאה בזיהוי קולי', 'error');
    };
    
    recognition.onend = () => {
        voiceIcon.textContent = '🎤';
    };
    
    try {
        recognition.start();
        showNotification('🎤 מאזין...');
    } catch (error) {
        voiceIcon.textContent = '🎤';
        showNotification('שגיאה בהפעלת המיקרופון', 'error');
    }
}

function addItem() {
    const input = document.getElementById('newItemInput');
    const name = input.value.trim();
    
    if (name) {
        const category = detectCategory(name);
        db.lists[db.currentId].items.push({
            name: name,
            price: 0,
            qty: 1,
            checked: false,
            category: category,
            note: '',
            dueDate: '',
            paymentUrl: '',
            isPaid: false,
            lastUpdated: Date.now(),
            cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });
        
        input.value = '';
        save();
        showNotification('✅ ' + name + ' נוסף!');
    }
}

function createNewList() {
    const name = prompt('שם הרשימה החדשה:');
    if (name && name.trim()) {
        const id = 'L' + Date.now();
        db.lists[id] = {
            name: name.trim(),
            url: '',
            budget: 0,
            isTemplate: false,
            items: []
        };
        db.currentId = id;
        
        // Check if there's pending import text
        if (pendingImportText && detectedListType) {
            importTextToList(id, pendingImportText, detectedListType);
        } else {
            save();
            render();
            showNotification('✅ רשימה חדשה נוצרה!');
        }
    }
}

// Select existing list and import pending text if exists
function selectListAndImport(listId) {
    db.currentId = listId;
    
    // Check if there's pending import text
    if (pendingImportText && detectedListType) {
        importTextToList(listId, pendingImportText, detectedListType);
    } else {
        render();
    }
}

function clearChecked() {
    if (confirm('למחוק את כל הפריטים המסומנים?')) {
        db.lists[db.currentId].items = db.lists[db.currentId].items.filter(item => !item.checked);
        save();
        showNotification('🗑️ פריטים מסומנים נמחקו');
    }
}

function switchTab(tab) {
    const shoppingTab = document.getElementById('shoppingTab');
    const analysisTab = document.getElementById('analysisTab');
    const tabs = document.querySelectorAll('.tab-btn');
    
    if (tab === 'shopping') {
        shoppingTab.style.display = 'block';
        analysisTab.style.display = 'none';
        tabs[0].classList.add('tab-active');
        tabs[1].classList.remove('tab-active');
    } else {
        shoppingTab.style.display = 'none';
        analysisTab.style.display = 'block';
        tabs[0].classList.remove('tab-active');
        tabs[1].classList.add('tab-active');
        updateCategoryChart();
    }
}

function updateCategoryChart() {
    const list = db.lists[db.currentId];
    if (!list || list.items.length === 0) return;
    
    const categoryTotals = {};
    list.items.forEach(item => {
        const cat = item.category || 'אחר';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.price * item.qty);
    });
    
    const canvas = document.getElementById('categoryChart');
    const ctx = canvas.getContext('2d');
    
    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }
    
    window.categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: Object.keys(categoryTotals).map(cat => CATEGORIES[cat] || '#6b7280')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function exportToExcel() {
    showNotification('יצוא לאקסל - בפיתוח');
}

// ========== Clipboard Import Feature ==========

// Check clipboard on app open/resume
async function checkClipboardOnStartup() {
    try {
        // Check if auto-open is disabled by user
        // Auto-open is OFF by default; only open if user explicitly enabled it
        if (localStorage.getItem('clipboardAutoOpen') !== 'true') {
            console.log('Clipboard auto-open not enabled by user');
            return;
        }

        // Check if Clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            console.log('Clipboard API not available in this browser');
            return;
        }

        // Read clipboard text
        const clipboardText = await navigator.clipboard.readText();
        
        if (!clipboardText || clipboardText.trim() === '') {
            console.log('Clipboard is empty');
            return;
        }

        console.log('✅ Clipboard text found, length:', clipboardText.length);

        // Get clipboard state from localStorage
        const clipboardState = JSON.parse(localStorage.getItem('clipboardState') || '{}');
        const lastText = clipboardState.lastClipboardText || '';
        const dismissed = clipboardState.clipboardDismissed || false;
        const imported = clipboardState.clipboardImported || false;

        console.log('Clipboard check - Same text?', clipboardText === lastText, 'Dismissed?', dismissed, 'Imported?', imported);

        // Check if this is new text
        if (clipboardText === lastText) {
            // Same text - check if dismissed or imported
            if (dismissed || imported) {
                console.log('Skipping - already dismissed or imported');
                return; // Don't show modal
            }
            // Same text but not dismissed/imported - show again
            console.log('Showing modal for same text (not dismissed/imported)');
        } else {
            // New text - reset state
            console.log('🆕 New clipboard text detected!');
            clipboardState.lastClipboardText = clipboardText;
            clipboardState.clipboardDismissed = false;
            clipboardState.clipboardImported = false;
            localStorage.setItem('clipboardState', JSON.stringify(clipboardState));
        }

        // Show import modal
        showClipboardImportModal(clipboardText);

    } catch (error) {
        console.log('❌ Clipboard access error:', error.name, error.message);
        // Silently fail - clipboard access not available or denied
    }
}

// ===== CLIPBOARD AUTO-OPEN TOGGLE =====
function toggleClipboardAutoOpen() {
    const toggle = document.getElementById('clipboardAutoOpenToggle');
    const label = document.getElementById('clipboardAutoOpenLabel');
    if (!toggle) return;
    const isOn = toggle.checked;
    localStorage.setItem('clipboardAutoOpen', isOn ? 'true' : 'false');
    if (label) label.textContent = isOn ? 'מופעל' : 'מושבת';
    if (label) label.style.color = isOn ? '#7367f0' : '#94a3b8';
}

// Show clipboard import modal
function showClipboardImportModal(text) {
    const modal = document.getElementById('clipboardImportModal');
    const textarea = document.getElementById('clipboardImportText');
    const detectedTypeDiv = document.getElementById('clipboardDetectedType');
    const detectedTypeName = document.getElementById('detectedTypeName');

    // Init auto-open toggle state
    const autoOpen = localStorage.getItem('clipboardAutoOpen') !== 'false';
    const toggle = document.getElementById('clipboardAutoOpenToggle');
    const label = document.getElementById('clipboardAutoOpenLabel');
    if (toggle) toggle.checked = autoOpen;
    if (label) { label.textContent = autoOpen ? 'מופעל' : 'מושבת'; label.style.color = autoOpen ? '#7367f0' : '#94a3b8'; }

    // Set the text
    textarea.value = text;
    pendingImportText = text;

    // Detect list type
    detectedListType = detectListType(text);
    
    // Show detected type
    const typeNames = {
        'shopping': '🛒 רשימת קניות',
        'appointment': '🏥 תור/פגישה',
        'tasks': '✅ רשימת משימות',
        'general': '📝 רשימה כללית'
    };
    
    detectedTypeName.textContent = typeNames[detectedListType] || '📝 רשימה כללית';
    detectedTypeDiv.style.display = 'block';

    // Show modal
    modal.style.display = 'flex';
}

// Open manual import - same as clipboard import but allows manual paste
async function openManualImport() {
    if (wizardMode) {
        wiz('pasteBtn', 'before', async () => {
            await _origOpenManualImport();
        });
        return;
    }
    await _origOpenManualImport();
}
async function _origOpenManualImport() {
    const modal = document.getElementById('clipboardImportModal');
    const textarea = document.getElementById('clipboardImportText');
    const detectedTypeDiv = document.getElementById('clipboardDetectedType');
    const detectedTypeName = document.getElementById('detectedTypeName');

    // Try to read from clipboard first
    let clipboardText = '';
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            clipboardText = await navigator.clipboard.readText();
        }
    } catch (error) {
        console.log('Could not read clipboard, user will paste manually');
    }

    // Set the text (empty if clipboard read failed)
    textarea.value = clipboardText;
    pendingImportText = clipboardText;

    // Detect list type if we have text
    if (clipboardText.trim()) {
        detectedListType = detectListType(clipboardText);
        
        const typeNames = {
            'shopping': '🛒 רשימת קניות',
            'appointment': '🏥 תור/פגישה',
            'tasks': '✅ רשימת משימות',
            'general': '📝 רשימה כללית'
        };
        
        detectedTypeName.textContent = typeNames[detectedListType] || '📝 רשימה כללית';
        detectedTypeDiv.style.display = 'block';
    } else {
        // No text yet - set default
        detectedListType = 'shopping';
        detectedTypeName.textContent = '🛒 רשימת קניות';
        detectedTypeDiv.style.display = 'block';
    }

    // Show modal
    modal.style.display = 'flex';
    
    // Focus on textarea for easy paste
    setTimeout(() => {
        textarea.focus();
    }, 100);
}

// Update detected type when user types/pastes in textarea
function updateDetectedTypeFromInput() {
    const textarea = document.getElementById('clipboardImportText');
    const detectedTypeName = document.getElementById('detectedTypeName');
    const text = textarea.value;
    
    if (text.trim()) {
        pendingImportText = text;
        detectedListType = detectListType(text);
        
        const typeNames = {
            'shopping': '🛒 רשימת קניות',
            'appointment': '🏥 תור/פגישה',
            'tasks': '✅ רשימת משימות',
            'general': '📝 רשימה כללית'
        };
        
        detectedTypeName.textContent = typeNames[detectedListType] || '📝 רשימה כללית';
    }
}

// Detect list type from text
function detectListType(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // Check for appointment indicators - IMPROVED
    const appointmentKeywords = [
        'תור', 'פגישה', 'ד"ר', 'דוקטור', 'רופא', 'מרפאה', 'בית חולים', 'קליניקה',
        'מכבידנט', 'כללית', 'מאוחדת', 'לאומית', 'פרופ', 'מומחה',
        'טיפול', 'בדיקה', 'ייעוץ', 'ניתוח', 'צילום', 'אולטרסאונד'
    ];
    const hasAppointmentKeyword = appointmentKeywords.some(keyword => text.includes(keyword));
    
    // Check for date/time patterns
    const datePattern = /\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]?\d{0,4}/;
    const timePattern = /\d{1,2}:\d{2}|בשעה|שעה/;
    const hasDateTime = datePattern.test(text) || timePattern.test(text);
    
    // Check for phone pattern
    const phonePattern = /0\d{1,2}[\-\s]?\d{3,4}[\-\s]?\d{3,4}|טלפון|טל:|נייד/;
    const hasPhone = phonePattern.test(text);
    
    // Check for URL (common in appointments)
    const hasUrl = /https?:\/\//.test(text);
    
    // Check for address pattern
    const addressPattern = /רחוב|רח'|כתובת|מיקום|קומה|בניין/;
    const hasAddress = addressPattern.test(text);
    
    // Strong appointment indicators:
    // 1. Has appointment keyword + date/time
    // 2. Has date + time + (phone OR url OR address)
    // 3. Text is relatively short (not a shopping list)
    const strongAppointment = 
        (hasAppointmentKeyword && hasDateTime) ||
        (hasDateTime && hasPhone) ||
        (hasDateTime && hasUrl) ||
        (hasDateTime && hasAddress && lines.length <= 10);
    
    if (strongAppointment) {
        return 'appointment';
    }
    
    // Check for shopping list indicators
    const pricePattern = /\d+\s*ש"ח|₪\s*\d+|\d+\s*שקל/;
    const hasPrice = pricePattern.test(text);
    
    // Check for common shopping items
    const shoppingKeywords = ['חלב', 'לחם', 'ביצים', 'גבינה', 'יוגורט', 'עגבניות', 'מלפפון', 'בשר', 'עוף', 'דגים'];
    const shoppingItemCount = shoppingKeywords.filter(keyword => text.includes(keyword)).length;
    
    if (hasPrice || shoppingItemCount >= 2 || (lines.length >= 3 && lines.length <= 30 && !hasDateTime)) {
        return 'shopping';
    }
    
    // Check for tasks indicators
    const taskKeywords = ['משימה', 'לעשות', 'להשלים', 'לבדוק', 'לקנות', 'להתקשר'];
    const hasTaskKeyword = taskKeywords.some(keyword => text.includes(keyword));
    
    if (hasTaskKeyword && lines.length >= 2) {
        return 'tasks';
    }
    
    // Default to shopping if multiple lines without clear appointment indicators
    if (lines.length >= 3 && !hasDateTime) {
        return 'shopping';
    }
    
    // If very short text with date/time but no other indicators - probably appointment
    if (lines.length <= 3 && hasDateTime) {
        return 'appointment';
    }
    
    return 'general';
}

// Change detected type manually
function changeDetectedType() {
    const types = ['shopping', 'appointment', 'tasks', 'general'];
    const currentIndex = types.indexOf(detectedListType);
    const nextIndex = (currentIndex + 1) % types.length;
    detectedListType = types[nextIndex];
    
    const typeNames = {
        'shopping': '🛒 רשימת קניות',
        'appointment': '🏥 תור/פגישה',
        'tasks': '✅ רשימת משימות',
        'general': '📝 רשימה כללית'
    };
    
    document.getElementById('detectedTypeName').textContent = typeNames[detectedListType];
}

// Accept clipboard import
function acceptClipboardImport() {
    // Close modal
    document.getElementById('clipboardImportModal').style.display = 'none';
    
    // Mark as accepted (not imported yet, but user confirmed)
    const clipboardState = JSON.parse(localStorage.getItem('clipboardState') || '{}');
    clipboardState.clipboardImported = true;
    localStorage.setItem('clipboardState', JSON.stringify(clipboardState));
    
    // Store pending import (will be used when user selects/creates a list)
    // pendingImportText and detectedListType are already set globally
    
    showNotification('✅ בחר רשימה או צור רשימה חדשה להוספת הפריטים');
}

// Dismiss clipboard import
function dismissClipboardImport() {
    // Close modal
    document.getElementById('clipboardImportModal').style.display = 'none';
    
    // Mark as dismissed in localStorage
    const clipboardState = JSON.parse(localStorage.getItem('clipboardState') || '{}');
    clipboardState.clipboardDismissed = true;
    localStorage.setItem('clipboardState', JSON.stringify(clipboardState));
    
    // Clear pending import
    pendingImportText = null;
    detectedListType = null;
}

// Parse and import text to a list
function importTextToList(listId, text, listType) {
    if (!text || !listId) return;
    
    const list = db.lists[listId];
    if (!list) return;
    
    // Parse based on detected type
    let items = [];
    
    if (listType === 'appointment') {
        // Parse as single appointment
        items = parseAppointmentText(text);
    } else if (listType === 'shopping' || listType === 'tasks') {
        // Parse as multiple items
        items = parseShoppingListText(text);
    } else {
        // Parse as general list
        items = parseGeneralListText(text);
    }
    
    // Add items to list
    items.forEach(item => {
        list.items.push(item);
    });
    
    // Mark as imported
    const clipboardState = JSON.parse(localStorage.getItem('clipboardState') || '{}');
    clipboardState.clipboardImported = true;
    localStorage.setItem('clipboardState', JSON.stringify(clipboardState));
    
    // Clear pending import
    pendingImportText = null;
    detectedListType = null;
    
    save();
    render();
    showNotification(`✅ ${items.length} פריטים נוספו לרשימה!`);
}

// Parse appointment text
function parseAppointmentText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    
    let name = '';
    let dueDate = '';
    let dueTime = '';
    let location = '';
    let phone = '';
    let notes = '';
    let url = '';
    
    // Extract URL first (so we can remove it from text)
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urlMatch = text.match(urlPattern);
    if (urlMatch) {
        url = urlMatch[0];
    }
    
    // Extract date - improved patterns
    // Patterns: DD/MM/YY, DD/MM/YYYY, DD.MM.YY, DD-MM-YY
    const datePattern = /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
        let day = dateMatch[1].padStart(2, '0');
        let month = dateMatch[2].padStart(2, '0');
        let year = dateMatch[3];
        
        // Handle 2-digit year (26 → 2026)
        if (year.length === 2) {
            year = '20' + year;
        }
        
        dueDate = `${year}-${month}-${day}`;
    }
    
    // Extract time - IMPROVED with multiple patterns
    let timeMatch = text.match(/בשעה\s+(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
        timeMatch = text.match(/שעה\s+(\d{1,2}):(\d{2})/);
    }
    if (!timeMatch) {
        timeMatch = text.match(/\s(\d{1,2}):(\d{2})\s/);
    }
    if (!timeMatch) {
        // Try at end of line
        timeMatch = text.match(/(\d{1,2}):(\d{2})/);
    }
    if (timeMatch) {
        dueTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
    
    // Extract phone
    const phonePattern = /(0\d{1,2}[\-\s]?\d{3,4}[\-\s]?\d{3,4})/;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) {
        phone = phoneMatch[1];
    }
    
    // Extract name - IMPROVED with better patterns
    // Pattern 1: "תור ל[שם]" - extract the name after "ל"
    const namePattern1 = /תור ל(\w+)/;
    const nameMatch1 = text.match(namePattern1);
    if (nameMatch1) {
        const personName = nameMatch1[1];
        
        // Also look for clinic/location name
        const clinicPattern = /(מכבידנט|כללית|מאוחדת|לאומית)[\s\w-]*/;
        const clinicMatch = text.match(clinicPattern);
        
        if (clinicMatch) {
            name = `תור ל${personName} - ${clinicMatch[0]}`;
        } else {
            name = `תור ל${personName}`;
        }
    }
    
    // Pattern 2: Look for doctor/clinic names if no "תור ל" found
    if (!name) {
        for (const line of lines) {
            if (line.includes('ד"ר') || line.includes('דוקטור') || line.includes('רופא') || 
                line.includes('פרופ') || line.includes('מרפאה') || line.includes('קליניקה')) {
                name = line;
                break;
            }
        }
    }
    
    // Pattern 3: Look for specific clinic names
    if (!name) {
        const clinicPattern = /(מכבידנט|כללית|מאוחדת|לאומית)[\s\w-]*/;
        const clinicMatch = text.match(clinicPattern);
        if (clinicMatch) {
            name = clinicMatch[0];
        }
    }
    
    // Default: first line
    if (!name && lines.length > 0) {
        name = lines[0];
    }
    
    // Extract location - improved
    const locationPattern = /(מכבידנט|כללית|מאוחדת|לאומית)[\s\w-]*/;
    const locationMatch = text.match(locationPattern);
    if (locationMatch) {
        location = locationMatch[0];
    }
    
    // Pattern 2: Street/address patterns
    if (!location) {
        for (const line of lines) {
            if (line.includes('רחוב') || line.includes('רח\'') || line.includes('כתובת') || 
                line.includes('מיקום') || line.includes('ב-') || /\d+\s*\w+/.test(line)) {
                location = line;
                break;
            }
        }
    }
    
    // Extract doctor/contact person - IMPROVED
    const doctorPattern = /(?:ל)?גב['׳]?\s+(\w+\s+\w+)|(?:ל)?ד["״]ר\s+(\w+\s+\w+)|(?:ל)?פרופ['׳]?\s+(\w+\s+\w+)/;
    const doctorMatch = text.match(doctorPattern);
    let doctorName = '';
    if (doctorMatch) {
        doctorName = '👤 ' + doctorMatch[0];
    }
    
    // Build notes from remaining text
    const noteParts = [];
    
    // Add doctor name if found
    if (doctorName) {
        noteParts.push(doctorName);
    }
    
    // Add location if found
    if (location) {
        noteParts.push('📍 ' + location);
    }
    
    // Add phone if found
    if (phone) {
        noteParts.push('☎️ ' + phone);
    }
    
    // Add URL if found
    if (url) {
        noteParts.push('🔗 ' + url);
    }
    
    // Add remaining text as notes (filter out already extracted info)
    for (const line of lines) {
        const lineClean = line.trim();
        if (lineClean.length < 3) continue;
        
        const isExtracted = 
            (name && lineClean.includes(name.replace('תור ל', '').replace(' - ', ''))) ||
            (location && lineClean.includes(location)) ||
            (phone && lineClean.includes(phone)) ||
            (url && lineClean.includes(url)) ||
            (doctorName && lineClean.includes(doctorName.replace('👤 ', ''))) ||
            (dueTime && lineClean.includes(dueTime)) ||
            (dateMatch && lineClean.includes(dateMatch[0]));
        
        if (!isExtracted) {
            noteParts.push(lineClean);
        }
    }
    
    notes = noteParts.join('\n');
    
    return [{
        name: name || 'פגישה',
        price: 0,
        qty: 0,  // No quantity for appointments
        checked: false,
        category: 'תור/פגישה',
        note: notes,
        dueDate: dueDate,
        dueTime: dueTime,
        paymentUrl: url,
        isPaid: false,
        reminderValue: '',
        reminderUnit: '',
        lastUpdated: Date.now(),
        cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }];
}

// Parse shopping list text
function parseShoppingListText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const items = [];
    
    lines.forEach(line => {
        if (!line) return;
        
        // Try to extract price
        let price = 0;
        let name = line;
        
        // Pattern: "חלב 12" or "חלב 12 ש"ח" or "חלב ₪12"
        const pricePattern = /(.+?)\s*[₪]?\s*(\d+(?:\.\d+)?)\s*(?:ש"ח|שקל)?/;
        const match = line.match(pricePattern);
        
        if (match) {
            name = match[1].trim();
            price = parseFloat(match[2]) || 0;
        }
        
        // Auto-detect category
        const category = detectCategory(name) || 'אחר';
        
        items.push({
            name: name,
            price: price,
            qty: 1,  // Keep quantity for shopping lists
            checked: false,
            category: category,
            note: '',
            dueDate: '',
            dueTime: '',
            paymentUrl: '',
            isPaid: false,
            reminderValue: '',
            reminderUnit: '',
            lastUpdated: Date.now(),
            cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });
    });
    
    return items;
}

// Parse general list text
function parseGeneralListText(text) {
    // For general lists, keep the entire text as ONE item (like Google Keep)
    // Don't split into lines - it's a single note/memo
    
    return [{
        name: text.trim(),  // The entire text as one item
        price: 0,
        qty: 0,
        checked: false,
        category: 'אחר',
        note: '',
        dueDate: '',
        dueTime: '',
        paymentUrl: '',
        isPaid: false,
        reminderValue: '',
        reminderUnit: '',
        isGeneralNote: true,  // Mark as general note - hide price/qty in UI
        lastUpdated: Date.now(),
        cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }];
}

// Initialize notification badge on page load
document.addEventListener('DOMContentLoaded', function() {
    // Date/time field event listeners
    const itemDueDateField = document.getElementById('itemDueDate');
    const itemDueTimeField = document.getElementById('itemDueTime');
    const editItemDueDateField = document.getElementById('editItemDueDate');
    const editItemDueTimeField = document.getElementById('editItemDueTime');
    
    if (itemDueDateField && itemDueTimeField) {
        itemDueDateField.addEventListener('change', function() {
            if (this.value) {
                itemDueTimeField.style.display = 'block';
            } else {
                itemDueTimeField.style.display = 'none';
                itemDueTimeField.value = '';
            }
        });
    }
    
    if (editItemDueDateField && editItemDueTimeField) {
        editItemDueDateField.addEventListener('change', function() {
            if (this.value) {
                editItemDueTimeField.style.display = 'block';
            } else {
                editItemDueTimeField.style.display = 'none';
                editItemDueTimeField.value = '';
            }
        });
    }
    
    setTimeout(() => {
        if (typeof updateNotificationBadge === 'function') {
            updateNotificationBadge();
        }
        // אם הגענו מלחיצה על התראה (URL param או SW) — דלג על ה-modal האוטומטי,
        // כי checkNotificationUrlParam יציג בעצמו רק את ההתראה הנוכחית
        const isFromNotification = new URLSearchParams(window.location.search).get('vplus-action');
        if (!isFromNotification && !_suppressStartupModal && typeof checkUrgentPayments === 'function') {
            checkUrgentPayments();
        }
        
        // Always check clipboard on startup
        checkClipboardOnStartup();
    }, 500);
});

// Check clipboard when app becomes visible (returns from background)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // App is visible again
        console.log('App became visible - checking clipboard');
        setTimeout(() => {
            checkClipboardOnStartup();
        }, 500); // Increased to 500ms for better reliability
    }
});

// Also check on window focus (when switching back from another app)
window.addEventListener('focus', function() {
    console.log('Window gained focus - checking clipboard');
    setTimeout(() => {
        checkClipboardOnStartup();
    }, 500);
});





// ========== מערכת תזכורות — נבנתה מחדש ==========
//
// ארכיטקטורה נקייה:
//   nextAlertTime  — מתי תירה ההתראה (ms epoch). snooze = עדכון לעתיד.
//   alertDismissedAt — מתי סגר המשתמש (= nextAlertTime של אותה פעם).
//   dismiss לא משנה nextAlertTime — רק מונע popup אוטומטי.
//   snooze מוחק alertDismissedAt ומגדיר nextAlertTime חדש.
// ─────────────────────────────────────────────────────────────────

let _reminderTimers = new Map();
// _forceShowAfterNotificationClick declared above (line 6500)

// ── חישוב זמן ההתראה הטבעי ────────────────────────────────────────
function computeNextAlertTime(item) {
    if (!item.dueDate || !item.reminderValue || !item.reminderUnit) return null;
    const timeStr = item.dueTime || '09:00';
    const [h, m] = timeStr.split(':');
    const due = new Date(item.dueDate);
    due.setHours(parseInt(h), parseInt(m), 0, 0);
    const reminderMs = getReminderMilliseconds(item.reminderValue, item.reminderUnit);
    return due.getTime() - reminderMs;
}

// ── initItemAlertTime: קרא בעת יצירה/עריכה של פריט ───────────────
function initItemAlertTime(item) {
    const natural = computeNextAlertTime(item);
    if (!natural) {
        item.nextAlertTime = null;
        return;
    }
    const now = Date.now();
    // אם אין nextAlertTime, או אם שינו את התאריך/תזכורת — אפס
    if (!item.nextAlertTime || item.nextAlertTime <= now) {
        item.nextAlertTime = natural;
        item.alertDismissedAt = null;
    }
    // אם יש nextAlertTime בעתיד (snooze) — שמור אותו
}

// ── snoozeUrgentAlert: דחה את ההתראה ─────────────────────────────
function snoozeUrgentAlert(ms) {
    const now = Date.now();
    const snoozeUntil = now + ms;
    let count = 0;

    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            if (!item.nextAlertTime) return;
            // snooze פריטים שהתראה שלהם הגיעה (בעבר) — אלה הנוכחיים
            // גם אם dismissed — snooze מנצח (המשתמש בחר מפורשות)
            if (item.nextAlertTime > now && !item.alertDismissedAt) return;
            item.nextAlertTime = snoozeUntil;
            item.alertDismissedAt = null; // נקה dismiss
            count++;
        });
    });

    if (count === 0) {
        // fallback: snooze כל פריט עם תזכורת
        Object.values(db.lists).forEach(list => {
            (list.items || []).forEach(item => {
                if (item.checked || item.isPaid || !item.dueDate || !item.reminderValue) return;
                item.nextAlertTime = snoozeUntil;
                item.alertDismissedAt = null;
            });
        });
    }

    save();
    closeModal('urgentAlertModal');
    _scheduleAllReminders(); // רשום timers חדשים מיד

    const label = ms < 3600000
        ? Math.round(ms / 60000) + ' דקות'
        : ms < 86400000 ? Math.round(ms / 3600000) + ' שעות'
        : Math.round(ms / 86400000) + ' ימים';
    showNotification('⏰ תוזכר בעוד ' + label, 'info');
}

// ── closeUrgentAlert: dismiss ─────────────────────────────────────
function closeUrgentAlert() {
    const now = Date.now();
    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            const t = item.nextAlertTime;
            if (!t || t > now) return;
            if (item.alertDismissedAt && item.alertDismissedAt >= t) return;
            item.alertDismissedAt = t; // סמן dismissed עבור זמן זה בלבד
        });
    });
    save();
    closeModal('urgentAlertModal');
}

// ── checkUrgentPayments: בדוק והצג התראות שהגיעו ─────────────────
function checkUrgentPayments() {
    if (!db || !db.lists) return;
    const now = Date.now();
    const forceShow = _forceShowAfterNotificationClick;
    _forceShowAfterNotificationClick = false;

    const alertItems = [];
    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            const t = item.nextAlertTime;
            if (!t || t > now) return;
            if (!forceShow && item.alertDismissedAt && item.alertDismissedAt >= t) return;
            alertItems.push(item);
        });
    });

    updateNotificationBadge();
    if (alertItems.length > 0) showUrgentAlertModal(alertItems);
}

// updateNotificationBadge defined above (single implementation)

// ── showUrgentAlertModal ──────────────────────────────────────────
function showUrgentAlertModal(urgentItems) {
    const modal = document.getElementById('urgentAlertModal');
    const itemsList = document.getElementById('urgentItemsList');
    if (!modal || !itemsList) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdue  = urgentItems.filter(i => { const d = new Date(i.dueDate); d.setHours(0,0,0,0); return d < today; });
    const upcoming = urgentItems.filter(i => { const d = new Date(i.dueDate); d.setHours(0,0,0,0); return d >= today; });

    let html = '';

    if (overdue.length > 0) {
        html += '<div style="font-weight:bold;color:#ef4444;margin-bottom:10px;">⚠️ באיחור:</div>';
        overdue.forEach(item => {
            const esc = (item.name || '').replace(/'/g, "\'");
            html += `<div class="urgent-item" style="border-right:3px solid #ef4444;cursor:pointer;" onclick="goToItemFromAlert('${esc}')">
                <div class="urgent-item-name">${item.name}</div>
                <div class="urgent-item-date">📅 תאריך יעד: ${formatDate(item.dueDate)}</div>
                <div style="font-size:0.72rem;color:#7367f0;margin-top:4px;">לחץ לצפייה במוצר ←</div>
            </div>`;
        });
    }

    if (upcoming.length > 0) {
        if (overdue.length > 0) html += '<div style="margin-top:15px;"></div>';
        html += '<div style="font-weight:bold;color:#3b82f6;margin-bottom:10px;">🔔 תזכורות:</div>';
        upcoming.forEach(item => {
            const d = new Date(item.dueDate); d.setHours(0,0,0,0);
            const days = Math.floor((d - today) / 86400000);
            const daysText = days === 0 ? 'היום' : days === 1 ? 'מחר' : `בעוד ${days} ימים`;
            const reminderText = item.reminderValue && item.reminderUnit
                ? ` (התראה: ${formatReminderText(item.reminderValue, item.reminderUnit)} לפני)` : '';
            const esc = (item.name || '').replace(/'/g, "\'");
            html += `<div class="urgent-item" style="border-right:3px solid #3b82f6;cursor:pointer;" onclick="goToItemFromAlert('${esc}')">
                <div class="urgent-item-name">${item.name}</div>
                <div class="urgent-item-date">📅 ${formatDate(item.dueDate)} (${daysText})${reminderText}</div>
                <div style="font-size:0.72rem;color:#7367f0;margin-top:4px;">לחץ לצפייה במוצר ←</div>
            </div>`;
        });
    }

    itemsList.innerHTML = html;
    modal.classList.add('active');
}

// ── _scheduleAllReminders: הגדר timers לכל הפריטים ─────────────────
function _scheduleAllReminders() {
    _reminderTimers.forEach(id => clearTimeout(id));
    _reminderTimers.clear();

    if (!db || !db.lists) return;
    const now = Date.now();

    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate || !item.reminderValue) return;
            if (!item.nextAlertTime) {
                initItemAlertTime(item);
                if (!item.nextAlertTime) return;
            }
            const t = item.nextAlertTime;
            if (item.alertDismissedAt && item.alertDismissedAt >= t && t <= now) return; // dismissed
            const delay = t - now;
            const key = item.cloudId || item.name;
            if (delay > 0) {
                const timerId = setTimeout(() => {
                    console.log('[Reminder] fired:', item.name);
                    _firePushNotification(item);
                    checkUrgentPayments();
                }, Math.min(delay, 2147483647));
                _reminderTimers.set(key, timerId);
                console.log(`[Reminder] scheduled "${item.name}" in ${Math.round(delay/1000)}s`);
            } else {
                // הגיע כבר — הצג
                checkUrgentPayments();
            }
        });
    });
}

// ── _firePushNotification: שלח push דרך SW ──────────────────────────
function _firePushNotification(item) {
    const title = `⏰ תזכורת: ${item.name}`;
    const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString('he-IL') : '';
    const timeStr = item.dueTime ? ' בשעה ' + item.dueTime : '';
    const body = dateStr ? `יעד: ${dateStr}${timeStr}` : 'יש לך תזכורת';
    const data = { type: 'reminder', itemName: item.name, dueDate: item.dueDate || '', dueTime: item.dueTime || '' };

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION', title, body,
            tag: 'reminder-' + (item.cloudId || item.name), data
        });
    }
}

// ── initNotificationSystem ───────────────────────────────────────────
async function initNotificationSystem() {
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    _scheduleAllReminders();
    checkUrgentPayments();
    // heartbeat — גיבוי לmissed timers
    setInterval(checkUrgentPayments, 30000);
}

window.addEventListener('load', () => { setTimeout(initNotificationSystem, 2000); });

// כשנשמר — רשום מחדש
const _origSave = save;
save = function() {
    _origSave.apply(this, arguments);
    setTimeout(_scheduleAllReminders, 150);
};

// ── Custom Snooze ─────────────────────────────────────────────────
function openCustomSnooze() {
    closeModal('urgentAlertModal');
    openModal('customSnoozeModal');
}

function applyCustomSnooze() {
    const value = parseFloat(document.getElementById('customSnoozeValue').value);
    const unit  = document.getElementById('customSnoozeUnit').value;
    if (!value || value <= 0) { showNotification('⚠️ נא להזין מספר חיובי', 'warning'); return; }
    const ms = unit === 'minutes' ? value * 60000
             : unit === 'hours'   ? value * 3600000
             : value * 86400000;
    snoozeUrgentAlert(ms);
    closeModal('customSnoozeModal');
    document.getElementById('customSnoozeValue').value = '1';
    document.getElementById('customSnoozeUnit').value  = 'hours';
}

// ── Legacy stubs ──────────────────────────────────────────────────
function checkAndScheduleNotifications() { _scheduleAllReminders(); }
function scheduleItemNotification() {}
function showInAppNotification() {}
function playNotificationSound() {}
function showItemNotification() {}
function checkSnoozeStatus() { return true; }
function updateAppBadge(count) {
    if ('setAppBadge' in navigator) {
        count > 0 ? navigator.setAppBadge(count).catch(()=>{}) : navigator.clearAppBadge().catch(()=>{});
    }
}

// ── SW Message Listener ───────────────────────────────────────────
// flag: מונע מה-startup modal להופיע כשמגיעים מהתראה דרך SW
let _suppressStartupModal = false;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'NOTIFICATION_ACTION' || msg.type === 'SHOW_URGENT_ALERT') {
            const action = msg.action || 'show';
            if (action === 'snooze-10')  { snoozeUrgentAlert(10 * 60 * 1000); return; }
            if (action === 'snooze-60')  { snoozeUrgentAlert(60 * 60 * 1000); return; }
            _suppressStartupModal = true; // מנע modal אוטומטי
            closeModal('urgentAlertModal');
            _forceShowAfterNotificationClick = true;
            checkUrgentPayments();
        }

        if (msg.type === 'ALERT_DATA_RESPONSE') {
            if (msg.data && msg.data.action) {
                const action = msg.data.action;
                if (action === 'snooze-10') { snoozeUrgentAlert(10 * 60 * 1000); return; }
                if (action === 'snooze-60') { snoozeUrgentAlert(60 * 60 * 1000); return; }
                _suppressStartupModal = true; // מנע modal אוטומטי
                closeModal('urgentAlertModal');
                _forceShowAfterNotificationClick = true;
                checkUrgentPayments();
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_BADGE' });
                }
            }
        }
    });
}

// ── URL Param Handler (כשנפתח מהתראה) ───────────────────────────
function checkNotificationUrlParam() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('vplus-action');
    if (action) {
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => {
            if (action === 'snooze-10') { snoozeUrgentAlert(10 * 60 * 1000); return; }
            if (action === 'snooze-60') { snoozeUrgentAlert(60 * 60 * 1000); return; }
            closeModal('urgentAlertModal'); // סגור modal ישן שנפתח ב-startup לפני הצגת הנכון
            _forceShowAfterNotificationClick = true;
            checkUrgentPayments();
        }, 1500);
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'GET_ALERT_DATA' });
    }
}
window.addEventListener('load', () => { setTimeout(checkNotificationUrlParam, 1000); });


// ║    🧙 VPLUS WIZARD — Full-Screen Cinematic Experience v3        ║
// ║    כל לחיצה = מסך הסבר מלא, מרהיב, אנימטיבי                    ║
// ╚══════════════════════════════════════════════════════════════════╝

let wizardMode = false;
let _wizDismissCallback = null;
let _wizAutoTimer       = null;

// ── Content library ────────────────────────────────────────────────
const WIZ = {
    plusBtn: {
        emoji:'➕', phase:'before', emojiColor:'#22c55e',
        title:'הוספת מוצר לרשימה',
        body:'לחץ את הכפתור הירוק כדי לפתוח את חלון הוספת המוצר.\nתוכל להזין שם, מחיר, כמות וקטגוריה.',
        tip:'💡 טיפ: הפעל "הוספה רציפה" כדי להוסיף כמה מוצרים ברצף מהיר!',
    },
    voiceBought: {
        emoji:'✅', phase:'before',
        title:'קניתי — סימון קולי',
        body:'לחץ ואמור בקול שם של מוצר שכבר קנית.\nהאפליקציה תמצא אותו ברשימה ותסמן אותו כנרכש אוטומטית.\nאם המוצר כבר מסומן — תקבל הודעה שהוא כבר נרכש.',
        tip:'💡 תוכל לבטל בקלות עם כפתור "ביטול" שיופיע מיד אחרי הסימון.',
    },
    voiceTobuy: {
        emoji:'🛍️', phase:'before',
        title:'לקנות — חיפוש קולי',
        body:'לחץ ואמור שם מוצר.\n✅ אם קיים ומסומן — יוחזר למצב לקנות.\n📋 אם קיים ולא נרכש — תקבל הודעה שהוא כבר ממתין.\n➕ אם לא קיים ברשימה — תוצע לך אפשרות להוסיף אותו.',
        tip:'💡 שימושי כשטעית בסימון, או כשמוצר שגמר צריך לחזור לרשימה.',
    },
    plusDone: {
        emoji:'🎉', phase:'after',
        title:'מוצר נוסף בהצלחה!',
        body:'המוצר נוסף לרשימה שלך.\nהסכום הכולל התעדכן אוטומטית.',
        tip:'💡 לחץ ➕ שוב להוספת מוצר נוסף, או גלול למטה לראות את הרשימה.',
    },
    checkItem: {
        emoji:'✅', phase:'before',
        title:'סימון מוצר כרכוש',
        body:'לחץ על הכרטיס כדי לסמן שרכשת את המוצר.\nהמוצר יועבר לרשימת "שולם".',
        tip:'💡 שינית את דעתך? לחץ שוב כדי לבטל את הסימון.',
    },
    checkDone: {
        emoji:'✅', phase:'after',
        title:'מוצר סומן!',
        body:'מצוין! המוצר נרשם כרכישה שבוצעה.\nניתן לבטל בלחיצה נוספת.',
        tip:'💡 מוצרים מסומנים נספרים ב"שולם" בסרגל התחתון.',
    },
    removeItem: {
        emoji:'🗑️', phase:'before',
        title:'מחיקת מוצר',
        body:'המוצר יוסר מהרשימה.\nיש לך 5 שניות לבטל את המחיקה!',
        tip:'⚠️ לחץ על "בטל" שיופיע למטה כדי לשחזר.',
    },
    removeDone: {
        emoji:'🗑️', phase:'after',
        title:'מוצר הוסר',
        body:'המוצר הוסר מהרשימה.\nלחץ "בטל" אם טעית.',
        tip:'💡 המוצר יכול להופיע בהיסטוריה אם השתמשת בהשלמה רשימה.',
    },
    newList: {
        emoji:'📋', phase:'before',
        title:'יצירת רשימה חדשה',
        body:'תוכל לתת שם לרשימה, להגדיר תקציב ולהוסיף קישור לאתר החנות.',
        tip:'💡 אפשר גם לשמור כתבנית לשימוש עתידי!',
    },
    newListDone: {
        emoji:'🎊', phase:'after',
        title:'הרשימה נוצרה!',
        body:'הרשימה החדשה שלך מוכנה.\nעכשיו לחץ ➕ כדי להתחיל להוסיף מוצרים.',
        tip:'💡 אפשר לעבור בין רשימות מהטאב "הרשימות שלי".',
    },
    completeList: {
        emoji:'🏁', phase:'before',
        title:'סיום וסגירת רשימה',
        body:'הרשימה תסומן כהושלמה ותישמר בהיסטוריה שלך.\nתוכל לצפות בה מאוחר יותר.',
        tip:'💡 רוצה להשתמש בה שוב? שמור אותה כתבנית לפני הסגירה!',
    },
    completeDone: {
        emoji:'🏆', phase:'after',
        title:'כל הכבוד! הרשימה הושלמה',
        body:'הרשימה נשמרה בהיסטוריה שלך.\nכל ההוצאות נרשמו בסטטיסטיקות.',
        tip:'💡 כנס להיסטוריה כדי לצפות בסיכום הרכישות.',
    },
    lockBtn: {
        emoji:'🔒', phase:'before',
        title:'נעילת הרשימה',
        body:'הנעילה מונעת שינויים בשוגג.\nשימושי כשהרשימה מוכנה לקנייה.',
        tip:'💡 לחץ שוב על הכפתור כדי לשחרר את הנעילה.',
    },
    lockDone: {
        emoji:'🔐', phase:'after',
        title:'הרשימה נעולה',
        body:'הרשימה כעת מוגנת מפני עריכה בשוגג.\nלחץ שוב להסרת הנעילה.',
        tip:'💡 בזמן נעילה אפשר עדיין לסמן מוצרים כרכושים.',
    },
    bellBtn: {
        emoji:'🔔', phase:'before',
        title:'מרכז התראות',
        body:'כאן מרוכזות כל ההתראות הפעילות שלך.\n🔴 אדום — תאריך היעד עבר, הפריט באיחור.\n🟠 כתום — הפריט דורש תשומת לב היום או מחר.\n🔵 כחול — יש תזכורת שפעילה בימים הקרובים.',
        tip:'💡 החלק התראה שמאלה או ימינה כדי למחוק אותה.',
    },
    cloudBtn: {
        emoji:'☁️', phase:'before',
        title:'סנכרון וגיבוי לענן',
        body:'חבר את האפליקציה לחשבון Google שלך.\nכל הרשימות יגובו אוטומטית בענן ויהיו זמינות מכל מכשיר.\nהנתונים שלך מאובטחים ולא יאבדו גם אם תחליף טלפון.',
        tip:'💡 הסנכרון מתבצע אוטומטית בכל שינוי — ללא לחיצות נוספות.',
    },
    settingsBtn: {
        emoji:'⚙️', phase:'before',
        title:'הגדרות האפליקציה',
        body:'כאן תמצא: שפת ממשק, מצב לילה, סנכרון ענן, ניהול קטגוריות ועוד.',
        tip:'💡 הפעל מצב לילה לנוחות שימוש בשעות האפלה.',
    },
    tabList: {
        emoji:'🛒', phase:'before',
        title:'הרשימה הפעילה',
        body:'הצג את הרשימה הפעילה עם כל הפריטים שלה.\nכאן מתבצעת הקנייה.',
        tip:'💡 גרור פריטים לסידור מחדש של הרשימה.',
    },
    tabLists: {
        emoji:'📚', phase:'before',
        title:'כל הרשימות שלך',
        body:'כאן תמצא את כל הרשימות.\nניתן ליצור, לערוך, למחוק ולבחור רשימה פעילה.',
        tip:'💡 לחץ ממושך על רשימה לאפשרויות נוספות.',
    },
    tabStats: {
        emoji:'📊', phase:'before',
        title:'סטטיסטיקות הוצאות',
        body:'גרפים ותובנות על ההוצאות שלך לפי חודש, קטגוריה וזמן.',
        tip:'💡 השתמש בסטטיסטיקות לתכנון תקציב חכם יותר.',
    },
    editName: {
        emoji:'✏️', phase:'before',
        title:'עריכת שם מוצר',
        body:'לחץ על שם המוצר כדי לשנות אותו.\nהשינוי יישמר אוטומטית.',
        tip:'💡 שם ברור עוזר למצוא מוצרים מהר בחיפוש.',
    },
    editPrice: {
        emoji:'₪', phase:'before',
        title:'עריכת מחיר',
        body:'לחץ על הסכום כדי לעדכן את המחיר.\nהסיכום הכולל מתעדכן מיידית.',
        tip:'💡 אפשר להזין מחיר ל-0 אם המוצר חינמי.',
    },
    category: {
        emoji:'🏷️', phase:'before',
        title:'שינוי קטגוריה',
        body:'קטגוריות עוזרות לסדר ולסנן את הרשימה בקלות.\nהאפליקציה מנסה לזהות קטגוריה אוטומטית.',
        tip:'💡 ניתן ליצור קטגוריות מותאמות אישית בהגדרות.',
    },
    note: {
        emoji:'📝', phase:'before',
        title:'הוספת הערה',
        body:'הוסף פרטים נוספים: לינק למוצר, הוראות מיוחדות, או כל מידע שחשוב לך.',
        tip:'💡 הערות עם לינקים יהפכו ללחיצים אוטומטית.',
    },
    reminder: {
        emoji:'⏰', phase:'before',
        title:'הגדרת תזכורת',
        body:'קבע מתי תקבל התראה לפני תאריך היעד של הפריט.\nהתזכורות מגיעות גם כשהאפליקציה סגורה.',
        tip:'💡 הגדר תזכורת של יומיים לפני לתכנון מראש.',
    },
    qtyPlus: {
        emoji:'🔢', phase:'before',
        title:'הגדלת כמות',
        body:'לחץ + כדי להגדיל את מספר היחידות.\nהמחיר הכולל יתעדכן אוטומטית.',
        tip:'💡 שנה כמות מהירה: לחץ ממושך על + לריבוי מהיר.',
    },
    qtyMinus: {
        emoji:'🔢', phase:'before',
        title:'הפחתת כמות',
        body:'לחץ − כדי להפחית יחידה.\nכמות מינימלית היא 1.',
        tip:'💡 לחץ 🗑️ אם ברצונך למחוק לגמרי.',
    },
    pasteBtn: {
        emoji:'📋', phase:'before',
        title:'ייבוא רשימה מטקסט',
        body:'הדבק טקסט מוואטסאפ, אימייל או כל מקור אחר.\nהאפליקציה תזהה אוטומטית את הפריטים ותבנה רשימה.',
        tip:'💡 עובד עם רשימות מוואטסאפ, הערות טלפון ועוד!',
    },
    excelBtn: {
        emoji:'📊', phase:'before',
        title:'ייבוא מאקסל / כרטיס אשראי',
        body:'ייבא קובץ Excel (.xlsx) ישירות מהבנק או חברת האשראי.\nהאפליקציה תהפוך את העמודות לרשימת קניות חכמה.',
        tip:'💡 תומך בקבצי Excel מבנק הפועלים, לאומי, כאל, ישראכרט ועוד.',
    },
    bankBtn: {
        emoji:'🏦', phase:'before',
        title:'ייבוא PDF מהבנק / אשראי',
        body:'העלה קובץ PDF של דף חשבון, חיובי כרטיס אשראי או קבלה.\nהמערכת תסרוק את הנתונים ותייצר ממנם רשימה אוטומטית.',
        tip:'💡 עובד עם PDF מחברות אשראי, דפי בנק וחשבוניות.',
    },
    myLists: {
        emoji:'📚', phase:'before',
        title:'הרשימות שלי',
        body:'כאן תמצא את כל רשימות הקניות שלך.\nלחץ על רשימה לפתיחתה, או צור רשימה חדשה.',
        tip:'💡 ניתן לגרור ולסדר את הרשימות בסדר הרצוי.',
    },
};

// ── Core: show a full-screen wizard card ───────────────────────────
function wiz(key, phase, onDismiss) {
    if (!wizardMode) {
        if (onDismiss) onDismiss();
        return;
    }
    const data = WIZ[key];
    if (!data) { if (onDismiss) onDismiss(); return; }

    const overlay = document.getElementById('wizCardOverlay');
    const card    = document.getElementById('wizCard');
    if (!overlay || !card) { if (onDismiss) onDismiss(); return; }

    // Populate content
    const wizEmojiEl = document.getElementById('wizEmoji');
    wizEmojiEl.textContent = data.emoji;
    wizEmojiEl.style.color = data.emojiColor || '';
    document.getElementById('wizTitle').textContent  = data.title;
    document.getElementById('wizBody').innerHTML     = data.body.replace(/\n/g,'<br>');

    const phasePill  = document.getElementById('wizPhasePill');
    const phaseLabel = document.getElementById('wizPhaseLabel');
    const isBefore   = (data.phase === 'before' || phase === 'before');
    phasePill.className = 'wiz-phase-pill ' + (isBefore ? 'wiz-phase-before' : 'wiz-phase-after');
    phaseLabel.textContent = isBefore ? 'לפני הפעולה' : 'בוצע!';

    const tipBox  = document.getElementById('wizTipBox');
    const tipText = document.getElementById('wizTipText');
    if (data.tip) {
        tipText.textContent = data.tip.slice(2).trim(); // remove emoji prefix
        document.getElementById('wizTipIcon').textContent = data.tip[0];
        tipBox.style.display = 'flex';
    } else {
        tipBox.style.display = 'none';
    }

    // Btn labels
    const okBtn   = document.getElementById('wizOkBtn');
    const skipBtn = document.getElementById('wizSkipBtn');
    okBtn.textContent   = isBefore ? 'הבנתי, בואו נמשיך ✓' : 'מצוין! ✓';
    skipBtn.textContent = 'דלג';

    // Store callback
    _wizDismissCallback = onDismiss || null;

    // Clear any pending auto-close
    clearTimeout(_wizAutoTimer);

    // Animate card in
    card.classList.remove('wiz-card-in', 'wiz-card-out');
    void card.offsetWidth; // reflow
    overlay.classList.add('wiz-active');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            card.classList.add('wiz-card-in');
        });
    });

    // After-phase: NO auto-dismiss — only button closes card

    // Tap backdrop to dismiss
    overlay.onclick = (e) => {
        if (e.target === overlay || e.target.classList.contains('wiz-backdrop') ||
            e.target.classList.contains('wiz-bg') || e.target.classList.contains('wiz-blob')) {
            _wizDismiss();
        }
    };
}

function _wizForceClose() {
    // Immediately close any open wizard card without waiting for animation
    clearTimeout(_wizAutoTimer);
    _wizDismissCallback = null;
    const overlay = document.getElementById('wizCardOverlay');
    const card    = document.getElementById('wizCard');
    if (overlay) overlay.classList.remove('wiz-active');
    if (card) { card.classList.remove('wiz-card-in'); card.classList.remove('wiz-card-out'); }
}

function _wizSkip() {
    // סגור את כרטיס המדריך
    _wizDismiss();
    // המתן לאנימציית הסגירה ואז כבה מדריך + toast
    setTimeout(() => {
        if (wizardMode) {
            wizardMode = false;
            localStorage.setItem('wizardMode', 'false');
            document.body.classList.remove('wizard-mode-active');
            const btn = document.getElementById('wizardModeBtn');
            if (btn) btn.classList.remove('wizard-active');
            const panelPill = document.getElementById('wizardPanelPill');
            const panelTxt  = document.getElementById('wizardPanelText');
            if (panelPill) { panelPill.style.background=''; panelPill.style.color=''; }
            if (panelTxt) panelTxt.textContent = 'מדריך';
            _showToast({ message: '✨ מדריך כובה', type: 'success', duration: 3000 });
        }
    }, 320);
}

function _wizDismiss() {
    clearTimeout(_wizAutoTimer);
    const overlay = document.getElementById('wizCardOverlay');
    const card    = document.getElementById('wizCard');
    if (!overlay || !card) return;

    card.classList.remove('wiz-card-in');
    card.classList.add('wiz-card-out');

    setTimeout(() => {
        overlay.classList.remove('wiz-active');
        card.classList.remove('wiz-card-out');
        if (_wizDismissCallback) {
            const cb = _wizDismissCallback;
            _wizDismissCallback = null;
            cb();
        }
    }, 300);
}

function _wizCloseWelcome() {
    const el = document.getElementById('wizWelcomeOverlay');
    if (!el) return;
    el.classList.remove('wiz-welcome-visible');
    setTimeout(() => { el.style.display = 'none'; }, 350);
}

function _wizShowWelcome() {
    const el = document.getElementById('wizWelcomeOverlay');
    if (!el) return;
    el.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('wiz-welcome-visible'));
    });
}

// ── Toggle wizard mode ─────────────────────────────────────────────

window._closeDemoPrompt = function() {
    var el = document.getElementById('demoWizardPrompt');
    if (el) el.remove();
};

function _askDemoBeforeWizard() {
    var hasRealData = Object.values(db.lists).some(function(l){ return l.items && l.items.length > 0 && !l.isDemo; });
    if (isDemoMode || hasRealData) {
        // יש כבר נתונים — פתח מדריך ישירות
        _wizShowWelcome();
        return;
    }
    // שאל על דמו
    var overlay = document.createElement('div');
    overlay.id = 'demoWizardPrompt';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.6);display:flex;align-items:flex-end;font-family:system-ui,sans-serif;';
    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:white;border-radius:28px 28px 0 0;width:100%;padding:24px 20px 40px;animation:demoSheetIn 0.35s cubic-bezier(0.34,1.56,0.64,1);';
    sheet.innerHTML = '<div style="display:flex;justify-content:flex-end;margin-bottom:6px;"><button onclick="window._closeDemoPrompt();" style="background:rgba(0,0,0,0.06);border:none;border-radius:50%;width:32px;height:32px;font-size:20px;cursor:pointer;color:#888;">×</button></div><div style="width:38px;height:4px;background:#e5e7eb;border-radius:99px;margin:0 auto 18px;"></div>'
        + '<div style="font-size:44px;text-align:center;margin-bottom:10px;">🎯</div>'
        + '<div style="font-size:19px;font-weight:900;color:#1e1b4b;text-align:center;margin-bottom:6px;">טרם התחלת להשתמש</div>'
        + '<div style="font-size:13px;color:#6b7280;text-align:center;line-height:1.6;margin-bottom:20px;">רוצה לטעון 10 רשימות לדוגמה<br>כדי שהמדריך יהיה חי ומעניין יותר?</div>'
        + '<div style="display:flex;flex-direction:column;gap:10px;">'
        + '<button onclick="window._closeDemoPrompt();loadDemoMode();_wizShowWelcome();" style="background:linear-gradient(135deg,#7367f0,#9055ff);color:white;border:none;border-radius:18px;padding:16px;font-size:15px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif;box-shadow:0 6px 20px rgba(115,103,240,0.35);">\uD83C\uDFAF כן, טען נתוני דמו</button>'
        + '<button onclick="window._closeDemoPrompt();_wizShowWelcome();" style="background:#f3f4f6;color:#6b7280;border:none;border-radius:18px;padding:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;">לא תודה, התחל מדריך ריק</button>'
        + '</div>'
        + '<style>@keyframes demoSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>';
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
}

// ── GitHub Token Management ──────────────────────────────────────
function loadGithubToken() {
    const token = localStorage.getItem('vplus_github_pat') || '';
    window.GITHUB_PAT = token;
    const input = document.getElementById('githubTokenInput');
    if (input && token) input.value = token;
    updateGithubTokenStatus();
}

function saveGithubToken() {
    const input = document.getElementById('githubTokenInput');
    if (!input) return;
    const token = input.value.trim();
    if (!token) {
        localStorage.removeItem('vplus_github_pat');
        window.GITHUB_PAT = '';
        showNotification('🗑️ Token נמחק');
    } else if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        showNotification('⚠️ Token לא תקין — חייב להתחיל ב-ghp_ או github_pat_', 'warning');
        return;
    } else {
        localStorage.setItem('vplus_github_pat', token);
        window.GITHUB_PAT = token;
        showNotification('✅ GitHub Token נשמר!');
    }
    updateGithubTokenStatus();
}

function updateGithubTokenStatus() {
    const input  = document.getElementById('githubTokenInput');
    const status = document.getElementById('githubTokenStatus');
    if (!status) return;
    const val = (input ? input.value : '') || localStorage.getItem('vplus_github_pat') || '';
    if (val.startsWith('ghp_') || val.startsWith('github_pat_')) {
        status.textContent = '✅ מוגדר';
        status.style.color = '#22c55e';
    } else if (val.length > 0) {
        status.textContent = '⚠️ לא תקין';
        status.style.color = '#f59e0b';
    } else {
        status.textContent = '❌ לא מוגדר';
        status.style.color = '#ef4444';
    }
}

function toggleWizardMode() {
    wizardMode = !wizardMode;
    localStorage.setItem('wizardMode', wizardMode ? 'true' : 'false');

    const btn = document.getElementById('wizardModeBtn');
    const txt = document.getElementById('wizardBtnText');

    const panelPill = document.getElementById('wizardPanelPill');
    const panelTxt  = document.getElementById('wizardPanelText');
    if (wizardMode) {
        if (btn) btn.classList.add('wizard-active');
        if (txt) txt.textContent = 'מדריך';
        if (panelPill) { panelPill.style.background='#7367f0'; panelPill.style.color='white'; }
        if (panelTxt) panelTxt.textContent = '✨ פעיל';
        document.body.classList.add('wizard-mode-active');
        // שאל על דמו לפני פתיחת המדריך
        _askDemoBeforeWizard();
    } else {
        if (btn) btn.classList.remove('wizard-active');
        if (txt) txt.textContent = 'מדריך';
        if (panelPill) { panelPill.style.background=''; panelPill.style.color=''; }
        if (panelTxt) panelTxt.textContent = 'מדריך';
        document.body.classList.remove('wizard-mode-active');
        // Close any open card
        const overlay = document.getElementById('wizCardOverlay');
        if (overlay) overlay.classList.remove('wiz-active');
        _wizDismissCallback = null;
        clearTimeout(_wizAutoTimer);
        showNotification('מצב מדריך כובה');
    }
}

// ── handlePlusBtn ──────────────────────────────────────────────────
// קונטקסטואלי: הרשימות שלי → רשימה חדשה | הרשימה שלי → הוסף מוצר
function handlePlusBtn(e) {
    if (e) e.stopPropagation();
    if (activePage === 'summary') {
        // טאב הרשימות שלי — יצירת רשימה חדשה
        if (wizardMode) {
            wiz('newList', 'before', () => openModal('newListModal'));
        } else {
            openModal('newListModal');
        }
    } else {
        // טאב הרשימה שלי — הוספת מוצר
        if (wizardMode) {
            wiz('plusBtn', 'before', () => openModal('inputForm'));
        } else {
            openModal('inputForm');
        }
    }
}

// ── Wrap core functions with wizard before/after ───────────────────
const _orig = {};

// toggleItem
if (typeof toggleItem === 'function') {
    _orig.toggleItem = toggleItem;
    window.toggleItem = function(idx) {
        if (wizardMode) {
            wiz('checkItem', 'before', () => {
                _orig.toggleItem(idx);
                setTimeout(() => wiz('checkDone', 'after'), 200);
            });
        } else {
            _orig.toggleItem(idx);
        }
    };
}

// removeItem
if (typeof removeItem === 'function') {
    _orig.removeItem = removeItem;
    window.removeItem = function(idx) {
        if (wizardMode) {
            wiz('removeItem', 'before', () => {
                _orig.removeItem(idx);
                setTimeout(() => wiz('removeDone', 'after'), 200);
            });
        } else {
            _orig.removeItem(idx);
        }
    };
}

// addItemToList
if (typeof addItemToList === 'function') {
    _orig.addItemToList = addItemToList;
    window.addItemToList = function(e) {
        const hasName = (document.getElementById('itemName')?.value || '').trim().length > 0;
        _orig.addItemToList(e);
        if (wizardMode && hasName) {
            setTimeout(() => wiz('plusDone', 'after'), 350);
        }
    };
}

// saveNewList
if (typeof saveNewList === 'function') {
    _orig.saveNewList = saveNewList;
    window.saveNewList = function() {
        _orig.saveNewList();
        if (wizardMode) setTimeout(() => wiz('newListDone', 'after'), 400);
    };
}

// completeList
if (typeof completeList === 'function') {
    _orig.completeList = completeList;
    window.completeList = function() {
        _orig.completeList();
        if (wizardMode) setTimeout(() => wiz('completeDone', 'after'), 400);
    };
}

// toggleLock
if (typeof toggleLock === 'function') {
    _orig.toggleLock = toggleLock;
    window.toggleLock = function() {
        _orig.toggleLock();
        if (wizardMode) setTimeout(() => wiz('lockDone', 'after'), 200);
    };
}

// openNotificationCenter — NOT wizard-intercepted (must open immediately, also from lock screen)

// openEditItemNameModal
if (typeof openEditItemNameModal === 'function') {
    _orig.openEditItemNameModal = openEditItemNameModal;
    window.openEditItemNameModal = function(idx) {
        if (wizardMode) {
            wiz('editName', 'before', () => _orig.openEditItemNameModal(idx));
        } else {
            _orig.openEditItemNameModal(idx);
        }
    };
}

// openEditTotalModal
if (typeof openEditTotalModal === 'function') {
    _orig.openEditTotalModal = openEditTotalModal;
    window.openEditTotalModal = function(idx) {
        if (wizardMode) {
            wiz('editPrice', 'before', () => _orig.openEditTotalModal(idx));
        } else {
            _orig.openEditTotalModal(idx);
        }
    };
}

// openEditCategoryModal
if (typeof openEditCategoryModal === 'function') {
    _orig.openEditCategoryModal = openEditCategoryModal;
    window.openEditCategoryModal = function(idx) {
        if (wizardMode) {
            wiz('category', 'before', () => _orig.openEditCategoryModal(idx));
        } else {
            _orig.openEditCategoryModal(idx);
        }
    };
}

// openItemNoteModal
if (typeof openItemNoteModal === 'function') {
    _orig.openItemNoteModal = openItemNoteModal;
    window.openItemNoteModal = function(idx) {
        if (wizardMode) {
            wiz('note', 'before', () => _orig.openItemNoteModal(idx));
        } else {
            _orig.openItemNoteModal(idx);
        }
    };
}

// openEditReminder
if (typeof openEditReminder === 'function') {
    _orig.openEditReminder = openEditReminder;
    window.openEditReminder = function(idx) {
        if (wizardMode) {
            wiz('reminder', 'before', () => _orig.openEditReminder(idx));
        } else {
            _orig.openEditReminder(idx);
        }
    };
}

// Wrap tab/page switching
if (typeof showPage === 'function') {
    _orig.showPage = showPage;
    window.showPage = function(p) {
        if (wizardMode) {
            const keyMap = { lists:'tabList', listsMenu:'myLists', allLists:'myLists', stats:'tabStats' };
            const key = keyMap[p];
            if (key) {
                wiz(key, 'before', () => _orig.showPage(p));
                return;
            }
        }
        _orig.showPage(p);
    };
}

// Wrap openModal for specific modals with wizard tips
const _origOpenModal = typeof openModal === 'function' ? openModal : null;
if (_origOpenModal) {
    window.openModal = function(id) {
        if (wizardMode) {
            const modalTips = {
                'newListModal': 'newList',
                'confirmModal': 'completeList',
                'settingsModal': 'settingsBtn',
            };
            const tipKey = modalTips[id];
            if (tipKey) {
                wiz(tipKey, 'before', () => _origOpenModal(id));
                return;
            }
        }
        _origOpenModal(id);
    };
}

// changeQty — wrap for qty tips
if (typeof changeQty === 'function') {
    _orig.changeQty = changeQty;
    window.changeQty = function(idx, d) {
        if (wizardMode) {
            wiz(d > 0 ? 'qtyPlus' : 'qtyMinus', 'before', () => _orig.changeQty(idx, d));
        } else {
            _orig.changeQty(idx, d);
        }
    };
}

// ── Patch render to keep wizard mode indicator ─────────────────────
if (typeof render === 'function') {
    const _origRender = render;
    window.render = function() {
        _origRender();
        if (wizardMode) {
            document.body.classList.add('wizard-mode-active');
        }
    };
}

// ── Stubs for legacy HTML compatibility ────────────────────────────
function openWizard(type) {
    const map = {
        'addItem':      () => handlePlusBtn(null),
        'newList':      () => wizardMode ? wiz('newList','before', () => openModal('newListModal')) : openModal('newListModal'),
        'completeList': () => wizardMode ? wiz('completeList','before', () => openModal('confirmModal')) : openModal('confirmModal'),
    };
    if (map[type]) map[type]();
}
function closeWizard() {
    const o = document.getElementById('wizardOverlay');
    if (o) o.classList.remove('active');
}
function wizardOverlayClick(e) {
    if (e && e.target === document.getElementById('wizardOverlay')) closeWizard();
}

// ── Init on DOMContentLoaded ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const firstTime = !localStorage.getItem('wizardModeEverSet');
    if (firstTime) {
        // First launch: auto-enable wizard
        localStorage.setItem('wizardModeEverSet', 'true');
        localStorage.setItem('wizardMode', 'true');
    }
    if (localStorage.getItem('wizardMode') === 'true') {
        wizardMode = true;
        const btn = document.getElementById('wizardModeBtn');
        const txt = document.getElementById('wizardBtnText');
        if (btn) btn.classList.add('wizard-active');
        if (txt) txt.textContent = 'מדריך';
        document.body.classList.add('wizard-mode-active');
        // Show welcome on first time
        if (firstTime) {
            setTimeout(_wizShowWelcome, 800);
        }
    } else {
        const welcome = document.getElementById('wizWelcomeOverlay');
        if (welcome) welcome.style.display = 'none';
    }
});

// ══════════════════════════════════════════════════════════════
// 🎙️ VOICE ACTION BUTTONS — "קניתי" & "לקנות"
// ══════════════════════════════════════════════════════════════

let _voiceActionRecognition = null;
let _voiceActionMode = null; // 'bought' | 'tobuy'
let _voiceActionActive = false;

function initVoiceAction() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('הדפדפן לא תומך בזיהוי קולי', 'error');
        return null;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    const langMap = { 'he':'he-IL','en':'en-US','ru':'ru-RU','ro':'ro-RO' };
    r.lang = langMap[currentLang] || 'he-IL';
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 3;
    return r;
}

// Fuzzy match — returns best matching item index or -1
function _fuzzyFindItem(transcript, items) {
    const q = transcript.trim().toLowerCase();
    let bestIdx = -1, bestScore = 0;

    items.forEach((item, idx) => {
        const name = item.name.toLowerCase();
        // exact
        if (name === q) { bestIdx = idx; bestScore = 100; return; }
        // contains
        if (name.includes(q) || q.includes(name)) {
            const score = 80 - Math.abs(name.length - q.length);
            if (score > bestScore) { bestScore = score; bestIdx = idx; }
            return;
        }
        // Levenshtein for typos/accent errors
        const lev = _levenshtein(name, q);
        const maxLen = Math.max(name.length, q.length);
        const score = Math.round((1 - lev / maxLen) * 70);
        if (score > bestScore && score >= 50) { bestScore = score; bestIdx = idx; }
    });
    return bestIdx;
}

function _levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

function startVoiceAction(mode) {
    // mode = 'bought' | 'tobuy'
    if (!db.currentId || !db.lists[db.currentId]) {
        showNotification('אין רשימה פעילה', 'error'); return;
    }

    if (_voiceActionActive) {
        _stopVoiceAction(); return;
    }

    _voiceActionMode = mode;
    _voiceActionRecognition = initVoiceAction();
    if (!_voiceActionRecognition) return;

    _voiceActionActive = true;
    _updateVoiceActionBtns(true);

    const label = mode === 'bought' ? '🛒 אמור שם מוצר שקנית...' : '📋 אמור שם מוצר לרשימה...';
    showNotification(label, 'success');

    _voiceActionRecognition.onresult = (e) => {
        // Try all alternatives for best match
        const transcripts = Array.from({length: e.results[0].length}, (_, i) => e.results[0][i].transcript);
        _handleVoiceActionResult(transcripts, mode);
    };

    _voiceActionRecognition.onerror = (e) => {
        _stopVoiceAction();
        if (e.error === 'no-speech') showNotification('לא זוהה דיבור', 'warning');
        else showNotification('שגיאת זיהוי קולי', 'error');
    };

    _voiceActionRecognition.onend = () => { _stopVoiceAction(); };

    try { _voiceActionRecognition.start(); }
    catch(e) { _stopVoiceAction(); }
}

function _stopVoiceAction() {
    _voiceActionActive = false;
    _voiceActionMode = null;
    _updateVoiceActionBtns(false);
    if (_voiceActionRecognition) {
        try { _voiceActionRecognition.stop(); } catch(e) {}
    }
}

function _updateVoiceActionBtns(recording) {
    const boughtBtn = document.getElementById('voiceBoughtBtn');
    const tobuyBtn  = document.getElementById('voiceTobuyBtn');
    if (boughtBtn) boughtBtn.classList.toggle('voice-action-recording', recording && _voiceActionMode === 'bought');
    if (tobuyBtn)  tobuyBtn.classList.toggle('voice-action-recording', recording && _voiceActionMode === 'tobuy');
}

function _handleVoiceActionResult(transcripts, mode) {
    const list = db.lists[db.currentId];
    const items = list.items;

    let bestIdx = -1;
    for (const t of transcripts) {
        bestIdx = _fuzzyFindItem(t, items);
        if (bestIdx !== -1) break;
    }
    const transcript = transcripts[0];

    if (mode === 'bought') {
        if (bestIdx === -1) {
            showNotification(`❌ לא מצאתי "${transcript}" ברשימה`, 'error');
            return;
        }
        const item = items[bestIdx];
        if (item.checked) {
            showNotification(`ℹ️ "${item.name}" כבר מסומן כנרכש`, 'warning');
            return;
        }
        // Mark as bought
        item.checked = true;
        lastCheckedItem = item;
        lastCheckedIdx = bestIdx;
        lastCheckedState = false;
        db.lists[db.currentId].items = sortItemsByStatusAndCategory(items);
        save();
        showUndoCheckNotification(item.name, true);

    } else { // tobuy
        if (bestIdx !== -1) {
            const item = items[bestIdx];
            if (!item.checked) {
                showNotification(`ℹ️ "${item.name}" כבר ברשימה וממתין לרכישה`, 'warning');
            } else {
                // Uncheck — move back to "to buy"
                item.checked = false;
                lastCheckedItem = item;
                lastCheckedIdx = bestIdx;
                lastCheckedState = true;
                db.lists[db.currentId].items = sortItemsByStatusAndCategory(items);
                save();
                showUndoCheckNotification(item.name, false);
            }
        } else {
            // Not found — offer to add
            _showAddItemPrompt(transcript);
        }
    }
}

function _showAddItemPrompt(name) {
    // Use existing toast system with a custom action
    _showToast({
        message: `"${name}" לא ברשימה — להוסיף?`,
        type: 'warning',
        undoCallback: () => _addItemByVoice(name),
        undoLabel: '➕ הוסף',
        duration: 7000
    });
}

function _addItemByVoice(name) {
    const trimmed = name.trim();
    if (!trimmed || !db.currentId) return;
    const category = detectCategory(trimmed);
    db.lists[db.currentId].items.push({
        name: trimmed,
        price: 0,
        qty: 1,
        checked: false,
        category: category,
        note: '',
        dueDate: '',
        paymentUrl: '',
        isPaid: false,
        lastUpdated: Date.now(),
        cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    });
    save();
    showNotification(`✅ "${trimmed}" נוסף לרשימה!`, 'success');
}
// ========== Bank Sync Functions ==========


// ═══════════════════════════════════════════════════════
// 💰 FINANCIAL MODALS — Credit Card + Bank Scraper
// ═══════════════════════════════════════════════════════

let selectedCreditCompany = null;
let selectedBank = null;

const BANK_CONFIG = {
    hapoalim:     { field1: 'userCode',  field1Label: 'קוד משתמש',    field2: null,  field2Label: '',                     hint: 'קוד המשתמש שלך באינטרנט פועלים' },
    leumi:        { field1: 'username',  field1Label: 'שם משתמש',      field2: null,  field2Label: '',                     hint: 'שם המשתמש שלך בלאומי דיגיטל' },
    mizrahi:      { field1: 'username',  field1Label: 'שם משתמש',      field2: null,  field2Label: '',                     hint: '' },
    discount:     { field1: 'id',        field1Label: 'תעודת זהות',     field2: 'num', field2Label: 'מספר סניף (3 ספרות)', hint: 'נדרש: ת"ז + מספר סניף + סיסמה' },
    otsarHahayal: { field1: 'username',  field1Label: 'שם משתמש',      field2: null,  field2Label: '',                     hint: '' },
    yahav:        { field1: 'username',  field1Label: 'שם משתמש',      field2: null,  field2Label: '',                     hint: '' },
    massad:       { field1: 'username',  field1Label: 'שם משתמש',      field2: null,  field2Label: '',                     hint: '' },
    unionBank:    { field1: 'username',  field1Label: 'שם משתמש',      field2: null,  field2Label: '',                     hint: '' },
    beinleumi:    { field1: 'username',  field1Label: 'שם משתמש',      field2: null,  field2Label: '',                     hint: '' },
};

const BANK_NAMES = {
    hapoalim: 'פועלים', leumi: 'לאומי', mizrahi: 'מזרחי',
    discount: 'דיסקונט', otsarHahayal: 'אוצר החייל',
    yahav: 'יהב', massad: 'מסד', unionBank: 'איגוד', beinleumi: 'בינלאומי'
};

const CREDIT_NAMES = { max: 'Max', visaCal: 'Cal', leumincard: 'לאומי קארד', isracard: 'ישראכרט' };

// ── Legacy stub (keep pageBank button working) ──
function openBankModal() { openModal('financialChoiceModal'); }
function closeBankModal() { closeModal('financialChoiceModal'); }
function openBankConnectModal() {
    selectedBank = null;
    document.getElementById('bankField1').value = '';
    document.getElementById('bankConnectPassword').value = '';
    document.getElementById('bankField2').value = '';
    document.getElementById('bankField2Wrap').style.display = 'none';
    document.getElementById('bankField1').placeholder = 'שם משתמש';
    document.getElementById('bankConnectHint').style.display = 'none';
    document.querySelectorAll('#bankConnectModal .fin-btn').forEach(b => b.classList.remove('selected'));
    openModal('bankConnectModal');
}

// ── Credit company selector ──
function selectCreditCompany(id, btn) {
    selectedCreditCompany = id;
    document.querySelectorAll('#creditCardModal .fin-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// ── Bank selector ──
function selectBank(bankId, btn) {
    selectedBank = bankId;
    document.querySelectorAll('#bankConnectModal .fin-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const cfg = BANK_CONFIG[bankId];
    if (!cfg) return;
    document.getElementById('bankField1').placeholder = cfg.field1Label;
    const f2wrap = document.getElementById('bankField2Wrap');
    const f2 = document.getElementById('bankField2');
    if (cfg.field2) {
        f2.placeholder = cfg.field2Label;
        f2wrap.style.display = 'block';
    } else {
        f2wrap.style.display = 'none';
        f2.value = '';
    }
    const hint = document.getElementById('bankConnectHint');
    if (cfg.hint) { hint.textContent = 'ℹ️ ' + cfg.hint; hint.style.display = 'block'; }
    else { hint.style.display = 'none'; }
}

// ── Progress helpers ──
function showFinProgress() {
    const el = document.getElementById('finProgressOverlay');
    if (el) { el.style.display = 'flex'; }
}
function hideFinProgress() {
    const el = document.getElementById('finProgressOverlay');
    if (el) { el.style.display = 'none'; }
}
function setFinStage(step, icon, title, sub, pct) {
    document.getElementById('finProgressIcon').textContent = icon;
    document.getElementById('finProgressTitle').textContent = title;
    document.getElementById('finProgressSub').textContent = sub;
    document.getElementById('finProgressBar').style.width = pct;
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById('finDot' + i);
        const stage = document.getElementById('finStage' + i);
        dot.style.background = i < step ? '#7367f0' : i === step ? '#0ea5e9' : '#f3f4f6';
        dot.style.color = i <= step ? 'white' : '#9ca3af';
        dot.textContent = i < step ? '✓' : String(i);
    }
}

// ── Debug log panel ──
// ── Global debug log ──────────────────────────────────────────────
const _globalDebugLogs = [];
function dbgLog(msg, color) {
    const type = color === '#ff4444' ? 'error' : color === '#ffaa00' ? 'warn' : 'info';
    const icon = color === '#ff4444' ? '🔴' : color === '#ffaa00' ? '🟡' : color === '#22c55e' ? '🟢' : '•';
    _globalDebugLogs.push({ msg, type, icon, time: new Date().toLocaleTimeString('he-IL') });
    showDebugLog(_globalDebugLogs);
}

function showDebugLog(logs) {
    let panel = document.getElementById('debugLogPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'debugLogPanel';
        panel.style.cssText = [
            'position:fixed',
            'bottom:80px',
            'left:8px',
            'right:8px',
            'z-index:99999',
            'background:#1a1a2e',
            'color:#e0e0e0',
            'font-family:monospace',
            'font-size:12px',
            'max-height:42vh',
            'display:flex',
            'flex-direction:column',
            'border:2px solid #e94560',
            'border-radius:12px',
            'overflow:hidden',
            'box-shadow:0 8px 32px rgba(0,0,0,0.6)',
            'touch-action:none',
        ].join(';');

        // ── Header (ידית גרירה) ──
        const header = document.createElement('div');
        header.style.cssText = [
            'display:flex',
            'justify-content:space-between',
            'align-items:center',
            'padding:6px 8px',
            'background:#0f3460',
            'cursor:grab',
            'user-select:none',
            '-webkit-user-select:none',
            'flex-shrink:0',
        ].join(';');

        const title = document.createElement('span');
        title.innerHTML = '⠿ 🐛 Debug Log';
        title.style.cssText = 'color:#e94560;font-weight:bold;font-size:12px;';

        const btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'display:flex;gap:4px;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋';
        copyBtn.title = 'העתק';
        copyBtn.style.cssText = 'background:#1a6b8a;color:white;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px;';
        copyBtn.onclick = () => {
            const c = document.getElementById('debugLogContent');
            if (c) navigator.clipboard?.writeText(c.innerText).then(() => alert('הועתק!'));
        };

        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑';
        clearBtn.title = 'נקה';
        clearBtn.style.cssText = 'background:#555;color:white;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px;';
        clearBtn.onclick = () => {
            _globalDebugLogs.length = 0;
            const c = document.getElementById('debugLogContent');
            if (c) c.innerHTML = '';
        };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'background:#e94560;color:white;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px;';
        closeBtn.onclick = () => { const p = document.getElementById('debugLogPanel'); if (p) p.remove(); };

        btnWrap.appendChild(copyBtn);
        btnWrap.appendChild(clearBtn);
        btnWrap.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(btnWrap);

        // ── Content ──
        const content = document.createElement('div');
        content.id = 'debugLogContent';
        content.style.cssText = 'overflow-y:auto;flex:1;padding:6px 8px;direction:ltr;text-align:left;';

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

        // ── Drag logic (touch + mouse) ──
        let dragging = false, startX, startY, origLeft, origTop, origRight, origBottom;

        function dragStart(clientX, clientY) {
            dragging = true;
            startX = clientX;
            startY = clientY;
            const rect = panel.getBoundingClientRect();
            origLeft = rect.left;
            origTop  = rect.top;
            // עבור ל-left/top מדויק, בטל right
            panel.style.left   = origLeft + 'px';
            panel.style.top    = origTop  + 'px';
            panel.style.right  = 'auto';
            panel.style.bottom = 'auto';
            header.style.cursor = 'grabbing';
        }

        function dragMove(clientX, clientY) {
            if (!dragging) return;
            const dx = clientX - startX;
            const dy = clientY - startY;
            const newLeft = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth,  origLeft + dx));
            const newTop  = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, origTop  + dy));
            panel.style.left = newLeft + 'px';
            panel.style.top  = newTop  + 'px';
        }

        function dragEnd() {
            dragging = false;
            header.style.cursor = 'grab';
        }

        // Touch
        header.addEventListener('touchstart', e => {
            dragStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchmove', e => {
            if (dragging) dragMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchend', dragEnd);

        // Mouse
        header.addEventListener('mousedown', e => {
            dragStart(e.clientX, e.clientY);
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (dragging) dragMove(e.clientX, e.clientY);
        });
        document.addEventListener('mouseup', dragEnd);
    }

    const content = document.getElementById('debugLogContent');
    if (!content) return;
    content.innerHTML = logs.map(l => {
        const color = l.type==='error'?'#ff6b6b':l.type==='warn'?'#ffd93d':l.type==='success'?'#6bcb77':'#a8dadc';
        return `<div style="color:${color};padding:2px 0;border-bottom:1px solid #2a2a4a;">${l.icon||'•'} [${l.time}] ${l.msg}</div>`;
    }).join('');
    content.scrollTop = content.scrollHeight;
}

// ── Shared fetch helper ──
async function runFinancialFetch({ companyId, credentials, modalId, nameLabel }) {
    const debugLogs = [];
    const log = (msg, type='info', icon='•') => {
        debugLogs.push({ msg, type, icon, time: new Date().toLocaleTimeString('he-IL') });
        showDebugLog(debugLogs);
    };

    closeModal(modalId);
    showFinProgress();

    try {
        const user = window.firebaseAuth?.currentUser;
        log(`חברה: ${companyId}`, 'info', '🏦');
        log(`currentUser: ${user ? user.email : 'null'}`, user ? 'success' : 'error', user ? '👤' : '❌');
        if (!user) { hideFinProgress(); showNotification('❌ יש להתחבר לחשבון תחילה', 'error'); return; }

        const userId = user.uid;
        const jobId  = 'job_' + Date.now();

        setFinStage(1, '🔐', 'שולח לסנכרון...', 'מפעיל GitHub Actions', '15%');

        // ── שלח ל-GitHub Actions ──────────────────────────────────
        const GITHUB_TOKEN = window.GITHUB_PAT || '';
        const REPO         = 'ronmailx-boop/Shopping-list';

        if (!GITHUB_TOKEN) {
            log('⚠️ חסר GITHUB_PAT — עיין בהגדרות', 'error', '❌');
            hideFinProgress();
            showNotification('❌ חסר GitHub Token — הגדר GITHUB_PAT', 'error');
            return;
        }

        const payload = {
            event_type: 'bank-sync',
            client_payload: {
                userId,
                jobId,
                companyId,
                username:  credentials.username  || credentials.userCode || '',
                password:  credentials.password  || '',
                userCode:  credentials.userCode  || '',
                id:        credentials.id        || '',
                num:       credentials.num       || '',
            }
        };

        log('שולח ל-GitHub Actions...', 'info', '🚀');
        const ghRes = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept':        'application/vnd.github.v3+json',
                'Content-Type':  'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!ghRes.ok) {
            const errText = await ghRes.text();
            log(`שגיאת GitHub: ${ghRes.status} — ${errText}`, 'error', '❌');
            hideFinProgress();
            showNotification('❌ שגיאת GitHub Actions', 'error');
            return;
        }

        log('GitHub Actions הופעל ✅', 'success', '🚀');
        setFinStage(2, '⏳', 'ממתין לתוצאות...', 'זה לוקח עד 3 דקות', '40%');

        // ── המתן לתוצאות ב-Firestore ─────────────────────────────
        const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const jobRef = doc(window.firebaseDb, 'bankSync', userId, 'jobs', jobId);

        const transactions = await new Promise((resolve, reject) => {
            const TIMEOUT = 8 * 60 * 1000; // 8 דקות
            let settled = false;

            const timer = setTimeout(() => {
                if (!settled) { settled = true; unsubscribe(); reject(new Error('timeout')); }
            }, TIMEOUT);

            const unsubscribe = onSnapshot(jobRef, (snap) => {
                if (!snap.exists()) return;
                const data = snap.data();
                log(`סטטוס: ${data.status}`, 'info', '📊');

                if (data.status === 'running') {
                    setFinStage(2, '🔐', 'מתחבר לבנק...', 'GitHub Actions פועל', '55%');
                }

                if (data.status === 'done') {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timer);
                        unsubscribe();
                        // כל account → אובייקט נפרד עם מספר כרטיס + עסקאות ממוינות
                        const accounts = (data.accounts || []).map(acc => {
                            const txns = (acc.txns || [])
                                .map(t => ({
                                    name:   t.description || 'עסקה',
                                    amount: Math.abs(t.amount || 0),
                                    price:  Math.abs(t.amount || 0),
                                    date:   t.date || '',
                                }))
                                .sort((a, b) => new Date(b.date) - new Date(a.date));
                            return {
                                accountNumber: acc.accountNumber || '',
                                txns,
                            };
                        });
                        const totalTxns = accounts.reduce((s, a) => s + a.txns.length, 0);
                        log(`התקבלו ${totalTxns} עסקאות ב-${accounts.length} כרטיסים ✅`, 'success', '✅');
                        resolve(accounts);
                    }
                }

                if (data.status === 'error') {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timer);
                        unsubscribe();
                        reject(new Error(data.errorMessage || data.errorType || 'שגיאה'));
                    }
                }
            }, (err) => {
                if (!settled) { settled = true; clearTimeout(timer); unsubscribe(); reject(err); }
            });
        });

        // ── הצג סיום ─────────────────────────────────────────────
        setFinStage(3, '⚙️', 'מעבד נתונים...', 'עוד רגע...', '85%');
        await new Promise(r => setTimeout(r, 800));

        document.getElementById('finProgressBar').style.width = '100%';
        document.getElementById('finProgressIcon').textContent = '✅';
        document.getElementById('finProgressTitle').textContent = 'הושלם בהצלחה!';
        document.getElementById('finProgressSub').textContent = `יובאו ${transactions.length} עסקאות`;
        for (let i = 1; i <= 3; i++) {
            document.getElementById('finDot' + i).textContent = '✓';
            document.getElementById('finDot' + i).style.background = '#7367f0';
            document.getElementById('finDot' + i).style.color = 'white';
        }
        await new Promise(r => setTimeout(r, 1000));
        hideFinProgress();

        if (transactions.length > 0) {
            // כל account+חודש מקבל רשימה נפרדת
            const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
            let totalImported = 0;
            transactions.forEach(acc => {
                if (!acc.txns || acc.txns.length === 0) return;
                const cardSuffix = acc.accountNumber ? ` ${acc.accountNumber}` : '';
                // קבץ לפי חודש
                const byMonth = {};
                acc.txns.forEach(t => {
                    const d = new Date(t.date);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (!byMonth[key]) byMonth[key] = { year: d.getFullYear(), month: d.getMonth(), txns: [] };
                    byMonth[key].txns.push(t);
                });
                // מיון מחודש חדש לישן
                Object.values(byMonth)
                    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
                    .forEach(({ year, month, txns }) => {
                        const monthLabel = `${MONTHS_HE[month]} ${year}`;
                        const listName = `${nameLabel}${cardSuffix} - ${monthLabel}`;
                        // מיין עסקאות מחדש לישן
                        txns.sort((a, b) => new Date(b.date) - new Date(a.date));
                        importFinancialTransactions(txns, listName);
                        totalImported += txns.length;
                    });
            });
            if (totalImported === 0) showNotification('ℹ️ לא נמצאו עסקאות', 'warning');
        } else {
            showNotification('ℹ️ לא נמצאו עסקאות', 'warning');
        }

    } catch (err) {
        const msg = err.message === 'timeout' ? 'פסק הזמן — נסה שוב' : err.message;
        log(`שגיאה: ${msg}`, 'error', '💥');
        hideFinProgress();
        showNotification('❌ ' + msg, 'error');
    }
}

// ── Credit card fetch ──
async function startCreditCardFetch() {
    if (!selectedCreditCompany) { showNotification('⚠️ בחר חברת אשראי תחילה', 'warning'); return; }
    const username = document.getElementById('creditUsername').value.trim();
    const password = document.getElementById('creditPassword').value.trim();
    if (!username || !password) { showNotification('⚠️ הזן שם משתמש וסיסמה', 'warning'); return; }
    await runFinancialFetch({
        companyId: selectedCreditCompany,
        credentials: { username, password },
        modalId: 'creditCardModal',
        nameLabel: '💳 ' + (CREDIT_NAMES[selectedCreditCompany] || 'אשראי')
    });
}

// ── Bank fetch ──
async function startBankFetch() {
    if (!selectedBank) { showNotification('⚠️ בחר בנק תחילה', 'warning'); return; }
    const cfg = BANK_CONFIG[selectedBank];
    const field1Val = document.getElementById('bankField1').value.trim();
    const password  = document.getElementById('bankConnectPassword').value.trim();
    const field2Val = document.getElementById('bankField2').value.trim();
    if (!field1Val || !password) { showNotification('⚠️ הזן את כל פרטי ההתחברות', 'warning'); return; }
    if (cfg.field2 && !field2Val) { showNotification('⚠️ ' + cfg.field2Label + ' נדרש', 'warning'); return; }
    const credentials = { password };
    credentials[cfg.field1] = field1Val;
    if (cfg.field2) credentials[cfg.field2] = field2Val;
    await runFinancialFetch({
        companyId: selectedBank,
        credentials,
        modalId: 'bankConnectModal',
        nameLabel: '🏛️ ' + (BANK_NAMES[selectedBank] || 'בנק')
    });
}

// ── Import transactions to list ──
function importFinancialTransactions(transactions, nameLabel) {
    const today = new Date().toLocaleDateString('he-IL');
    const newId = 'L' + Date.now();
    const items = transactions.map(t => ({
        name: t.name || t.description || 'עסקה',
        price: parseFloat(t.amount || t.price || 0),
        qty: 1, checked: false, isPaid: true,
        category: detectCategory(t.name || t.description || ''),
        note: t.date ? '📅 ' + new Date(t.date).toLocaleDateString('he-IL') : '',
        dueDate: '', paymentUrl: '',
        lastUpdated: Date.now(),
        cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }));
    db.lists[newId] = { name: nameLabel + ' - ' + today, url: '', budget: 0, isTemplate: false, items };
    db.currentId = newId;
    activePage = 'lists';
    save();
    showNotification('✅ יובאו ' + items.length + ' רשומות מ' + nameLabel + '!');
}

// ── Dynamic padding for list name bar ──
function adjustContentPadding() {
    const bar = document.getElementById('listNameBar');
    const spacer = document.getElementById('barSpacer');
    if (bar && spacer) {
        const barRect = bar.getBoundingClientRect();
        // גובה הבר + מיקומו מהחלק העליון של הדף
        const totalHeight = barRect.bottom + 8;
        spacer.style.height = totalHeight + 'px';
        document.documentElement.style.setProperty('--lnb-height', barRect.height + 'px');
    }
}

// ResizeObserver — עוקב אחרי גובה הבר בזמן אמת
(function initBarObserver() {
    const bar = document.getElementById('listNameBar');
    if (!bar) { setTimeout(initBarObserver, 100); return; }
    const observer = new ResizeObserver(() => adjustContentPadding());
    observer.observe(bar);
    adjustContentPadding();
    // רץ שוב אחרי טעינת פונטים
    setTimeout(adjustContentPadding, 100);
    setTimeout(adjustContentPadding, 400);
    setTimeout(adjustContentPadding, 800);
})();

// ── Compact Mode ──


// ════════════════════════════════════════════════
// ✏️ סדר רשימות — Edit Mode
// ════════════════════════════════════════════════
function toggleListEditMode() {
    listEditMode = !listEditMode;
    const btn = document.getElementById('listEditModeBtn');
    if (btn) {
        btn.textContent = listEditMode ? '✅ סיום' : '✏️ סדר רשימות';
        btn.style.background = listEditMode ? '#7367f0' : 'rgba(115,103,240,0.08)';
        btn.style.color = listEditMode ? '#fff' : '#7367f0';
        btn.style.borderColor = listEditMode ? '#7367f0' : 'rgba(115,103,240,0.25)';
    }
    render();
    if (listEditMode) setupListDrag();
}

function reorderLists(fromId, toId) {
    const keys = Object.keys(db.lists);
    const fi = keys.indexOf(fromId), ti = keys.indexOf(toId);
    if (fi === -1 || ti === -1) return;
    keys.splice(fi, 1);
    keys.splice(ti, 0, fromId);
    const newLists = {};
    keys.forEach(k => newLists[k] = db.lists[k]);
    db.lists = newLists;
    save();
}

let _listDragAbort = null;
function setupListDrag() {
    const container = document.getElementById('summaryContainer');
    if (!container) return;
    if (_listDragAbort) { _listDragAbort.abort(); }
    _listDragAbort = new AbortController();
    const sig = _listDragAbort.signal;

    let src = null, ghost = null, ox = 0, oy = 0, didDrag = false, startY = 0;

    function mkGhost(item) {
        const g = document.createElement('div');
        g.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;background:#fff;border:2px solid #7367f0;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;box-shadow:0 12px 40px rgba(115,103,240,0.4);direction:rtl;transform:rotate(1.5deg) scale(1.03);font-family:inherit;';
        const name = item.querySelector('.font-bold.cursor-pointer')?.textContent?.trim() || '';
        g.innerHTML = '<span style="font-size:15px;font-weight:700;color:#1a1a2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + name + '</span>';
        document.body.appendChild(g);
        return g;
    }

    container.addEventListener('touchstart', e => {
        const handle = e.target.closest('[data-drag]');
        if (!handle || !listEditMode) return;
        const item = handle.closest('.item-card');
        if (!item) return;
        const rect = item.getBoundingClientRect(), t = e.touches[0];
        ox = t.clientX - rect.left; oy = t.clientY - rect.top;
        startY = t.clientY; didDrag = false;
        src = item; src.style.opacity = '0.35';
        ghost = mkGhost(item);
        ghost.style.width = rect.width + 'px';
        ghost.style.top = (t.clientY - oy) + 'px';
        ghost.style.left = rect.left + 'px';
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchmove', e => {
        if (!src || !ghost) return;
        const t = e.touches[0];
        if (Math.abs(t.clientY - startY) > 5) didDrag = true;
        ghost.style.top = (t.clientY - oy) + 'px';
        container.querySelectorAll('.item-card').forEach(el => el.style.outline = '');
        container.querySelectorAll('.item-card').forEach(el => {
            const r = el.getBoundingClientRect();
            if (el !== src && t.clientY > r.top && t.clientY < r.bottom)
                el.style.outline = '2px solid #7367f0';
        });
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchend', e => {
        if (!src) return;
        if (ghost) { ghost.remove(); ghost = null; }
        const t = e.changedTouches[0];
        let target = null;
        container.querySelectorAll('.item-card').forEach(el => {
            el.style.outline = '';
            const r = el.getBoundingClientRect();
            if (el !== src && t.clientY > r.top && t.clientY < r.bottom) target = el;
        });
        if (didDrag && target) {
            reorderLists(src.dataset.id, target.dataset.id);
        } else {
            src.style.opacity = '';
            if (didDrag) container.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true });
        }
        src = null; didDrag = false;
    }, { signal: sig });
}

// ════════════════════════════════════════════════
// ✏️ סדר מוצרים — Item Edit Mode
// ════════════════════════════════════════════════
function toggleItemEditMode() {
    itemEditMode = !itemEditMode;
    const btn = document.getElementById('itemEditModeBtn');
    if (btn) {
        btn.textContent = itemEditMode ? '✅ סיום' : '✏️ סדר מוצרים';
        btn.style.background = itemEditMode ? '#7367f0' : 'rgba(115,103,240,0.08)';
        btn.style.color = itemEditMode ? '#fff' : '#7367f0';
        btn.style.borderColor = itemEditMode ? '#7367f0' : 'rgba(115,103,240,0.25)';
    }
    render();
    if (itemEditMode) setupItemDrag();
}

let _itemDragAbort = null;
function setupItemDrag() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    if (_itemDragAbort) { _itemDragAbort.abort(); }
    _itemDragAbort = new AbortController();
    const sig = _itemDragAbort.signal;

    let src = null, ghost = null, ox = 0, oy = 0, didDrag = false, startY = 0, srcIdx = -1;

    function mkGhost(item) {
        const g = document.createElement('div');
        g.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;background:#fff;border:2px solid #7367f0;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;box-shadow:0 12px 40px rgba(115,103,240,0.4);direction:rtl;transform:rotate(1.5deg) scale(1.03);font-family:inherit;';
        const nameEl = item.querySelector('.font-bold');
        const name = nameEl ? nameEl.textContent.trim() : '';
        g.innerHTML = '<span style="font-size:15px;font-weight:700;color:#1a1a2e;">' + name + '</span>';
        document.body.appendChild(g);
        return g;
    }

    container.addEventListener('touchstart', e => {
        const handle = e.target.closest('[data-drag]');
        if (!handle || !itemEditMode) return;
        const item = handle.closest('.item-card');
        if (!item) return;
        const rect = item.getBoundingClientRect(), t = e.touches[0];
        ox = t.clientX - rect.left; oy = t.clientY - rect.top;
        startY = t.clientY; didDrag = false;
        srcIdx = parseInt(item.dataset.idx);
        src = item; src.style.opacity = '0.35';
        ghost = mkGhost(item);
        ghost.style.width = rect.width + 'px';
        ghost.style.top = (t.clientY - oy) + 'px';
        ghost.style.left = rect.left + 'px';
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchmove', e => {
        if (!src || !ghost) return;
        const t = e.touches[0];
        if (Math.abs(t.clientY - startY) > 5) didDrag = true;
        ghost.style.top = (t.clientY - oy) + 'px';
        container.querySelectorAll('.item-card').forEach(el => el.style.outline = '');
        container.querySelectorAll('.item-card').forEach(el => {
            const r = el.getBoundingClientRect();
            if (el !== src && t.clientY > r.top && t.clientY < r.bottom)
                el.style.outline = '2px solid #7367f0';
        });
        e.preventDefault();
    }, { passive: false, signal: sig });

    document.addEventListener('touchend', e => {
        if (!src) return;
        if (ghost) { ghost.remove(); ghost = null; }
        const t = e.changedTouches[0];
        let toIdx = -1;
        container.querySelectorAll('.item-card').forEach(el => {
            el.style.outline = '';
            if (el === src) return;
            const r = el.getBoundingClientRect();
            if (t.clientY > r.top && t.clientY < r.bottom) toIdx = parseInt(el.dataset.idx);
        });
        if (didDrag && toIdx !== -1 && toIdx !== srcIdx) {
            const items = db.lists[db.currentId].items;
            const [moved] = items.splice(srcIdx, 1);
            items.splice(toIdx, 0, moved);
            save();
        } else {
            src.style.opacity = '';
            if (didDrag) container.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true });
        }
        src = null; srcIdx = -1; didDrag = false;
    }, { signal: sig });
}

// ════════════════════════════════════════════════
// 📊 הצג סכום ב-compact mode
// ════════════════════════════════════════════════
function toggleCompactStats() {
    compactStatsOpen = !compactStatsOpen;
    const btn1 = document.getElementById('summaryStatsBtn');
    const btn2 = document.getElementById('listsStatsBtn');
    const label = compactStatsOpen ? '✕ הסתר סכום' : '📊 הצג סכום';
    const bgActive = compactStatsOpen ? '#7367f0' : 'rgba(115,103,240,0.08)';
    const colActive = compactStatsOpen ? '#fff' : '#7367f0';
    [btn1, btn2].forEach(b => { if (b) { b.textContent = label; b.style.background = bgActive; b.style.color = colActive; } });

    const tabsWrap = document.getElementById('tabsRowWrap');
    const statsRow = document.getElementById('barStatsRow');
    if (compactStatsOpen) {
        if (tabsWrap) tabsWrap.style.display = 'none';
        if (statsRow) { statsRow.style.display = 'flex'; statsRow.style.padding = '10px 12px 18px'; }
    } else {
        _restoreCompactTabs();
    }
}

function _restoreCompactTabs() {
    const tabsWrap = document.getElementById('tabsRowWrap');
    if (tabsWrap) tabsWrap.style.display = '';
    const statsRow = document.getElementById('barStatsRow');
    if (statsRow) statsRow.style.display = 'none';
    const btn1 = document.getElementById('summaryStatsBtn');
    const btn2 = document.getElementById('listsStatsBtn');
    [btn1, btn2].forEach(b => { if (b) { b.textContent = '📊 הצג סכום'; b.style.background = 'rgba(115,103,240,0.08)'; b.style.color = '#7367f0'; } });
    compactStatsOpen = false;
}

function toggleCompactMode() {
    compactMode = !compactMode;
    expandedItemIdx = -1;
    compactActionsOpen = false;

    const btn        = document.getElementById('compactModeBtn');
    const plusWrap   = document.getElementById('compactPlusWrap');
    const actionsRow = document.getElementById('compactActionsRow');
    const barActions = document.getElementById('barActionsRow');
    const barStats   = document.getElementById('barStatsRow');
    const tabsRow    = document.getElementById('tabsRowWrap');
    const bar        = document.getElementById('smartBottomBar');

    if (compactMode) {
        if (btn) { btn.style.background = 'rgba(255,255,255,0.4)'; btn.style.borderColor = 'white'; }
        const itemEditWrap = document.getElementById('itemEditModeWrap');
        if (itemEditWrap) itemEditWrap.style.display = 'flex';
        const summaryBtns = document.getElementById('summaryCompactBtns');
        if (summaryBtns) summaryBtns.style.display = 'flex';
        if (barActions) barActions.style.display = 'none';
        if (barStats)   barStats.style.display   = 'none';
        if (tabsRow)    tabsRow.style.display     = 'block';
        if (actionsRow) actionsRow.style.display  = 'none';
        if (plusWrap)   plusWrap.style.display    = 'block';
        if (bar)        bar.style.overflow        = 'hidden';
    } else {
        if (btn) { btn.style.background = 'rgba(255,255,255,0.2)'; btn.style.borderColor = 'rgba(255,255,255,0.3)'; }
        const itemEditWrapOff = document.getElementById('itemEditModeWrap');
        if (itemEditWrapOff) { itemEditWrapOff.style.display = 'none'; itemEditMode = false; }
        const summaryBtnsOff = document.getElementById('summaryCompactBtns');
        if (summaryBtnsOff) summaryBtnsOff.style.display = 'none';
        if (compactStatsOpen) { compactStatsOpen = false; _restoreCompactTabs(); }
        if (barActions) { barActions.style.display = 'flex'; barActions.style.padding = '10px 12px 18px'; }
        if (barStats)   barStats.style.display   = 'none';
        if (plusWrap)   plusWrap.style.display   = 'none';
        if (actionsRow) actionsRow.style.display = 'none';
        if (tabsRow)    tabsRow.style.display    = 'block';
        if (bar)        bar.style.overflow       = 'hidden';
    }
    render();
}

function handleCompactPlus() {
    const page = (typeof activePage !== 'undefined') ? activePage : 'lists';
    if (page === 'summary') {
        // רשימות שלי — רשימה חדשה
        if (typeof wizardMode !== 'undefined' && wizardMode) {
            wiz('newList', 'before', () => openModal('newListModal'));
        } else {
            openModal('newListModal');
        }
    } else {
        // רשימה שלי — פתח actions
        compactActionsOpen = true;
        const actionsRow = document.getElementById('compactActionsRow');
        const tabsRow    = document.getElementById('tabsRowWrap');
        const plusWrap   = document.getElementById('compactPlusWrap');
        const bar        = document.getElementById('smartBottomBar');
        if (tabsRow)    tabsRow.style.display    = 'none';
        if (actionsRow) actionsRow.style.display = 'flex';
        if (plusWrap)   plusWrap.style.display   = 'none';
        if (bar)        bar.style.overflow       = 'visible';
    }
}

function closeCompactActions() {
    compactActionsOpen = false;
    const actionsRow = document.getElementById('compactActionsRow');
    const tabsRow    = document.getElementById('tabsRowWrap');
    const plusWrap   = document.getElementById('compactPlusWrap');
    const bar        = document.getElementById('smartBottomBar');
    if (actionsRow) actionsRow.style.display = 'none';
    if (tabsRow)    tabsRow.style.display    = 'block';
    if (plusWrap)   plusWrap.style.display   = 'block';
    if (bar)        bar.style.overflow       = 'hidden';
}

function toggleCompactActions() { handleCompactPlus(); }
function _resetCompactPlusIcon() {}

// ── Legacy startBankSync stub ──
async function startBankSync() { startBankFetch(); }

function renderBankData() {
    const container = document.getElementById('bankDataContainer');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-gray-400 py-10 bg-white rounded-3xl shadow-sm border border-gray-100"><span class="text-5xl block mb-4">🏦</span><p class="font-medium">השתמש בכפתור פיננסי לשליפת נתונים.</p></div>';
}



// ══ LIST NAME BAR — ACTIONS PANEL ══
let _listPanelOpen = false;

function _positionActionsPanel() {
    const bar   = document.getElementById('listNameBar');
    const panel = document.getElementById('listActionsPanel');
    if (!bar || !panel) return;
    const rect = bar.getBoundingClientRect();
    panel.style.top = rect.bottom + 'px';
}

function toggleListActionsPanel() {
    _listPanelOpen ? closeListActionsPanel() : openListActionsPanel();
}

function openListActionsPanel() {
    _listPanelOpen = true;
    _positionActionsPanel();
    const panel = document.getElementById('listActionsPanel');
    const arrow = document.getElementById('lnbArrow');
    if (panel) panel.classList.add('open');
    if (arrow) arrow.classList.add('open');
}

function closeListActionsPanel() {
    _listPanelOpen = false;
    const panel = document.getElementById('listActionsPanel');
    const arrow = document.getElementById('lnbArrow');
    if (panel) panel.classList.remove('open');
    if (arrow) arrow.classList.remove('open');
}

// עדכון מיקום הפאנל והבר לפי גובה ה-header בפועל
function _positionListNameBar() {
    const header = document.querySelector('.app-header');
    const bar    = document.getElementById('listNameBar');
    if (!header || !bar) return;
    const headerBottom = header.getBoundingClientRect().bottom;
    bar.style.top = headerBottom + 'px';
    if (_listPanelOpen) _positionActionsPanel();
}

window.addEventListener('resize', _positionListNameBar);
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(_positionListNameBar, 100);
});
setTimeout(_positionListNameBar, 300);

// סגירה בלחיצה מחוץ לפאנל
document.addEventListener('click', function(e) {
    if (!_listPanelOpen) return;
    const arrow  = document.getElementById('lnbArrow');
    const panel  = document.getElementById('listActionsPanel');
    if (arrow && !arrow.contains(e.target) && panel && !panel.contains(e.target)) {
        closeListActionsPanel();
    }
});

// ── עדכון תווית כפתור + לפי טאב ──
function _updatePlusBtnLabel() {
    const lbl = document.getElementById('plusBtnLabel');
    if (!lbl) return;
    lbl.textContent = (activePage === 'summary') ? 'רשימה חדשה' : 'הוסף מוצר';
}

// Hook into showPage
const _origShowPage = window.showPage || null;
if (typeof showPage === 'function') {
    const __origShowPage = showPage;
    window.showPage = function(p) {
        __origShowPage(p);
        _updatePlusBtnLabel();
    };
}
// Init on load
document.addEventListener('DOMContentLoaded', _updatePlusBtnLabel);
setTimeout(_updatePlusBtnLabel, 500);



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
                db.categoryMemory[productName] = '׳׳—׳¨';
            }
        });
    }

    // Update all items in all lists that have this category
    Object.keys(db.lists).forEach(listId => {
        db.lists[listId].items.forEach(item => {
            if (item.category === categoryName) {
                item.category = '׳׳—׳¨';
            }
        });
    });

    // Update items in history
    if (db.history && db.history.length > 0) {
        db.history.forEach(entry => {
            entry.items.forEach(item => {
                if (item.category === categoryName) {
                    item.category = '׳׳—׳¨';
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
    showNotification(`ג… ׳”׳§׳˜׳’׳•׳¨׳™׳” '${categoryName}' ׳ ׳׳—׳§׳”`);
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
            option.textContent = `ג¨ ${customCat}`;
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
    showNotification('נ’¾ ׳”׳ ׳×׳•׳ ׳™׳ ׳™׳•׳¦׳׳• ׳‘׳”׳¦׳׳—׳”!');
    closeModal('settingsModal');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm('׳”׳׳ ׳׳©׳—׳–׳¨ ׳׳× ׳›׳ ׳”׳ ׳×׳•׳ ׳™׳? ׳₪׳¢׳•׳׳” ׳–׳• ׳×׳“׳¨׳•׳¡ ׳׳× ׳”׳ ׳×׳•׳ ׳™׳ ׳”׳ ׳•׳›׳—׳™׳™׳!')) {
                db = importedData;
                save();
                showNotification('ג… ׳”׳ ׳×׳•׳ ׳™׳ ׳©׳•׳—׳–׳¨׳• ׳‘׳”׳¦׳׳—׳”!');
                closeModal('settingsModal');
            }
        } catch (err) {
            alert('׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥.');
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

    console.error(`ג [${context}] ׳©׳’׳™׳׳” ׳׳₪׳•׳¨׳˜׳×:`, {
        code: errorCode,
        message: errorMessage,
        fullError: error
    });

    let errorTitle = context;
    let userMessage = '';

    // Handle common Firebase Auth errors
    if (errorCode.includes('auth/')) {
        if (errorCode === 'auth/unauthorized-domain') {
            errorTitle = "ג ן¸ ׳”׳“׳•׳׳™׳™׳ ׳׳ ׳׳•׳¨׳©׳”";
            userMessage = `׳”׳“׳•׳׳™׳™׳ ׳”׳–׳” ׳׳ ׳׳•׳¨׳©׳” ׳׳”׳×׳—׳‘׳¨׳•׳× ׳‘-Firebase.

׳¦׳¢׳“׳™׳ ׳׳₪׳×׳¨׳•׳:
1. ׳₪׳×׳— ׳׳× Firebase Console
2. ׳¢׳‘׳•׳¨ ׳: Authentication ג†’ Settings
3. ׳’׳׳•׳ ׳: Authorized domains
4. ׳”׳•׳¡׳£ ׳׳× ׳”׳“׳•׳׳™׳™׳: ${window.location.hostname}`;
        } else if (errorCode === 'auth/operation-not-allowed') {
            errorTitle = "ג ן¸ Google Sign-In ׳׳ ׳׳•׳₪׳¢׳";
            userMessage = `׳©׳™׳˜׳× ׳”׳”׳×׳—׳‘׳¨׳•׳× ׳©׳ Google ׳׳ ׳׳•׳₪׳¢׳׳×.

׳¦׳¢׳“׳™׳ ׳׳₪׳×׳¨׳•׳:
1. ׳₪׳×׳— Firebase Console
2. ׳¢׳‘׳•׳¨ ׳: Authentication ג†’ Sign-in method
3. ׳׳¦׳ ׳׳× "Google" ׳‘׳¨׳©׳™׳׳”
4. ׳׳—׳¥ ׳¢׳׳™׳• ׳•׳׳₪׳©׳¨ ׳׳•׳×׳• (Enable)`;
        } else if (errorCode === 'auth/popup-blocked') {
            errorTitle = "ג ן¸ ׳—׳׳•׳ ׳ ׳—׳¡׳";
            userMessage = "׳”׳“׳₪׳“׳₪׳ ׳—׳¡׳ ׳׳× ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳×.\n\n׳׳₪׳©׳¨ ׳—׳׳•׳ ׳•׳× ׳§׳•׳₪׳¦׳™׳ ׳׳׳×׳¨ ׳–׳”.";
        } else if (errorCode === 'auth/network-request-failed') {
            errorTitle = "ג ן¸ ׳‘׳¢׳™׳™׳× ׳¨׳©׳×";
            userMessage = "׳׳ ׳ ׳™׳×׳ ׳׳”׳×׳—׳‘׳¨ ׳׳©׳¨׳×׳™ Firebase.\n\n׳‘׳“׳•׳§ ׳׳× ׳”׳—׳™׳‘׳•׳¨ ׳׳׳™׳ ׳˜׳¨׳ ׳˜.";
        } else {
            userMessage = `׳§׳•׳“ ׳©׳’׳™׳׳”: ${errorCode}\n\n${errorMessage}`;
        }
    }
    // Handle Firestore errors  
    else if (errorCode.includes('permission-denied')) {
        errorTitle = "ג ן¸ ׳׳™׳ ׳”׳¨׳©׳׳”";
        userMessage = '׳׳™׳ ׳”׳¨׳©׳׳” ׳׳’׳©׳× ׳׳ ׳×׳•׳ ׳™׳.\n\n׳‘׳“׳•׳§ ׳”׳’׳“׳¨׳•׳× Firebase Security Rules.';
    }
    else if (errorCode.includes('unavailable')) {
        errorTitle = "ג ן¸ ׳©׳™׳¨׳•׳× ׳׳ ׳–׳׳™׳";
        userMessage = '׳”׳©׳™׳¨׳•׳× ׳׳ ׳–׳׳™׳ ׳›׳¨׳’׳¢.\n\n׳ ׳¡׳” ׳©׳•׳‘ ׳׳׳•׳—׳¨ ׳™׳•׳×׳¨.';
    }
    else {
        userMessage = `׳§׳•׳“: ${errorCode}\n\n${errorMessage}`;
    }

    // Show visual error if function exists
    if (typeof window.showFirebaseError === 'function') {
        window.showFirebaseError(errorTitle, userMessage);
    } else {
        // Fallback to notification
        showNotification(`ג ${errorTitle}\n\n${userMessage}`, 'error');
    }
}

// Wait for Firebase to load before initializing
const checkFirebase = setInterval(() => {
    if (window.firebaseAuth) {
        clearInterval(checkFirebase);
        console.log('ג… Firebase ׳–׳׳™׳, ׳׳׳×׳—׳...');
        initFirebaseAuth();

        // NOTE: redirect result is checked in index.html script
        // We don't check it again here to avoid duplicate checks
    }
}, 100);

// Timeout check to warn user if firebase doesn't load
setTimeout(() => {
    if (!window.firebaseAuth) {
        console.warn("ג ן¸ Firebase ׳׳ ׳ ׳˜׳¢׳ ׳׳—׳¨׳™ 10 ׳©׳ ׳™׳•׳×");
        showNotification('ג ן¸ ׳©׳™׳¨׳•׳× ׳”׳¢׳ ׳ ׳׳ ׳–׳׳™׳ - ׳˜׳¢׳ ׳׳—׳“׳© ׳׳× ׳”׳“׳£', 'warning');
        if (typeof window.showFirebaseError === 'function') {
            window.showFirebaseError(
                'ג ן¸ Firebase ׳׳ ׳ ׳˜׳¢׳',
                '׳©׳™׳¨׳•׳× ׳”׳¢׳ ׳ ׳׳ ׳”׳¦׳׳™׳— ׳׳”׳™׳˜׳¢׳.\n\n׳ ׳¡׳” ׳׳¨׳¢׳ ׳ ׳׳× ׳”׳“׳£ (F5).'
            );
        }
    }
}, 10000);

function initFirebaseAuth() {
    console.log('נ”„ ׳׳׳×׳—׳ Firebase Auth...');

    window.onAuthStateChanged(window.firebaseAuth, (user) => {
        currentUser = user;
        isConnected = !!user;

        console.log('נ‘₪ ׳׳¦׳‘ ׳׳©׳×׳׳©:', user ? `׳׳—׳•׳‘׳¨: ${user.email} (UID: ${user.uid})` : '׳׳ ׳•׳×׳§');

        // Update UI
        updateCloudIndicator(user ? 'connected' : 'disconnected');

        const emailDisplay = document.getElementById('userEmailDisplay');
        const logoutBtn = document.getElementById('logoutBtn');

        // Update email display in settings
        if (emailDisplay) {
            emailDisplay.textContent = user ? `׳׳—׳•׳‘׳¨ ׳›: ${user.email}` : '׳׳ ׳׳—׳•׳‘׳¨';
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
            console.log("ג… ׳׳©׳×׳׳© ׳׳—׳•׳‘׳¨:", user.email, "UID:", user.uid);
            setupFirestoreListener(user);
        } else {
            console.log("ג ן¸ ׳׳™׳ ׳׳©׳×׳׳© ׳׳—׳•׳‘׳¨");
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
        showNotification('ג³ ׳©׳™׳¨׳•׳× ׳”׳¢׳ ׳ ׳¢׳“׳™׳™׳ ׳ ׳˜׳¢׳... ׳ ׳¡׳” ׳©׳•׳‘ ׳‘׳¢׳•׳“ ׳¨׳’׳¢', 'warning');
        console.warn('ג ן¸ Firebase Auth ׳׳ ׳–׳׳™׳');
        return;
    }

    if (!window.googleProvider) {
        showNotification('ג ן¸ Google provider ׳׳ ׳–׳׳™׳', 'warning');
        console.warn('ג ן¸ Google Provider ׳׳ ׳–׳׳™׳');
        return;
    }

    // Check if already logged in
    if (window.firebaseAuth.currentUser) {
        showNotification('ג… ׳׳×׳” ׳›׳‘׳¨ ׳׳—׳•׳‘׳¨', 'success');
        console.log('ג„¹ן¸ ׳׳©׳×׳׳© ׳›׳‘׳¨ ׳׳—׳•׳‘׳¨:', window.firebaseAuth.currentUser.email);
        openModal('settingsModal'); // Show settings instead
        return;
    }

    console.log('נ” ׳׳×׳—׳™׳ ׳×׳”׳׳™׳ ׳”׳×׳—׳‘׳¨׳•׳× Google...');
    console.log('נ” Auth:', window.firebaseAuth ? '׳–׳׳™׳' : '׳׳ ׳–׳׳™׳');
    console.log('נ” Provider:', window.googleProvider ? '׳–׳׳™׳' : '׳׳ ׳–׳׳™׳');
    updateCloudIndicator('syncing');

    // Use signInWithRedirect for GitHub Pages, signInWithPopup for Firebase domains
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        // GitHub Pages - use Redirect (Popup is blocked)
        console.log('נ” GitHub Pages detected - using Redirect...');
        showNotification('ג³ ׳׳¢׳‘׳™׳¨ ׳׳“׳£ ׳”׳”׳×׳—׳‘׳¨׳•׳× ׳©׳ Google...', 'success');
        window.signInWithRedirect(window.firebaseAuth, window.googleProvider)
            .catch((error) => {
                console.error("ג ׳©׳’׳™׳׳× ׳”׳×׳—׳‘׳¨׳•׳×:", error);
                showDetailedError('Login', error);
                updateCloudIndicator('disconnected');
            });
    } else {
        // Firebase domains - use Popup (faster UX)
        console.log('נ” Firebase domain detected - using Popup...');
        window.signInWithPopup(window.firebaseAuth, window.googleProvider)
            .then((result) => {
                console.log('ג… ׳”׳×׳—׳‘׳¨׳•׳× ׳”׳¦׳׳™׳—׳”!', result.user.email);
                showNotification('ג… ׳”׳×׳—׳‘׳¨׳× ׳‘׳”׳¦׳׳—׳”!', 'success');
                currentUser = result.user;
                isConnected = true;
                updateCloudIndicator('connected');
                setupFirestoreListener(result.user);
            })
            .catch((error) => {
                console.error("ג ׳©׳’׳™׳׳× ׳”׳×׳—׳‘׳¨׳•׳×:", error);
                console.error("ג ׳§׳•׳“ ׳©׳’׳™׳׳”:", error.code);
                console.error("ג ׳”׳•׳“׳¢׳× ׳©׳’׳™׳׳”:", error.message);
                
                if (error.code === 'auth/popup-closed-by-user') {
                    console.log('ג„¹ן¸ ׳”׳׳©׳×׳׳© ׳¡׳’׳¨ ׳׳× ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳×');
                    showNotification('ג„¹ן¸ ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳× ׳ ׳¡׳’׳¨', 'warning');
                } else if (error.code === 'auth/cancelled-popup-request') {
                    console.log('ג„¹ן¸ ׳‘׳§׳©׳× popup ׳‘׳•׳˜׳׳”');
                    showNotification('ג„¹ן¸ ׳”׳”׳×׳—׳‘׳¨׳•׳× ׳‘׳•׳˜׳׳”', 'warning');
                } else if (error.code === 'auth/popup-blocked') {
                    console.log('ג ן¸ ׳”׳“׳₪׳“׳₪׳ ׳—׳¡׳ ׳׳× ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳×');
                    showNotification('ג ן¸ ׳”׳“׳₪׳“׳₪׳ ׳—׳¡׳ ׳׳× ׳—׳׳•׳ ׳”׳”׳×׳—׳‘׳¨׳•׳×', 'warning');
                } else {
                    showDetailedError('Login', error);
                }
                updateCloudIndicator('disconnected');
            });
    }
}

function logoutFromCloud() {
    if (!window.firebaseAuth) {
        showNotification('ג ן¸ ׳©׳™׳¨׳•׳× ׳”׳¢׳ ׳ ׳׳ ׳–׳׳™׳', 'warning');
        console.warn('ג ן¸ Firebase Auth ׳׳ ׳–׳׳™׳ ׳׳”׳×׳ ׳×׳§׳•׳×');
        return;
    }

    console.log('נ× ׳׳×׳ ׳×׳§ ׳׳”׳¢׳ ׳...');
    updateCloudIndicator('syncing');

    window.signOut(window.firebaseAuth).then(() => {
        currentUser = null;
        isConnected = false;
        console.log('ג… ׳”׳×׳ ׳×׳§׳•׳× ׳”׳•׳©׳׳׳”');
        showNotification('נ‘‹ ׳”׳×׳ ׳×׳§׳× ׳׳”׳¢׳ ׳', 'success');
        updateCloudIndicator('disconnected');
        closeModal('settingsModal');
    }).catch((error) => {
        console.error("ג ׳©׳’׳™׳׳× ׳”׳×׳ ׳×׳§׳•׳×:", error);
        showDetailedError('Logout', error);
        updateCloudIndicator('connected'); // Revert to connected state
    });
}

function updateCloudIndicator(status) {
    const indicator = document.getElementById('cloudIndicator');
    const text = document.getElementById('cloudSyncText');
    const cloudBtn = document.getElementById('cloudBtn');

    if (!indicator || !cloudBtn) {
        console.warn('ג ן¸ ׳׳ ׳ ׳׳¦׳׳• ׳׳׳׳ ׳˜׳™׳ ׳©׳ ׳›׳₪׳×׳•׳¨ ׳”׳¢׳ ׳');
        return;
    }

    console.log('נ”„ ׳׳¢׳“׳›׳ ׳׳™׳ ׳“׳™׳§׳˜׳•׳¨ ׳¢׳ ׳:', status, '׳׳©׳×׳׳©:', currentUser ? currentUser.email : '׳׳™׳');

    if (status === 'connected') {
        // Green indicator - connected successfully
        indicator.className = 'w-2 h-2 bg-green-500 rounded-full';

        // Update button style to green (connected style)
        cloudBtn.className = 'cloud-btn-connected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';

        // Show short status instead of full email to save space
        if (text) text.textContent = "׳׳—׳•׳‘׳¨ ג…";
    } else if (status === 'syncing') {
        // Yellow indicator - syncing in progress with pulse animation
        indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
        cloudBtn.className = 'cloud-btn-syncing px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = "׳׳¡׳ ׳›׳¨׳...";
    } else {
        // Red indicator - disconnected state
        indicator.className = 'w-2 h-2 bg-red-400 rounded-full';
        cloudBtn.className = 'cloud-btn-disconnected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = "׳׳ ׳•׳×׳§";
    }
}

function setupFirestoreListener(user) {
    console.log('נ“¡ ׳׳’׳“׳™׳¨ Firestore listener ׳¢׳‘׳•׳¨ UID:', user.uid);

    const userDocRef = window.doc(window.firebaseDb, "shopping_lists", user.uid);

    unsubscribeSnapshot = window.onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            console.log('ג˜ן¸ ׳׳¡׳׳ ׳ ׳׳¦׳ ׳‘׳¢׳ ׳');
            const cloudData = docSnap.data();

            // ׳‘׳“׳™׳§׳”: ׳׳ ׳”׳¢׳ ׳ ׳¨׳™׳§ ׳׳‘׳ ׳™׳© ׳ ׳×׳•׳ ׳™׳ ׳׳§׳•׳׳™׳™׳, ׳”׳¢׳׳” ׳׳•׳×׳ ׳׳¢׳ ׳
            const cloudIsEmpty = !cloudData.lists || Object.keys(cloudData.lists).length === 0;
            const localHasData = db.lists && Object.keys(db.lists).length > 0;

            if (cloudIsEmpty && localHasData) {
                console.log('ג˜ן¸ ׳”׳¢׳ ׳ ׳¨׳™׳§ ׳׳‘׳ ׳™׳© ׳ ׳×׳•׳ ׳™׳ ׳׳§׳•׳׳™׳™׳ - ׳׳¢׳׳” ׳׳¢׳ ׳');
                syncToCloud();
                return;
            }

            // ׳׳™׳–׳•׳’ ׳—׳›׳: ׳”׳¢׳ ׳ ׳”׳•׳ ׳׳§׳•׳¨ ׳”׳׳׳× ׳׳׳—׳™׳§׳•׳×
            if (JSON.stringify(cloudData) !== JSON.stringify(db)) {
                console.log('נ”„ ׳׳‘׳¦׳¢ ׳¡׳ ׳›׳¨׳•׳ ׳—׳›׳ ׳׳”׳¢׳ ׳...');
                const mergedDb = mergeCloudWithLocal(cloudData, db);

                // ׳”׳’׳ ׳”: ׳•׳•׳“׳ ׳©׳§׳™׳™׳ ׳׳•׳‘׳™׳™׳§׳˜ ׳¨׳©׳™׳׳•׳×
                if (!mergedDb.lists || Object.keys(mergedDb.lists).length === 0) {
                    mergedDb.lists = {
                        'L1': {
                            name: '׳”׳¨׳©׳™׳׳” ׳©׳׳™',
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
                showNotification('ג˜ן¸ ׳¡׳•׳ ׳›׳¨׳ ׳׳”׳¢׳ ׳!', 'success');
            }
        } else {
            console.log('נ“ ׳׳¡׳׳ ׳׳ ׳§׳™׳™׳ ׳‘׳¢׳ ׳, ׳™׳•׳¦׳¨ ׳—׳“׳©...');
            syncToCloud();
        }
    }, (error) => {
        console.error("ג ׳©׳’׳™׳׳× Firestore sync:", error);
        showDetailedError('Firestore Sync', error);
        if (currentUser) {
            updateCloudIndicator('connected');
        }
    });
}


// ג”€ג”€ג”€ normalizeItem: ׳©׳•׳׳¨ ׳׳× ׳›׳ ׳©׳“׳•׳× ׳”׳₪׳¨׳™׳˜ ׳›׳•׳׳ ׳×׳–׳›׳•׳¨׳•׳× ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function normalizeItem(item) {
    return {
        name: item.name || '',
        price: item.price || 0,
        qty: item.qty || 1,
        checked: item.checked || false,
        category: item.category || '׳׳—׳¨',
        note: item.note || '',
        dueDate: item.dueDate || '',
        dueTime: item.dueTime || '',
        paymentUrl: item.paymentUrl || '',
        isPaid: item.isPaid || false,
        lastUpdated: item.lastUpdated || Date.now(),
        cloudId: item.cloudId || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
        // ג”€ ׳©׳“׳•׳× ׳×׳–׳›׳•׳¨׳× ג€” ׳—׳™׳™׳‘׳™׳ ׳׳”׳™׳©׳׳¨! ג”€
        reminderValue: item.reminderValue || '',
        reminderUnit: item.reminderUnit || '',
        nextAlertTime: item.nextAlertTime || null,
        alertDismissedAt: item.alertDismissedAt || null,
        isGeneralNote: item.isGeneralNote || false
    };
}

function mergeCloudWithLocal(cloudData, localData) {
    console.log('נ”„ ׳׳‘׳¦׳¢ ׳׳™׳–׳•׳’ ׳—׳›׳ ׳‘׳™׳ ׳¢׳ ׳ ׳׳׳§׳•׳׳™...');

    const merged = JSON.parse(JSON.stringify(cloudData)); // ׳¢׳•׳×׳§ ׳¢׳׳•׳§ ׳©׳ ׳ ׳×׳•׳ ׳™ ׳”׳¢׳ ׳

    // Normalize all items in cloud data - ensure all fields exist
    Object.keys(merged.lists || {}).forEach(listId => {
        if (merged.lists[listId].items) {
            merged.lists[listId].items = merged.lists[listId].items.map(item => {
                return normalizeItem(item);
            });
        }
    });

    // ׳¢׳‘׳•׳¨ ׳›׳ ׳¨׳©׳™׳׳”
    Object.keys(cloudData.lists || {}).forEach(listId => {
        const cloudList = cloudData.lists[listId];
        const localList = localData.lists && localData.lists[listId];

        if (!localList) {
            // ׳׳™׳ ׳¨׳©׳™׳׳” ׳׳§׳•׳׳™׳× - ׳”׳©׳×׳׳© ׳‘׳¢׳ ׳
            return;
        }

        // ׳™׳¦׳™׳¨׳× ׳׳₪׳× cloudId ׳׳₪׳¨׳™׳˜׳™ ׳¢׳ ׳
        const cloudItemsMap = {};
        (cloudList.items || []).forEach(item => {
            if (item.cloudId) {
                cloudItemsMap[item.cloudId] = item;
            }
        });

        // ׳׳¢׳‘׳¨ ׳¢׳ ׳₪׳¨׳™׳˜׳™׳ ׳׳§׳•׳׳™׳™׳
        (localList.items || []).forEach(localItem => {
            if (!localItem.cloudId) {
                // ׳₪׳¨׳™׳˜ ׳׳׳ cloudId - ׳–׳” ׳₪׳¨׳™׳˜ ׳™׳©׳ ׳׳• ׳—׳“׳© ׳©׳ ׳•׳¡׳£ ׳׳₪׳ ׳™ ׳”׳©׳™׳ ׳•׳™
                // ׳ ׳•׳¡׳™׳£ ׳׳• cloudId ׳•׳ ׳•׳¡׳™׳£ ׳׳•׳×׳•
                localItem.cloudId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                // Normalize local item as well
                merged.lists[listId].items.push(normalizeItem(localItem));
                console.log('ג• ׳׳•׳¡׳™׳£ ׳₪׳¨׳™׳˜ ׳—׳“׳© ׳׳§׳•׳׳™ ׳׳׳ cloudId:', localItem.name);
            } else if (!cloudItemsMap[localItem.cloudId]) {
                // ׳₪׳¨׳™׳˜ ׳¢׳ cloudId ׳©׳׳ ׳§׳™׳™׳ ׳‘׳¢׳ ׳ - ׳–׳” ׳₪׳¨׳™׳˜ ׳—׳“׳© ׳©׳ ׳•׳¡׳£ ׳‘׳׳•׳₪׳׳™׳™׳
                merged.lists[listId].items.push(normalizeItem(localItem));
                console.log('ג• ׳׳•׳¡׳™׳£ ׳₪׳¨׳™׳˜ ׳—׳“׳© ׳׳׳•׳₪׳׳™׳™׳:', localItem.name);
            } else {
                // ׳₪׳¨׳™׳˜ ׳§׳™׳™׳ ׳’׳ ׳‘׳¢׳ ׳ - ׳¢׳“׳›׳ ׳׳•׳×׳• ׳׳”׳¢׳ ׳ (׳”׳¢׳ ׳ ׳׳ ׳¦׳—)
                console.log('ג“ ׳₪׳¨׳™׳˜ ׳§׳™׳™׳ ׳‘׳©׳ ׳™׳”׳, ׳׳©׳×׳׳© ׳‘׳ ׳×׳•׳ ׳™ ׳¢׳ ׳:', localItem.name);
            }
        });
    });

    // ׳‘׳“׳™׳§׳× ׳¨׳©׳™׳׳•׳× ׳—׳“׳©׳•׳× ׳©׳ ׳•׳¡׳₪׳• ׳׳§׳•׳׳™׳×
    Object.keys(localData.lists || {}).forEach(listId => {
        if (!merged.lists[listId]) {
            console.log('נ“ ׳׳•׳¡׳™׳£ ׳¨׳©׳™׳׳” ׳—׳“׳©׳” ׳׳§׳•׳׳™׳×:', listId);
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
        console.warn('ג ן¸ ׳׳™׳ ׳׳©׳×׳׳© ׳׳—׳•׳‘׳¨, ׳׳“׳׳’ ׳¢׳ ׳¡׳ ׳›׳¨׳•׳');
        return;
    }

    console.log('ג˜ן¸ ׳׳¡׳ ׳›׳¨׳ ׳׳¢׳ ׳... UID:', currentUser.uid);
    updateCloudIndicator('syncing');

    try {
        const userDocRef = window.doc(window.firebaseDb, "shopping_lists", currentUser.uid);
        await window.setDoc(userDocRef, db);
        console.log('ג… ׳¡׳ ׳›׳¨׳•׳ ׳׳¢׳ ׳ ׳”׳•׳©׳׳ ׳‘׳”׳¦׳׳—׳”');
        // Removed notification - indicator shows sync status
    } catch (error) {
        console.error("ג ׳©׳’׳™׳׳” ׳‘׳›׳×׳™׳‘׳” ׳׳¢׳ ׳:", error);
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

// Show demo prompt on first run (if no real data)
if (typeof checkFirstRunDemo === 'function') {
    checkFirstRunDemo();
}

// ========== Excel Import Functions ==========

// ׳₪׳•׳ ׳§׳¦׳™׳” ׳׳–׳™׳”׳•׳™ ׳׳™׳ ׳“׳§׳¡ ׳¢׳׳•׳“׳” ׳׳₪׳™ ׳׳™׳׳•׳× ׳׳₪׳×׳— - ׳—׳™׳₪׳•׳© ׳’׳׳™׳©
function findColumnIndex(headerRow, keywords) {
    if (!headerRow || !Array.isArray(headerRow)) return -1;

    for (let i = 0; i < headerRow.length; i++) {
        const cell = headerRow[i];
        if (cell && typeof cell === 'string') {
            const cellNormalized = cell.trim().replace(/\s+/g, ' ').toLowerCase();

            for (const keyword of keywords) {
                const keywordNormalized = keyword.trim().replace(/\s+/g, ' ').toLowerCase();

                // ׳‘׳“׳™׳§׳” ׳׳ ׳”׳×׳ ׳׳›׳™׳ ׳׳× ׳׳™׳׳× ׳”׳׳₪׳×׳—
                if (cellNormalized.includes(keywordNormalized)) {
                    return i;
                }
            }
        }
    }
    return -1;
}

// ׳₪׳•׳ ׳§׳¦׳™׳” ׳׳ ׳™׳§׳•׳™ ׳•׳—׳™׳׳•׳¥ ׳׳¡׳₪׳¨ ׳׳×׳ ׳׳—׳™׳¨
function extractPrice(priceCell) {
    if (!priceCell) return 0;

    // ׳”׳׳¨׳” ׳׳׳—׳¨׳•׳–׳×
    let priceStr = String(priceCell).trim();

    // ׳ ׳™׳§׳•׳™ ׳׳’׳¨׳¡׳™׳‘׳™: ׳”׳¡׳¨׳× ׳›׳ ׳׳” ׳©׳׳ ׳¡׳₪׳¨׳•׳×, ׳ ׳§׳•׳“׳” ׳¢׳©׳¨׳•׳ ׳™׳× ׳׳• ׳׳™׳ ׳•׳¡
    priceStr = priceStr.replace(/[^\d.-]/g, '');

    // ׳˜׳™׳₪׳•׳ ׳‘׳׳§׳¨׳™׳ ׳©׳ ׳׳¡׳₪׳¨׳™׳ ׳©׳׳™׳׳™׳™׳ ׳׳• ׳›׳₪׳•׳׳™׳
    priceStr = priceStr.replace(/--/g, '');

    // ׳”׳׳¨׳” ׳׳׳¡׳₪׳¨ ׳•׳”׳—׳–׳¨׳× ׳¢׳¨׳ ׳׳•׳—׳׳˜ (׳—׳™׳•׳‘׳™)
    const price = parseFloat(priceStr);
    return Math.abs(price) || 0;
}

// ׳‘׳“׳™׳§׳” ׳”׳׳ ׳×׳ ׳׳›׳™׳ ׳×׳׳¨׳™׳ ׳×׳§׳™׳
function isDateCell(cell) {
    if (!cell || typeof cell !== 'string') return false;

    const cellTrimmed = cell.trim();

    // ׳×׳‘׳ ׳™׳•׳× ׳×׳׳¨׳™׳ ׳ ׳₪׳•׳¦׳•׳×
    const datePatterns = [
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,      // DD/MM/YYYY ׳׳• DD/MM/YY
        /^\d{1,2}-\d{1,2}-\d{2,4}$/,        // DD-MM-YYYY ׳׳• DD-MM-YY
        /^\d{1,2}\.\d{1,2}\.\d{2,4}$/,      // DD.MM.YYYY ׳׳• DD.MM.YY
        /^\d{4}-\d{1,2}-\d{1,2}$/,          // YYYY-MM-DD
    ];

    for (const pattern of datePatterns) {
        if (pattern.test(cellTrimmed)) {
            return true;
        }
    }

    return false;
}

// ׳₪׳•׳ ׳§׳¦׳™׳” ׳¨׳׳©׳™׳× ׳׳™׳™׳‘׳•׳ ׳׳§׳¡׳
async function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showNotification('ג³ ׳׳¢׳‘׳“ ׳§׳•׳‘׳¥ ׳׳§׳¡׳...', 'info');

        // ׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });

        console.log('נ“‚ ׳ ׳₪׳×׳— ׳§׳•׳‘׳¥ ׳¢׳', workbook.SheetNames.length, '׳’׳׳™׳•׳ ׳•׳×:', workbook.SheetNames);

        // ׳׳‘׳ ׳” ׳ ׳×׳•׳ ׳™׳ ׳׳׳™׳¡׳•׳£ ׳¢׳¡׳§׳׳•׳× ׳׳₪׳™ ׳›׳¨׳˜׳™׳¡
        // { '1234': [{name, price}, ...], '5678': [...] }
        const cardTransactions = {};
        let totalItemCount = 0;

        // ========== ׳©׳׳‘ 1: ׳׳¢׳‘׳¨ ׳¢׳ ׳›׳ ׳”׳’׳׳™׳•׳ ׳•׳× ==========
        for (const sheetName of workbook.SheetNames) {
            console.log(`\nנ“ ׳׳¢׳‘׳“ ׳’׳™׳׳™׳•׳: "${sheetName}"`);

            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

            if (rows.length === 0) {
                console.log('ג ן¸  ׳”׳’׳™׳׳™׳•׳ ׳¨׳™׳§');
                continue;
            }

            // ========== ׳©׳׳‘ 2: ׳—׳™׳₪׳•׳© ׳©׳•׳¨׳× ׳›׳•׳×׳¨׳× ==========
            let headerRowIndex = -1;
            let nameColIndex = -1;
            let priceColIndex = -1;
            let cardColIndex = -1;

            // ׳׳™׳׳•׳× ׳׳₪׳×׳— ׳׳—׳™׳₪׳•׳©
            const nameKeywords = [
                '׳©׳ ׳‘׳™׳× ׳”׳¢׳¡׳§',
                '׳©׳ ׳‘׳™׳× ׳¢׳¡׳§',
                '׳©׳ ׳”׳¢׳¡׳§',
                '׳‘׳™׳× ׳¢׳¡׳§',
                '׳©׳ ׳¢׳¡׳§',
                '׳×׳™׳׳•׳¨',
                '׳©׳ ׳׳•׳˜׳‘'
            ];

            const priceKeywords = [
                '׳¡׳›׳•׳ ׳—׳™׳•׳‘',
                '׳¡׳›׳•׳',
                '׳—׳™׳•׳‘',
                '׳¡׳”׳´׳›',
                '׳׳—׳™׳¨',
                'total',
                'amount'
            ];

            const cardKeywords = [
                '4 ׳¡׳₪׳¨׳•׳× ׳׳—׳¨׳•׳ ׳•׳× ׳©׳ ׳›׳¨׳˜׳™׳¡ ׳”׳׳©׳¨׳׳™',
                '4 ׳¡׳₪׳¨׳•׳× ׳׳—׳¨׳•׳ ׳•׳×',
                '׳¡׳₪׳¨׳•׳× ׳׳—׳¨׳•׳ ׳•׳×',
                '׳›׳¨׳˜׳™׳¡ ׳׳©׳¨׳׳™',
                '׳׳¡׳₪׳¨ ׳›׳¨׳˜׳™׳¡'
            ];

            // ׳¡׳¨׳™׳§׳× ׳¢׳“ 40 ׳©׳•׳¨׳•׳× ׳¨׳׳©׳•׳ ׳•׳× ׳׳—׳™׳₪׳•׳© ׳›׳•׳×׳¨׳×
            for (let i = 0; i < Math.min(40, rows.length); i++) {
                const currentRow = rows[i];

                // ׳ ׳¡׳” ׳׳׳¦׳•׳ ׳׳× ׳¢׳׳•׳“׳× ׳”׳©׳, ׳”׳׳—׳™׳¨ ׳•׳”׳›׳¨׳˜׳™׳¡
                const foundNameCol = findColumnIndex(currentRow, nameKeywords);
                const foundPriceCol = findColumnIndex(currentRow, priceKeywords);
                const foundCardCol = findColumnIndex(currentRow, cardKeywords);

                // ׳׳ ׳׳¦׳׳ ׳• ׳׳× ׳©׳׳•׳© ׳”׳¢׳׳•׳“׳•׳× - ׳–׳• ׳©׳•׳¨׳× ׳”׳›׳•׳×׳¨׳×!
                if (foundNameCol !== -1 && foundPriceCol !== -1 && foundCardCol !== -1) {
                    headerRowIndex = i;
                    nameColIndex = foundNameCol;
                    priceColIndex = foundPriceCol;
                    cardColIndex = foundCardCol;

                    console.log(`ג… ׳ ׳׳¦׳׳” ׳©׳•׳¨׳× ׳›׳•׳×׳¨׳× ׳‘׳©׳•׳¨׳” ${i}:`);
                    console.log(`   נ“ ׳¢׳׳•׳“׳× ׳©׳ (${nameColIndex}): "${currentRow[nameColIndex]}"`);
                    console.log(`   נ’° ׳¢׳׳•׳“׳× ׳׳—׳™׳¨ (${priceColIndex}): "${currentRow[priceColIndex]}"`);
                    console.log(`   נ’³ ׳¢׳׳•׳“׳× ׳›׳¨׳˜׳™׳¡ (${cardColIndex}): "${currentRow[cardColIndex]}"`);
                    break;
                }
            }

            if (headerRowIndex === -1) {
                console.log('ג ׳׳ ׳ ׳׳¦׳׳” ׳©׳•׳¨׳× ׳›׳•׳×׳¨׳× ׳׳×׳׳™׳׳” ׳‘׳’׳™׳׳™׳•׳');
                continue;
            }

            // ========== ׳©׳׳‘ 3: ׳׳¦׳™׳׳× ׳×׳—׳™׳׳× ׳”׳ ׳×׳•׳ ׳™׳ ==========
            let dataStartIndex = -1;

            // ׳׳—׳₪׳©׳™׳ ׳©׳•׳¨׳” ׳©׳׳×׳—׳™׳׳” ׳‘׳×׳׳¨׳™׳ (׳׳—׳¨׳™ ׳©׳•׳¨׳× ׳”׳›׳•׳×׳¨׳×)
            for (let i = headerRowIndex + 1; i < rows.length; i++) {
                const firstCell = rows[i][0];

                if (isDateCell(firstCell)) {
                    dataStartIndex = i;
                    console.log(`ג… ׳×׳—׳™׳׳× ׳ ׳×׳•׳ ׳™׳ ׳‘׳©׳•׳¨׳” ${i}, ׳×׳׳¨׳™׳ ׳¨׳׳©׳•׳: "${firstCell}"`);
                    break;
                }
            }

            if (dataStartIndex === -1) {
                console.log('ג ׳׳ ׳ ׳׳¦׳׳• ׳©׳•׳¨׳•׳× ׳ ׳×׳•׳ ׳™׳ ׳¢׳ ׳×׳׳¨׳™׳');
                continue;
            }

            // ========== ׳©׳׳‘ 4: ׳™׳™׳‘׳•׳ ׳¢׳¡׳§׳׳•׳× ׳•׳₪׳™׳¦׳•׳ ׳׳₪׳™ ׳›׳¨׳˜׳™׳¡׳™׳ ==========
            let sheetItemCount = 0;

            for (let i = dataStartIndex; i < rows.length; i++) {
                const row = rows[i];

                // ׳‘׳“׳™׳§׳” ׳©׳”׳©׳•׳¨׳” ׳׳×׳—׳™׳׳” ׳‘׳×׳׳¨׳™׳ (=׳©׳•׳¨׳× ׳ ׳×׳•׳ ׳™׳ ׳×׳§׳™׳ ׳”)
                const firstCell = row[0];
                if (!isDateCell(firstCell)) {
                    // ׳”׳’׳¢׳ ׳• ׳׳¡׳•׳£ ׳”׳ ׳×׳•׳ ׳™׳ ׳׳• ׳©׳•׳¨׳” ׳׳ ׳×׳§׳™׳ ׳”
                    console.log(`ג¹ן¸  ׳¢׳¦׳™׳¨׳” ׳‘׳©׳•׳¨׳” ${i} (׳׳ ׳×׳׳¨׳™׳)`);
                    break;
                }

                // ׳—׳™׳׳•׳¥ ׳©׳ ׳¢׳¡׳§ ׳׳”׳¢׳׳•׳“׳” ׳©׳–׳™׳”׳™׳ ׳•
                const businessName = row[nameColIndex];

                if (!businessName || typeof businessName !== 'string' || businessName.trim() === '') {
                    console.log(`ג ן¸  ׳©׳•׳¨׳” ${i}: ׳©׳ ׳¢׳¡׳§ ׳¨׳™׳§, ׳׳“׳׳’`);
                    continue;
                }

                // ׳—׳™׳׳•׳¥ ׳׳—׳™׳¨ ׳׳”׳¢׳׳•׳“׳” ׳©׳–׳™׳”׳™׳ ׳•
                const priceCell = row[priceColIndex];
                const price = extractPrice(priceCell);

                // ׳—׳™׳׳•׳¥ ׳׳¡׳₪׳¨ ׳›׳¨׳˜׳™׳¡ (4 ׳¡׳₪׳¨׳•׳× ׳׳—׳¨׳•׳ ׳•׳×)
                const cardCell = row[cardColIndex];
                let cardNumber = '';

                if (cardCell && typeof cardCell === 'string') {
                    // ׳—׳™׳׳•׳¥ ׳¨׳§ ׳”׳¡׳₪׳¨׳•׳× ׳׳”׳×׳
                    cardNumber = cardCell.replace(/\D/g, '');
                    // ׳׳ ׳™׳© ׳™׳•׳×׳¨ ׳-4 ׳¡׳₪׳¨׳•׳×, ׳§׳— ׳׳× ׳”-4 ׳׳—׳¨׳•׳ ׳•׳×
                    if (cardNumber.length > 4) {
                        cardNumber = cardNumber.slice(-4);
                    }
                } else if (cardCell && typeof cardCell === 'number') {
                    cardNumber = String(cardCell).slice(-4);
                }

                // ׳׳ ׳׳ ׳׳¦׳׳ ׳• ׳׳¡׳₪׳¨ ׳›׳¨׳˜׳™׳¡ ׳×׳§׳™׳, ׳“׳׳’ ׳¢׳ ׳”׳©׳•׳¨׳”
                if (!cardNumber || cardNumber.length !== 4) {
                    console.log(`ג ן¸  ׳©׳•׳¨׳” ${i}: ׳׳¡׳₪׳¨ ׳›׳¨׳˜׳™׳¡ ׳׳ ׳×׳§׳™׳ (${cardCell}), ׳׳“׳׳’`);
                    continue;
                }

                // ׳׳ ׳–׳” ׳”׳›׳¨׳˜׳™׳¡ ׳”׳¨׳׳©׳•׳ ׳©׳ ׳×׳§׳׳ ׳• ׳‘׳•, ׳¦׳•׳¨ ׳׳• ׳׳¢׳¨׳ ׳¨׳™׳§
                if (!cardTransactions[cardNumber]) {
                    cardTransactions[cardNumber] = [];
                    console.log(`נ’³ ׳›׳¨׳˜׳™׳¡ ׳—׳“׳© ׳–׳•׳”׳”: ${cardNumber}`);
                }

                // ׳”׳•׳¡׳£ ׳׳× ׳”׳¢׳¡׳§׳” ׳׳׳¢׳¨׳ ׳©׳ ׳”׳›׳¨׳˜׳™׳¡ ׳”׳¡׳₪׳¦׳™׳₪׳™
                cardTransactions[cardNumber].push({
                    name: businessName.trim(),
                    price: price
                });

                sheetItemCount++;
                totalItemCount++;
            }

            console.log(`ג… ׳׳’׳™׳׳™׳•׳ "${sheetName}" ׳™׳•׳‘׳׳• ${sheetItemCount} ׳¢׳¡׳§׳׳•׳×`);
        }

        // ========== ׳©׳׳‘ 5: ׳™׳¦׳™׳¨׳× ׳¨׳©׳™׳׳•׳× ׳ ׳₪׳¨׳“׳•׳× ׳׳›׳ ׳›׳¨׳˜׳™׳¡ ==========
        if (totalItemCount === 0) {
            console.log('ג ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳× ׳׳™׳™׳‘׳•׳');
            showNotification('ג ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳× ׳×׳§׳™׳ ׳•׳× ׳‘׳§׳•׳‘׳¥ ׳”׳׳§׳¡׳', 'error');
            event.target.value = '';
            return;
        }

        const cardNumbers = Object.keys(cardTransactions);
        console.log(`\nנ’³ ׳ ׳׳¦׳׳• ${cardNumbers.length} ׳›׳¨׳˜׳™׳¡׳™׳ ׳©׳•׳ ׳™׳:`, cardNumbers);

        let firstListId = null;

        for (const cardNumber of cardNumbers) {
            const transactions = cardTransactions[cardNumber];

            // ׳™׳¦׳™׳¨׳× ׳¨׳©׳™׳׳” ׳—׳“׳©׳” ׳׳›׳¨׳˜׳™׳¡
            const listId = 'L' + Date.now() + '_' + cardNumber;
            const listName = `׳׳©׳¨׳׳™ ${cardNumber}`;

            db.lists[listId] = {
                name: listName,
                items: [],
                url: '',
                budget: 0,
                createdAt: Date.now(),
                isTemplate: false,
                cloudId: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };

            // ׳”׳•׳¡׳₪׳× ׳›׳ ׳”׳¢׳¡׳§׳׳•׳× ׳׳¨׳©׳™׳׳”
            for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                db.lists[listId].items.push({
                    name: transaction.name,
                    price: transaction.price,
                    qty: 1,
                    checked: false,
                    category: '׳׳—׳¨',  // ׳§׳˜׳’׳•׳¨׳™׳” ׳§׳‘׳•׳¢׳” ׳׳›׳ ׳”׳¢׳¡׳§׳׳•׳×
                    cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i
                });
            }

            console.log(`ג… ׳ ׳•׳¦׳¨׳” ׳¨׳©׳™׳׳” "${listName}" ׳¢׳ ${transactions.length} ׳¢׳¡׳§׳׳•׳×`);

            // ׳©׳׳•׳¨ ׳׳× ׳”׳¨׳©׳™׳׳” ׳”׳¨׳׳©׳•׳ ׳” ׳׳׳¢׳‘׳¨ ׳׳׳™׳”
            if (!firstListId) {
                firstListId = listId;
            }
        }

        // ========== ׳©׳׳‘ 6: ׳׳¢׳‘׳¨ ׳׳¨׳©׳™׳׳” ׳”׳¨׳׳©׳•׳ ׳” ==========
        if (firstListId) {
            db.currentId = firstListId;
        }

        save();

        console.log(`\nנ‰ ׳¡׳”"׳› ׳™׳•׳‘׳׳• ${totalItemCount} ׳¢׳¡׳§׳׳•׳× ׳-${cardNumbers.length} ׳¨׳©׳™׳׳•׳×`);
        showNotification(`ג… ׳ ׳•׳¦׳¨׳• ${cardNumbers.length} ׳¨׳©׳™׳׳•׳× ׳¢׳ ׳¡׳”"׳› ${totalItemCount} ׳¢׳¡׳§׳׳•׳×!`);
        event.target.value = '';

    } catch (error) {
        console.error('ג Excel Import Error:', error);
        showNotification('ג ׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳§׳•׳‘׳¥ ׳”׳׳§׳¡׳: ' + error.message, 'error');
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

    console.log(`נ“„ ׳™׳™׳‘׳•׳ ׳§׳•׳‘׳¥ ׳‘׳ ׳§׳׳™: ${file.name} (${file.type})`);
    showNotification('ג³ ׳׳¢׳‘׳“ ׳§׳•׳‘׳¥ ׳‘׳ ׳§׳׳™...');

    const fileExtension = file.name.toLowerCase().split('.').pop();

    try {
        if (fileExtension === 'pdf') {
            await importBankPDF(file);
        } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
            await importBankXLS(file);
        } else {
            showNotification('ג ׳₪׳•׳¨׳׳˜ ׳§׳•׳‘׳¥ ׳׳ ׳ ׳×׳׳. ׳”׳©׳×׳׳© ׳‘-XLS ׳׳• PDF', 'error');
        }
    } catch (error) {
        console.error('ג ׳©׳’׳™׳׳” ׳‘׳™׳™׳‘׳•׳ ׳‘׳ ׳§׳׳™:', error);
        showNotification('ג ׳©׳’׳™׳׳” ׳‘׳¢׳™׳‘׳•׳“ ׳”׳§׳•׳‘׳¥: ' + error.message, 'error');
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
                console.log('נ“ ׳׳×׳—׳™׳ ׳¢׳™׳‘׳•׳“ ׳§׳•׳‘׳¥ XLS ׳‘׳ ׳§׳׳™...');

                // Use readAsBinaryString for Android compatibility
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                console.log(`נ“‹ ׳ ׳׳¦׳׳• ${workbook.SheetNames.length} ׳’׳™׳׳™׳•׳ ׳•׳×:`, workbook.SheetNames);

                const allTransactions = [];

                // Process each sheet in the workbook
                for (const sheetName of workbook.SheetNames) {
                    console.log(`\nנ” ׳׳¢׳‘׳“ ׳’׳™׳׳™׳•׳: "${sheetName}"`);
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                    console.log(`נ“ ׳¡׳”"׳› ${rows.length} ׳©׳•׳¨׳•׳× ׳‘׳’׳™׳׳™׳•׳`);

                    // Extract transactions from this sheet
                    const sheetTransactions = extractTransactionsFromSheet(rows, sheetName);
                    allTransactions.push(...sheetTransactions);

                    console.log(`ג… ׳—׳•׳׳¦׳• ${sheetTransactions.length} ׳¢׳¡׳§׳׳•׳× ׳׳’׳™׳׳™׳•׳ "${sheetName}"`);
                }

                if (allTransactions.length === 0) {
                    showNotification('ג ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳× ׳‘׳§׳•׳‘׳¥', 'error');
                    resolve();
                    return;
                }

                console.log(`\nנ’¾ ׳¡׳”"׳› ${allTransactions.length} ׳¢׳¡׳§׳׳•׳× ׳׳©׳׳™׳¨׳”`);

                // Save transactions to Firebase (with duplicate prevention)
                await saveTransactionsToFirebase(allTransactions);

                showNotification(`ג… ׳™׳•׳‘׳׳• ${allTransactions.length} ׳¢׳¡׳§׳׳•׳× ׳‘׳”׳¦׳׳—׳”!`);
                resolve();

            } catch (error) {
                console.error('ג ׳©׳’׳™׳׳” ׳‘׳¢׳™׳‘׳•׳“ XLS:', error);
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥'));
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

    // Find header row (contains "׳×׳׳¨׳™׳", "׳×׳™׳׳•׳¨", "׳¡׳›׳•׳" or similar)
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
            if (cell.includes('׳×׳׳¨׳™׳') || cell.toLowerCase().includes('date')) {
                dateColIndex = j;
            }

            // Check for description column
            if (cell.includes('׳×׳™׳׳•׳¨') || cell.includes('׳₪׳¨׳˜׳™׳') || cell.includes('׳׳¡׳׳›׳×׳') ||
                cell.toLowerCase().includes('description') || cell.toLowerCase().includes('details')) {
                descriptionColIndex = j;
            }

            // Check for amount column
            if (cell.includes('׳¡׳›׳•׳') || cell.includes('׳—׳™׳•׳‘') || cell.includes('׳–׳›׳•׳×') ||
                cell.toLowerCase().includes('amount') || cell.toLowerCase().includes('debit') ||
                cell.toLowerCase().includes('credit')) {
                amountColIndex = j;
            }
        }

        // If we found all three columns, this is our header row
        if (dateColIndex !== -1 && descriptionColIndex !== -1 && amountColIndex !== -1) {
            headerRowIndex = i;
            console.log(`ג“ ׳©׳•׳¨׳× ׳›׳•׳×׳¨׳× ׳ ׳׳¦׳׳” ׳‘׳©׳•׳¨׳” ${i}: ׳×׳׳¨׳™׳=${dateColIndex}, ׳×׳™׳׳•׳¨=${descriptionColIndex}, ׳¡׳›׳•׳=${amountColIndex}`);
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.log(`ג ן¸  ׳׳ ׳ ׳׳¦׳׳” ׳©׳•׳¨׳× ׳›׳•׳×׳¨׳× ׳‘׳’׳™׳׳™׳•׳ "${sheetName}"`);
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
            console.log(`ג­ן¸  ׳׳“׳׳’ ׳¢׳ ׳©׳•׳¨׳× ׳¡׳™׳›׳•׳: "${description}"`);
            continue;
        }

        // Parse date
        const date = parseDate(dateCell);
        if (!date) {
            console.log(`ג ן¸  ׳©׳•׳¨׳” ${i}: ׳×׳׳¨׳™׳ ׳׳ ׳×׳§׳™׳ (${dateCell}), ׳׳“׳׳’`);
            continue;
        }

        // Parse amount
        const amount = parseAmount(amountCell);
        if (amount === 0) {
            console.log(`ג ן¸  ׳©׳•׳¨׳” ${i}: ׳¡׳›׳•׳ ׳׳₪׳¡ ׳׳• ׳׳ ׳×׳§׳™׳ (${amountCell}), ׳׳“׳׳’`);
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
                console.log('נ“„ ׳׳×׳—׳™׳ ׳¢׳™׳‘׳•׳“ ׳§׳•׳‘׳¥ PDF ׳‘׳ ׳§׳׳™...');

                // Use readAsArrayBuffer for Android compatibility with PDF.js
                const arrayBuffer = e.target.result;

                // Load PDF document
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                console.log(`נ“– PDF ׳ ׳˜׳¢׳: ${pdf.numPages} ׳¢׳׳•׳“׳™׳`);

                const allTransactions = [];

                // Process each page
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    // Extract text from page
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    console.log(`נ“„ ׳¢׳׳•׳“ ${pageNum}: ${pageText.length} ׳×׳•׳•׳™׳`);

                    // DEBUG: ׳”׳¦׳’ ׳׳× ׳”׳˜׳§׳¡׳˜ ׳©׳ ׳—׳׳¥
                    console.log('נ” ׳˜׳§׳¡׳˜ ׳©׳ ׳—׳׳¥ ׳׳”׳¢׳׳•׳“:', pageText.substring(0, 500));

                    // Extract transactions from page text
                    const pageTransactions = extractTransactionsFromPDFText(pageText);
                    allTransactions.push(...pageTransactions);

                    console.log(`ג… ׳—׳•׳׳¦׳• ${pageTransactions.length} ׳¢׳¡׳§׳׳•׳× ׳׳¢׳׳•׳“ ${pageNum}`);
                }

                if (allTransactions.length === 0) {
                    showNotification('ג ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳× ׳‘-PDF', 'error');
                    resolve();
                    return;
                }

                console.log(`\nנ’¾ ׳¡׳”"׳› ${allTransactions.length} ׳¢׳¡׳§׳׳•׳× ׳׳©׳׳™׳¨׳”`);

                // Save transactions to Firebase (with duplicate prevention)
                await saveTransactionsToFirebase(allTransactions);

                showNotification(`ג… ׳™׳•׳‘׳׳• ${allTransactions.length} ׳¢׳¡׳§׳׳•׳× ׳‘׳”׳¦׳׳—׳”!`);
                resolve();

            } catch (error) {
                console.error('ג ׳©׳’׳™׳׳” ׳‘׳¢׳™׳‘׳•׳“ PDF:', error);
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥'));
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

    console.log(`נ” ׳׳¢׳‘׳“ ${lines.length} ׳©׳•׳¨׳•׳× ׳׳”-PDF`);

    // ׳₪׳•׳¨׳׳˜ ׳‘׳ ׳§ ׳”׳₪׳•׳¢׳׳™׳: ׳˜׳‘׳׳” ׳¢׳ ׳¢׳׳•׳“׳•׳×
    // ׳×׳׳¨׳™׳ | ׳×׳׳¨׳™׳ ׳¢׳¨׳ | ׳×׳™׳׳•׳¨ | ׳׳¡׳׳›׳×׳ | ׳—׳•׳‘׳” | ׳–׳›׳•׳× | ׳™׳×׳¨׳”
    // ׳“׳•׳’׳׳”: "06/01/2026 06/01/2026 ׳›׳¨׳˜׳™׳¡ ׳“׳‘׳™׳˜ 41657 50.03 -28,599.22"

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line || line.length < 20) {
            continue; // ׳©׳•׳¨׳” ׳¨׳™׳§׳” ׳׳• ׳§׳¦׳¨׳” ׳׳“׳™
        }

        // ׳—׳™׳₪׳•׳© ׳×׳׳¨׳™׳ ׳‘׳×׳—׳™׳׳× ׳”׳©׳•׳¨׳” (DD/MM/YYYY)
        const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);

        if (!dateMatch) {
            continue; // ׳׳™׳ ׳×׳׳¨׳™׳ - ׳“׳׳’
        }

        const dateStr = dateMatch[1];
        let restOfLine = line.substring(dateStr.length).trim();

        // ׳”׳¡׳¨ ׳×׳׳¨׳™׳ ׳¢׳¨׳ ׳ ׳•׳¡׳£ ׳׳ ׳§׳™׳™׳
        restOfLine = restOfLine.replace(/^\d{2}\/\d{2}\/\d{4}\s+/, '');

        // ׳—׳™׳׳•׳¥ ׳›׳ ׳”׳׳¡׳₪׳¨׳™׳ ׳‘׳©׳•׳¨׳” (׳›׳•׳׳ ׳׳׳” ׳¢׳ ׳₪׳¡׳™׳§׳™׳)
        // ׳“׳•׳’׳׳”: ["41657", "50.03", "28,599.22"] ׳׳• ["99012", "350.00", "28,249.22"]
        const numberMatches = restOfLine.match(/[\d,]+\.?\d*/g);

        if (!numberMatches || numberMatches.length < 2) {
            continue; // ׳׳ ׳׳¡׳₪׳™׳§ ׳׳¡׳₪׳¨׳™׳
        }

        // ׳”׳׳¡׳₪׳¨ ׳”׳׳—׳¨׳•׳ = ׳”׳™׳×׳¨׳” (׳‘׳₪׳•׳¨׳׳˜: -28,599.22)
        // ׳”׳׳¡׳₪׳¨ ׳׳₪׳ ׳™ ׳׳—׳¨׳•׳ = ׳”׳¡׳›׳•׳ (׳—׳•׳‘׳” ׳׳• ׳–׳›׳•׳×)
        const balanceStr = numberMatches[numberMatches.length - 1];
        const amountStr = numberMatches[numberMatches.length - 2];

        // ׳—׳™׳׳•׳¥ ׳”׳×׳™׳׳•׳¨ - ׳”׳›׳ ׳¢׳“ ׳”׳׳¡׳₪׳¨ ׳”׳׳—׳¨׳•׳ ׳׳₪׳ ׳™ ׳”׳¡׳›׳•׳
        let description = restOfLine;

        // ׳”׳¡׳¨ ׳׳× ׳©׳ ׳™ ׳”׳׳¡׳₪׳¨׳™׳ ׳”׳׳—׳¨׳•׳ ׳™׳ (׳¡׳›׳•׳ + ׳™׳×׳¨׳”)
        const lastBalanceIndex = description.lastIndexOf(balanceStr);
        if (lastBalanceIndex > 0) {
            description = description.substring(0, lastBalanceIndex).trim();
        }

        const lastAmountIndex = description.lastIndexOf(amountStr);
        if (lastAmountIndex > 0) {
            description = description.substring(0, lastAmountIndex).trim();
        }

        // ׳”׳¡׳¨ ׳׳¡׳₪׳¨ ׳׳¡׳׳›׳×׳ ׳׳ ׳§׳™׳™׳ (׳‘׳“׳¨׳ ׳›׳׳ ׳”׳׳¡׳₪׳¨ ׳”׳׳—׳¨׳•׳ ׳©׳ ׳©׳׳¨)
        // ׳׳׳©׳: "׳›׳¨׳˜׳™׳¡ ׳“׳‘׳™׳˜ 41657" -> "׳›׳¨׳˜׳™׳¡ ׳“׳‘׳™׳˜"
        const remainingNumbers = description.match(/\d+/g);
        if (remainingNumbers && remainingNumbers.length > 0) {
            const lastNum = remainingNumbers[remainingNumbers.length - 1];
            const lastNumIndex = description.lastIndexOf(lastNum);
            description = description.substring(0, lastNumIndex).trim();
        }

        // ׳ ׳§׳” ׳¨׳•׳•׳—׳™׳ ׳׳™׳•׳×׳¨׳™׳
        description = description.replace(/\s+/g, ' ').trim();

        // ׳‘׳“׳™׳§׳•׳× ׳×׳§׳™׳ ׳•׳×
        if (!description || description.length < 3) {
            continue; // ׳×׳™׳׳•׳¨ ׳§׳¦׳¨ ׳׳“׳™
        }

        // ׳“׳׳’ ׳¢׳ ׳©׳•׳¨׳•׳× ׳›׳•׳×׳¨׳× ׳•׳¡׳™׳›׳•׳
        if (isTotalRow(description) ||
            description.includes('׳×׳׳¨׳™׳') ||
            description.includes('׳™׳×׳¨׳”') ||
            description.includes('׳׳¡׳׳›׳×׳') ||
            description.includes('׳—׳•׳‘׳”') ||
            description.includes('׳–׳›׳•׳×')) {
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

        console.log(`ג… ׳ ׳׳¦׳: ${dateStr} | ${description} | ${amount}`);

        transactions.push({
            date: date,
            description: description,
            amount: amount,
            source: 'PDF'
        });
    }

    console.log(`נ“ ׳¡׳”"׳› ${transactions.length} ׳¢׳¡׳§׳׳•׳× ׳—׳•׳׳¦׳•`);
    return transactions;
}

/**
 * Check if a description indicates a total/summary row
 */
function isTotalRow(description) {
    const totalKeywords = [
        '׳¡׳”"׳›', '׳¡׳”׳›', '׳¡׳ ׳”׳›׳', 'total', 'sum', 'subtotal',
        '׳™׳×׳¨׳”', 'balance', '׳¡׳™׳›׳•׳', 'summary', '׳׳—׳–׳•׳¨'
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
    amountStr = amountStr.replace(/[ג‚×$ג‚¬ֲ£\s]/g, '');

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
    console.log(`נ“‹ ׳׳¢׳‘׳“ ${transactions.length} ׳¢׳¡׳§׳׳•׳×...`);

    if (transactions.length === 0) {
        showNotification('ג ן¸ ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳× ׳׳™׳™׳‘׳•׳');
        return;
    }

    // ׳. ׳™׳¦׳™׳¨׳× ׳¨׳©׳™׳׳” ׳—׳“׳©׳”
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const newListName = `׳™׳™׳‘׳•׳ ׳‘׳ ׳§׳׳™ ${dateStr}`;
    const newListId = 'list_' + Date.now();

    // ׳‘. ׳”׳׳¨׳× ׳¢׳¡׳§׳׳•׳× ׳׳׳•׳¦׳¨׳™׳ ׳¢׳ ׳×׳™׳§׳•׳ ׳©׳“׳•׳×
    const items = [];
    for (const transaction of transactions) {
        const category = detectCategory(transaction.description);

        // ׳™׳¦׳™׳¨׳× cloudId ׳™׳™׳—׳•׳“׳™ ׳׳׳ ׳™׳¢׳× ׳‘׳¢׳™׳•׳× ׳¡׳ ׳›׳¨׳•׳
        const cloudId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // ׳•׳™׳“׳•׳ ׳©׳”-price ׳”׳•׳ ׳׳¡׳₪׳¨ ׳×׳§׳™׳ ׳•׳׳ NaN
        let itemPrice = parseFloat(transaction.amount);

        // ׳ ׳™׳§׳•׳™ ׳”׳¡׳›׳•׳ ׳׳¡׳™׳׳ ׳™ ׳׳˜׳‘׳¢ ׳•׳₪׳¡׳™׳§׳™׳
        if (typeof transaction.amount === 'string') {
            const cleanAmount = transaction.amount.replace(/[ג‚×$ג‚¬ֲ£\s,]/g, '').replace(',', '.');
            itemPrice = parseFloat(cleanAmount);
        }

        // ׳‘׳“׳™׳§׳× ׳×׳§׳™׳ ׳•׳×
        if (isNaN(itemPrice) || itemPrice === null || itemPrice === undefined) {
            itemPrice = 0;
        }

        items.push({
            name: transaction.description,
            qty: 1,  // ׳—׳©׳•׳‘: qty ׳•׳׳ quantity - ׳–׳” ׳”׳©׳“׳” ׳©׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳׳©׳×׳׳©׳× ׳‘׳•
            price: itemPrice,  // ׳׳¡׳₪׳¨ ׳×׳§׳™׳ ׳‘׳׳‘׳“, ׳׳׳ NaN
            category: category,
            checked: false,
            cloudId: cloudId  // cloudId ׳™׳™׳—׳•׳“׳™ ׳׳¡׳ ׳›׳¨׳•׳ ׳¢׳ ׳
        });
    }

    // ׳™׳¦׳™׳¨׳× ׳”׳¨׳©׳™׳׳” ׳”׳—׳“׳©׳”
    db.lists[newListId] = {
        name: newListName,
        items: items,
        createdAt: Date.now(),
        completed: false,
        isTemplate: false
    };

    // ׳’. ׳׳¢׳‘׳¨ ׳׳•׳˜׳•׳׳˜׳™ ׳׳¨׳©׳™׳׳” ׳”׳—׳“׳©׳”
    db.currentId = newListId;
    activePage = 'lists';

    // ׳“. ׳¡׳ ׳›׳¨׳•׳ - ׳©׳׳™׳¨׳” ׳•׳¨׳™׳ ׳“׳•׳¨ (׳׳׳ switchTab ׳©׳׳ ׳§׳™׳™׳)
    save();
    render();  // ׳¨׳¢׳ ׳•׳ ׳”׳׳¡׳ ׳׳”׳¦׳’׳× ׳”׳¨׳©׳™׳׳” ׳”׳—׳“׳©׳”

    // ׳”. ׳׳ ׳™׳¢׳× ׳›׳₪׳™׳׳•׳™׳•׳× - ׳©׳׳™׳¨׳× ׳”׳¢׳¡׳§׳׳•׳× ׳‘-Firebase ׳×׳—׳× transactions
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
                    console.error(`ג ׳©׳’׳™׳׳” ׳‘׳©׳׳™׳¨׳× ׳¢׳¡׳§׳” "${transaction.description}":`, error);
                }
            }

            console.log(`ג… Firebase: ${savedCount} ׳ ׳©׳׳¨׳•, ${duplicateCount} ׳›׳₪׳™׳׳•׳™׳•׳× ׳“׳•׳׳’׳•`);
        }
    }

    showNotification(`ג… ׳ ׳•׳¦׳¨׳” ׳¨׳©׳™׳׳” ׳—׳“׳©׳” ׳¢׳ ${items.length} ׳׳•׳¦׳¨׳™׳!`);
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
        showNotification('נ“‚ ׳§׳•׳¨׳ ׳§׳•׳‘׳¥...');

        let items = [];

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            items = await parseBankExcel(file);
        } else if (fileExtension === 'pdf') {
            items = await parseBankPDF(file);
        } else {
            showNotification('ג ׳₪׳•׳¨׳׳˜ ׳§׳•׳‘׳¥ ׳׳ ׳ ׳×׳׳. ׳׳ ׳ ׳‘׳—׳¨ ׳§׳•׳‘׳¥ Excel ׳׳• PDF');
            return;
        }

        if (items.length === 0) {
            showNotification('ג ן¸ ׳׳ ׳ ׳׳¦׳׳• ׳×׳ ׳•׳¢׳•׳× ׳‘׳ ׳§׳׳™׳•׳× ׳‘׳§׳•׳‘׳¥');
            return;
        }

        addBankItemsToList(items);

    } catch (error) {
        console.error('Error importing bank file:', error);
        showNotification('ג ׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥: ' + error.message);
    } finally {
        // Reset file input
        event.target.value = '';
    }
}

/**
 * Parse Excel bank statement
 * Looks for columns: ׳×׳׳¨׳™׳, ׳×׳™׳׳•׳¨, ׳‘׳—׳•׳‘׳”
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
                console.log('נ“ Excel Headers:', headers);

                headers.forEach((header, index) => {
                    const h = String(header).toLowerCase().trim();

                    // Date column - more flexible matching
                    if (h.includes('׳×׳׳¨׳™׳') || h.includes('date') || h.includes('׳×׳׳¨')) {
                        dateCol = index;
                        console.log(`ג… Found date column at index ${index}: "${header}"`);
                    }
                    // Description column - more flexible matching
                    if (h.includes('׳×׳™׳׳•׳¨') || h.includes('description') || h.includes('׳₪׳™׳¨׳•׳˜') || h.includes('׳×׳׳•׳¨')) {
                        descCol = index;
                        console.log(`ג… Found description column at index ${index}: "${header}"`);
                    }
                    // Debit column (amount charged) - more flexible matching
                    if (h.includes('׳‘׳—׳•׳‘׳”') || h.includes('׳—׳•׳‘׳”') || h.includes('debit') || h.includes('׳—׳™׳•׳‘') || h.includes('׳–׳›׳•׳×')) {
                        debitCol = index;
                        console.log(`ג… Found debit column at index ${index}: "${header}"`);
                    }
                });

                console.log('נ” Column indices:', { dateCol, descCol, debitCol });

                // If we didn't find the debit column, try to find any column with numbers
                if (debitCol === -1 && dateCol !== -1 && descCol !== -1) {
                    console.log('ג ן¸ Debit column not found by name, searching for numeric column...');
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
                            console.log(`ג… Found numeric column at index ${colIndex}: "${headers[colIndex]}"`);
                            break;
                        }
                    }
                }

                // FALLBACK: If columns not found by name, use LAST 3 columns (Hebrew RTL)
                if (dateCol === -1 || descCol === -1) {
                    console.log('ג ן¸ Using fallback: last 3 columns (RTL) as date, description, amount');
                    if (headers.length >= 3) {
                        // Hebrew files are RTL, so rightmost columns are first
                        const lastCol = headers.length - 1;
                        dateCol = lastCol;      // Rightmost column = date
                        descCol = lastCol - 1;  // Second from right = description
                        if (debitCol === -1) {
                            debitCol = lastCol - 2;  // Third from right = amount
                        }
                        console.log('נ“ Fallback columns (RTL):', { dateCol, descCol, debitCol });
                        console.log(`נ“ Using: Date="${headers[dateCol]}", Desc="${headers[descCol]}", Amount="${headers[debitCol]}"`);
                    } else if (headers.length >= 2) {
                        // Only 2 columns - use last 2
                        const lastCol = headers.length - 1;
                        dateCol = lastCol;
                        descCol = lastCol - 1;
                        console.log('נ“ Fallback columns (2 cols):', { dateCol, descCol, debitCol });
                    } else {
                        console.error('ג Not enough columns in file');
                        reject(new Error('׳”׳§׳•׳‘׳¥ ׳׳ ׳׳›׳™׳ ׳׳¡׳₪׳™׳§ ׳¢׳׳•׳“׳•׳×'));
                        return;
                    }
                }

                console.log('נ¯ Final columns:', { dateCol, descCol, debitCol });

                // Parse rows
                const items = [];
                console.log(`נ“‹ Processing ${jsonData.length - 1} rows...`);

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];

                    if (!row || row.length === 0) continue;

                    const date = row[dateCol];
                    const description = row[descCol];
                    const debit = debitCol !== -1 ? row[debitCol] : null;

                    // Skip if no description AND no date (completely empty row)
                    if (!description && !date) {
                        console.log(`ג­ן¸ Row ${i}: Skipping empty row`);
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
                        console.log(`ג­ן¸ Row ${i}: No valid debit amount (${debit})`);
                        continue;
                    }

                    // Format date
                    const formattedDate = formatBankDate(date);

                    // Use description or fallback to "׳×׳ ׳•׳¢׳”" if empty
                    const finalDescription = description ? String(description).trim() : '׳×׳ ׳•׳¢׳”';

                    console.log(`ג… Row ${i}: ${finalDescription} - ${formattedDate} - ג‚×${amount}`);

                    items.push({
                        date: formattedDate,
                        description: finalDescription,
                        amount: amount
                    });
                }

                console.log(`ג… Total items parsed: ${items.length}`);
                resolve(items);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥'));
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
                console.log(`נ“„ PDF has ${pdf.numPages} pages`);
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

                console.log('נ“ Extracted text length:', fullText.length);
                console.log('נ“ First 500 chars:', fullText.substring(0, 500));

                // Parse transactions from text
                const items = parseTransactionsFromText(fullText);

                resolve(items);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function () {
            reject(new Error('׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳§׳•׳‘׳¥ PDF'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse transactions from PDF text
 * Israeli bank format: Amount Number Description Date
 * Example: 655.80 8547 ׳›׳¨׳˜׳™׳¡׳™ ׳׳©׳¨׳׳™-׳™ 11/01/2026
 */
function parseTransactionsFromText(text) {
    const items = [];
    const lines = text.split('\n');

    console.log(`נ” Parsing ${lines.length} lines from PDF...`);

    // Regex patterns for Israeli bank statements
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})/g;
    const amountPattern = /^[\s]*(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 10) continue;

        // Skip balance lines (׳™׳×׳¨׳” ׳‘׳©"׳—)
        if (line.includes('׳™׳×׳¨׳”') || line.includes('balance')) {
            console.log(`ג­ן¸ Skipping balance line: "${line}"`);
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

        console.log(`נ” Line ${i}: "${line}"`);
        console.log(`נ“… Dates: ${dates.join(', ')}`);
        console.log(`נ’° Decimal numbers found: ${decimalNumbers.map(n => `${n.text}=${n.value}`).join(', ')}`);

        if (decimalNumbers.length === 0) {
            console.log(`ג­ן¸ No decimal numbers, skipping`);
            continue;
        }

        // Use the SMALLEST decimal number between 10-10000 as the amount
        // This filters out balance numbers (>10000) while keeping transaction amounts
        const validAmounts = decimalNumbers.filter(n => n.value >= 10 && n.value < 10000).sort((a, b) => a.value - b.value);

        if (validAmounts.length === 0) {
            console.log(`ג­ן¸ No valid amounts (>= 10), skipping`);
            continue;
        }

        const amount = validAmounts[0].value;
        const amountText = validAmounts[0].text;

        console.log(`ג… Using amount: ${amount} from "${amountText}" (smallest >= 10)`);

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
            description = '׳×׳ ׳•׳¢׳” ׳‘׳ ׳§׳׳™׳×';
        }

        console.log(`ג… Final: "${description}" - ${date} - ג‚×${amount}`);

        items.push({
            date: formatBankDate(date),
            description: description,
            amount: amount
        });
    }

    console.log(`ג… Total PDF transactions: ${items.length}`);
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
        name: `׳™׳™׳‘׳•׳ ׳‘׳ ׳§׳׳™ ${dateStr}`,
        url: '',
        budget: 0,
        isTemplate: false,
        items: []
    };

    let addedCount = 0;

    items.forEach(item => {
        // Create item name: Description (Date)
        const itemName = `${item.description} (${item.date})`;

        // Add to NEW list with "׳׳—׳¨" category
        db.lists[newListId].items.push({
            name: itemName,
            price: item.amount,
            qty: 1,
            checked: false,
            category: '׳׳—׳¨',
            cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });

        addedCount++;
    });

    // Switch to the new list
    db.currentId = newListId;

    save();
    showNotification(`ג… ׳ ׳•׳¦׳¨׳” ׳¨׳©׳™׳׳” ׳—׳“׳©׳” ׳¢׳ ${addedCount} ׳×׳ ׳•׳¢׳•׳× ׳‘׳ ׳§׳׳™׳•׳×!`);
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
// ׳₪׳×׳™׳—׳× modal ׳׳”׳•׳¡׳₪׳”/׳¢׳¨׳™׳›׳× ׳”׳¢׳¨׳” ׳׳׳•׳¦׳¨
function openItemNoteModal(itemIndex) {
    currentNoteItemIndex = itemIndex;
    const item = db.lists[db.currentId].items[itemIndex];
    const noteInput = document.getElementById('itemNoteInput');

    // ׳˜׳¢׳ ׳”׳¢׳¨׳” ׳§׳™׳™׳׳× ׳׳ ׳™׳©
    if (noteInput) {
        noteInput.value = item.note || '';
    }

    openModal('itemNoteModal');
}

// Helper function called from metadata HTML
function openItemNote(idx) {
    openItemNoteModal(idx);
}

// ׳©׳׳™׳¨׳× ׳”׳¢׳¨׳” ׳׳׳•׳¦׳¨
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

    // ׳¢׳“׳›׳•׳ ׳”׳”׳¢׳¨׳” ׳‘-DB
    if (db.lists[db.currentId] && db.lists[db.currentId].items[currentNoteItemIndex]) {
        db.lists[db.currentId].items[currentNoteItemIndex].note = note;

        save();
        closeModal('itemNoteModal');
        currentNoteItemIndex = null; // ׳׳™׳₪׳•׳¡ ׳”׳׳©׳×׳ ׳”

        if (note) {
            showNotification('ג… ׳”׳”׳¢׳¨׳” ׳ ׳©׳׳¨׳”');
        } else {
            showNotification('נ—‘ן¸ ׳”׳”׳¢׳¨׳” ׳ ׳׳—׳§׳”');
        }
    } else {
        console.error('Invalid item index or list');
    }
}

// ========== SMART PRICE HISTORY ==========
// ׳׳™׳׳•׳™ ׳׳•׳˜׳•׳׳˜׳™ ׳©׳ ׳׳—׳™׳¨ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳”
function autofillFromHistory(itemName) {
    if (!itemName || itemName.length < 2) return;

    const nameLower = itemName.toLowerCase().trim();

    // ׳—׳™׳₪׳•׳© ׳‘׳›׳ ׳”׳¨׳©׳™׳׳•׳×
    let lastPrice = null;
    let lastDate = 0;

    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            if (item.name.toLowerCase().trim() === nameLower && item.price > 0) {
                // ׳”׳©׳×׳׳© ׳‘׳×׳׳¨׳™׳ ׳¢׳“׳›׳•׳ ׳׳ ׳§׳™׳™׳, ׳׳—׳¨׳× ׳”׳©׳×׳׳© ׳‘-0
                const itemDate = item.lastUpdated || 0;
                if (itemDate > lastDate) {
                    lastDate = itemDate;
                    lastPrice = item.price;
                }
            }
        });
    });

    // ׳׳™׳׳•׳™ ׳©׳“׳” ׳”׳׳—׳™׳¨ ׳׳ ׳ ׳׳¦׳
    const priceInput = document.getElementById('itemPrice');
    if (lastPrice && priceInput && !priceInput.value) {
        priceInput.value = lastPrice;
        priceInput.style.backgroundColor = '#fef3c7';  // ׳¦׳”׳•׳‘ ׳‘׳”׳™׳¨ ׳׳¡׳™׳׳•׳
        setTimeout(() => {
            priceInput.style.backgroundColor = '';
        }, 1500);
    }
}

// ׳¢׳“׳›׳•׳ ׳׳—׳™׳¨ ׳‘׳”׳™׳¡׳˜׳•׳¨׳™׳” - ׳׳¢׳“׳›׳ ׳׳× ׳›׳ ׳”׳׳•׳₪׳¢׳™׳ ׳©׳ ׳”׳׳•׳¦׳¨
function updatePriceInHistory(itemName, newPrice) {
    if (!itemName || !newPrice) return;

    const nameLower = itemName.toLowerCase().trim();
    const timestamp = Date.now();

    // ׳¢׳“׳›׳•׳ ׳‘׳›׳ ׳”׳¨׳©׳™׳׳•׳×
    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            if (item.name.toLowerCase().trim() === nameLower) {
                item.price = newPrice;
                item.lastUpdated = timestamp;
            }
        });
    });
}

// ׳׳—׳™׳§׳× ׳₪׳¨׳™׳˜ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳™׳× ׳”׳—׳™׳₪׳•׳©
function deleteFromSearchHistory(itemName) {
    if (!itemName) return;

    const nameLower = itemName.toLowerCase().trim();
    let removedCount = 0;

    // ׳”׳¡׳¨׳” ׳׳›׳ ׳”׳¨׳©׳™׳׳•׳×
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
        showNotification(`נ—‘ן¸ ׳”׳•׳¡׳¨׳• ${removedCount} ׳׳•׳₪׳¢׳™׳`);
    }
}

// ׳¢׳“׳›׳•׳ ׳₪׳•׳ ׳§׳¦׳™׳™׳× updateSuggestions ׳׳”׳•׳¡׳₪׳× ׳›׳₪׳×׳•׳¨ X
const originalUpdateSuggestions = window.updateSuggestions || function () { };
window.updateSuggestions = function (searchText) {
    // ׳§׳¨׳™׳׳” ׳׳₪׳•׳ ׳§׳¦׳™׳” ׳”׳׳§׳•׳¨׳™׳× ׳׳ ׳§׳™׳™׳׳×
    if (typeof originalUpdateSuggestions === 'function') {
        originalUpdateSuggestions(searchText);
    }
};


// ========== DUAL-LAYER SORTING ==========
// ׳׳™׳•׳ ׳“׳•-׳©׳›׳‘׳×׳™: ׳׳₪׳™ ׳¡׳˜׳˜׳•׳¡ (׳׳ ׳׳¡׳•׳׳/׳׳¡׳•׳׳) ׳•׳׳– ׳׳₪׳™ ׳§׳˜׳’׳•׳¨׳™׳”
function sortItemsByStatusAndCategory(items) {
    return items.slice().sort((a, b) => {
        // ׳©׳›׳‘׳” 1: ׳₪׳¨׳™׳˜׳™׳ ׳׳ ׳׳¡׳•׳׳ ׳™׳ ׳׳₪׳ ׳™ ׳׳¡׳•׳׳ ׳™׳
        if (a.checked !== b.checked) {
            return a.checked ? 1 : -1;
        }

        // ׳©׳›׳‘׳” 2: ׳׳™׳•׳ ׳׳₪׳™ ׳§׳˜׳’׳•׳¨׳™׳” ׳‘׳×׳•׳ ׳›׳ ׳§׳‘׳•׳¦׳”
        const catA = a.category || '׳׳—׳¨';
        const catB = b.category || '׳׳—׳¨';

        // ׳¡׳“׳¨ ׳§׳˜׳’׳•׳¨׳™׳•׳× ׳׳•׳×׳׳
        const categoryOrder = [
            '׳₪׳™׳¨׳•׳× ׳•׳™׳¨׳§׳•׳×',
            '׳‘׳©׳¨ ׳•׳“׳’׳™׳',
            '׳—׳׳‘ ׳•׳‘׳™׳¦׳™׳',
            '׳׳—׳ ׳•׳׳׳₪׳™׳',
            '׳©׳™׳׳•׳¨׳™׳',
            '׳—׳˜׳™׳₪׳™׳',
            '׳׳©׳§׳׳•׳×',
            '׳ ׳™׳§׳™׳•׳',
            '׳”׳™׳’׳™׳™׳ ׳”',
            '׳׳—׳¨'
        ];

        const indexA = categoryOrder.indexOf(catA);
        const indexB = categoryOrder.indexOf(catB);

        // ׳׳ ׳§׳˜׳’׳•׳¨׳™׳” ׳׳ ׳ ׳׳¦׳׳” ׳‘׳¨׳©׳™׳׳”, ׳©׳™׳ ׳׳•׳×׳” ׳‘׳¡׳•׳£
        const orderA = indexA === -1 ? categoryOrder.length : indexA;
        const orderB = indexB === -1 ? categoryOrder.length : indexB;

        return orderA - orderB;
    });
}


// ========== EXCEL IMPORT FUNCTIONALITY ==========
/**
 * Handle Excel file upload and create a new shopping list
 * Parses XLSX file and extracts data from columns B, C, D, E
 * Creates products with format: [Business Name] ([Date]) ׳›׳¨׳˜׳™׳¡ [Card Number]
 */
function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        showNotification('ג ׳׳ ׳ ׳‘׳—׳¨ ׳§׳•׳‘׳¥ Excel ׳×׳§׳™׳ (.xlsx ׳׳• .xls)');
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

            console.log('נ”¥ EXCEL IMPORT v2.0 - CODE UPDATED! נ”¥');
            console.log('Expected: Column 1=name, Column 3=PRICE, Column 6=card, Column 7=date');

            // Skip header row (index 0) and process data rows
            const products = [];

            console.log('נ“ Excel Import Debug - First 3 rows:');
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
                console.log('ג ן¸ Detected single-column format with tabs - will split data by tabs');
            } else {
                console.log('נ“ Using multi-column format');
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
                    // parts[1] = business name (׳©׳ ׳‘׳™׳× ׳¢׳¡׳§)
                    // parts[2] = transaction date (׳×׳׳¨׳™׳ ׳¢׳¡׳§׳”)
                    // parts[3] = charge amount (׳¡׳›׳•׳ ׳—׳™׳•׳‘) - THE PRICE!
                    // parts[4] = credit amount (׳¡׳›׳•׳ ׳–׳™׳›׳•׳™)
                    // parts[5] = balance (׳™׳×׳¨׳”)
                    // parts[6] = card (׳›׳¨׳˜׳™׳¡)
                    // parts[7] = billing date (׳׳•׳¢׳“ ׳—׳™׳•׳‘)

                    if (parts.length >= 2) businessName = parts[1];
                    if (parts.length >= 4) {
                        const amountStr = parts[3].replace(/[ג‚×$ג‚¬ֲ£,\s]/g, '').replace(/[^\d.-]/g, '');
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

                        if (header.includes('׳©׳') && header.includes('׳¢׳¡׳§')) {
                            businessNameCol = j;
                            console.log(`ג“ Found business name column at index ${j}`);
                        } else if (header.includes('׳¡׳›׳•׳') && header.includes('׳—׳™׳•׳‘')) {
                            amountCol = j;
                            console.log(`ג“ Found amount column at index ${j}`);
                        } else if (header.includes('׳›׳¨׳˜׳™׳¡')) {
                            cardCol = j;
                            console.log(`ג“ Found card column at index ${j}`);
                        } else if (header.includes('׳׳•׳¢׳“') && header.includes('׳—׳™׳•׳‘')) {
                            dateCol = j;
                            console.log(`ג“ Found date column at index ${j}`);
                        }
                    }

                    // Fallback to correct column indices based on actual Excel structure
                    if (businessNameCol === -1) {
                        businessNameCol = 1;
                        console.log(`ג ן¸ Business name column not found in headers, using index ${businessNameCol}`);
                    }
                    if (amountCol === -1) {
                        amountCol = 2;  // FIXED: Price is in column C (index 2)
                        console.log(`ג ן¸ Amount column not found in headers, using index ${amountCol}`);
                    }
                    if (cardCol === -1) {
                        cardCol = 3;  // FIXED: Card is in column D (index 3) - format: "׳™׳×׳¨׳” 6353"
                        console.log(`ג ן¸ Card column not found in headers, using index ${cardCol}`);
                    }
                    if (dateCol === -1) {
                        dateCol = 4;  // FIXED: Billing date is in column E (index 4)
                        console.log(`ג ן¸ Date column not found in headers, using index ${dateCol}`);
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
                            // Remove currency symbols (ג‚×, $, etc), commas, spaces
                            amountStr = amountStr.replace(/[ג‚×$ג‚¬ֲ£,\s]/g, '');
                            // Keep only digits, dots, and minus signs
                            amountStr = amountStr.replace(/[^\d.-]/g, '');
                            amount = parseFloat(amountStr);
                        }

                        if (isNaN(amount) || !isFinite(amount)) {
                            amount = 0;
                        }
                    }

                    // Column 3 contains card with balance (e.g., "׳™׳×׳¨׳” 6353")
                    // Extract only the card number (digits after "׳™׳×׳¨׳”")
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
                        console.log(`  ג†’ Read from columns: businessNameCol=${businessNameCol}, amountCol=${amountCol}, cardCol=${cardCol}, dateCol=${dateCol}`);
                        console.log(`  ג†’ Raw values: row[${businessNameCol}]="${row[businessNameCol]}", row[${amountCol}]="${row[amountCol]}", row[${cardCol}]="${row[cardCol]}", row[${dateCol}]="${row[dateCol]}"`);
                    }
                }



                // Skip rows with no business name
                if (!businessName) {
                    console.log(`Skipping row ${i}: no business name`);
                    continue;
                }

                // Format product name: [Business Name] ([Date]) ׳›׳¨׳˜׳™׳¡ [Card]
                let productName = businessName;

                if (billingDate) {
                    productName += ` (${billingDate})`;
                }

                if (cardNumber) {
                    // Extract last 4 digits if card number is longer
                    const cardDigits = cardNumber.replace(/\D/g, '').slice(-4);
                    if (cardDigits) {
                        productName += ` ׳›׳¨׳˜׳™׳¡ ${cardDigits}`;
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
                console.log(`ג… Created product: ${productName}, price: ${amount}`);
            }

            // Check if any products were found
            if (products.length === 0) {
                showNotification('ג ׳׳ ׳ ׳׳¦׳׳• ׳׳•׳¦׳¨׳™׳ ׳‘׳§׳•׳‘׳¥ ׳”׳׳§׳¡׳');
                event.target.value = '';
                return;
            }

            console.log(`נ“¦ Total products created: ${products.length}`);

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
            showNotification(`ג… ׳ ׳•׳¦׳¨׳” ׳¨׳©׳™׳׳” "${listName}" ׳¢׳ ${products.length} ׳׳•׳¦׳¨׳™׳!`);

            // Reset file input
            event.target.value = '';

        } catch (error) {
            console.error('Error parsing Excel file:', error);
            showNotification('ג ׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳§׳•׳‘׳¥ ׳”׳׳§׳¡׳. ׳׳ ׳ ׳•׳“׳ ׳©׳”׳§׳•׳‘׳¥ ׳×׳§׳™׳.');
            event.target.value = '';
        }
    };

    reader.onerror = function () {
        showNotification('ג ׳©׳’׳™׳׳” ׳‘׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥');
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
// flag: ׳›׳©׳׳’׳™׳¢׳™׳ ׳׳׳—׳™׳¦׳” ׳¢׳ ׳”׳×׳¨׳׳”, ׳ ׳¦׳™׳’ ׳’׳ ׳₪׳¨׳™׳˜׳™׳ ׳©׳¡׳•׳׳ ׳• ׳›-dismissed
let _forceShowAfterNotificationClick = false;

function checkUrgentPayments() {
    const now = Date.now();
    const alertItems = [];

    // ׳‘׳“׳•׳§ ׳׳ ׳”׳’׳¢׳ ׳• ׳׳׳—׳™׳¦׳” ׳¢׳ ׳”׳×׳¨׳׳” (׳“׳¨׳ flag ׳׳• sessionStorage)
    let forceShow = _forceShowAfterNotificationClick;
    _forceShowAfterNotificationClick = false;

    // ׳§׳¨׳ ׳’׳ ׳-sessionStorage (׳׳§׳¨׳” ׳©׳ ׳₪׳×׳™׳—׳× ׳—׳׳•׳ ׳—׳“׳© ׳׳”׳×׳¨׳׳”)
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

            // ׳׳ ׳”׳’׳¢׳ ׳• ׳׳׳—׳™׳¦׳” ׳¢׳ ׳”׳×׳¨׳׳” ׳¡׳₪׳¦׳™׳₪׳™׳× ג€” ׳”׳¦׳’ ׳¨׳§ ׳׳•׳×׳” (׳׳ ׳™׳“׳•׳¢׳”), ׳׳—׳¨׳× ׳”׳¦׳’ ׳›׳ ׳©׳¢׳‘׳¨ ׳–׳׳ ׳•
            if (pendingNotifItemName) {
                // ׳”׳¦׳’ ׳¨׳§ ׳”׳₪׳¨׳™׳˜ ׳©׳ ׳׳—׳¥ ׳¢׳׳™׳• ג€” ׳׳׳ ׳×׳׳•׳× ׳‘׳–׳׳
                if (item.name === pendingNotifItemName) {
                    alertItems.push({ item, idx, listId });
                }
                return;
            }

            if (now < alertTime) return; // not yet

            // Skip if user dismissed this alert ג€” ׳׳׳ ׳׳ ׳›׳ ׳”׳’׳¢׳ ׳• ׳׳׳—׳™׳¦׳” ׳¢׳ ׳”׳×׳¨׳׳”
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
    
    // ׳”׳¦׳’׳× ׳₪׳¨׳™׳˜׳™׳ ׳‘׳׳™׳—׳•׳¨
    if (overdueItemsFiltered.length > 0) {
        itemsHTML += '<div style="font-weight: bold; color: #ef4444; margin-bottom: 10px;">ג ן¸ ׳‘׳׳™׳—׳•׳¨:</div>';
        overdueItemsFiltered.forEach(item => {
            const formattedDate = formatDate(item.dueDate);
            const escapedName = (item.name || '').replace(/'/g, "\\'");
            itemsHTML += `
                <div class="urgent-item" style="border-right: 3px solid #ef4444; cursor:pointer;" onclick="goToItemFromAlert('${escapedName}')">
                    <div class="urgent-item-name">${item.name}</div>
                    <div class="urgent-item-date">נ“… ׳×׳׳¨׳™׳ ׳™׳¢׳“: ${formattedDate}</div>
                    <div style="font-size:0.72rem; color:#7367f0; margin-top:4px;">׳׳—׳¥ ׳׳¦׳₪׳™׳™׳” ׳‘׳׳•׳¦׳¨ ג†</div>
                </div>
            `;
        });
    }
    
    // ׳”׳¦׳’׳× ׳×׳–׳›׳•׳¨׳•׳× ׳¢׳×׳™׳“׳™׳•׳×
    if (upcomingItemsFiltered.length > 0) {
        if (overdueItemsFiltered.length > 0) {
            itemsHTML += '<div style="margin-top: 15px;"></div>';
        }
        itemsHTML += '<div style="font-weight: bold; color: #3b82f6; margin-bottom: 10px;">נ”” ׳×׳–׳›׳•׳¨׳•׳×:</div>';
        upcomingItemsFiltered.forEach(item => {
            const formattedDate = formatDate(item.dueDate);
            const dueDate = new Date(item.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.floor((dueDate - today) / 86400000);
            const daysText = daysUntil === 0 ? '׳”׳™׳•׳' : daysUntil === 1 ? '׳׳—׳¨' : `׳‘׳¢׳•׳“ ${daysUntil} ׳™׳׳™׳`;
            
            let reminderText = '';
            if (item.reminderValue && item.reminderUnit) {
                reminderText = ` (׳”׳×׳¨׳׳”: ${formatReminderText(item.reminderValue, item.reminderUnit)} ׳׳₪׳ ׳™)`;
            }
            
            const escapedName = (item.name || '').replace(/'/g, "\\'");
            itemsHTML += `
                <div class="urgent-item" style="border-right: 3px solid #3b82f6; cursor:pointer;" onclick="goToItemFromAlert('${escapedName}')">
                    <div class="urgent-item-name">${item.name}</div>
                    <div class="urgent-item-date">נ“… ׳×׳׳¨׳™׳ ׳™׳¢׳“: ${formattedDate} (${daysText})${reminderText}</div>
                    <div style="font-size:0.72rem; color:#7367f0; margin-top:4px;">׳׳—׳¥ ׳׳¦׳₪׳™׳™׳” ׳‘׳׳•׳¦׳¨ ג†</div>
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
            // snooze ׳₪׳¨׳™׳˜׳™׳ ׳©׳”׳×׳¨׳׳” ׳©׳׳”׳ ׳”׳’׳™׳¢׳” (׳¢׳‘׳¨ ׳–׳׳ ׳) ג€” ׳›׳•׳׳ ׳›׳׳׳” ׳©׳¡׳•׳׳ ׳• ׳›-dismissed
            // ׳”׳׳©׳×׳׳© ׳׳—׳¥ ׳‘׳›׳•׳•׳ ׳” ׳¢׳ snooze, ׳׳– ׳–׳” override
            if (now < alertTime) return;

            item.nextAlertTime = snoozeUntil;
            item.alertDismissedAt = null; // ׳ ׳§׳” dismiss ׳›׳“׳™ ׳©׳™׳•׳₪׳™׳¢ ׳©׳•׳‘
            snoozedAny = true;
        });
    });

    if (!snoozedAny) {
        // fallback: snooze ׳׳× ׳›׳ ׳”׳₪׳¨׳™׳˜׳™׳ ׳¢׳ dueDate (׳’׳ ׳׳ alertDismissedAt ׳§׳™׳™׳)
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
    showNotification('ג° ׳×׳•׳–׳›׳¨ ׳©׳•׳‘ ׳‘׳§׳¨׳•׳‘');
    // Re-schedule timers so the snoozed time is picked up
    checkAndScheduleNotifications();
}

// Close/dismiss urgent alert ג€” mark as dismissed so it won't auto-popup again
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

            item.alertDismissedAt = now; // mark dismissed ג€” stays in notification center
        });
    });
    save();
    closeModal('urgentAlertModal');
}

// Navigate to the specific item from the notification alert
function goToItemFromAlert(itemName) {
    closeModal('urgentAlertModal');

    // ׳—׳₪׳© ׳׳× ׳”׳₪׳¨׳™׳˜ ׳‘׳›׳ ׳”׳¨׳©׳™׳׳•׳×
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
        // ׳¢׳‘׳•׳¨ ׳׳¨׳©׳™׳׳” ׳”׳ ׳›׳•׳ ׳”
        if (db.currentId !== foundListId) {
            db.currentId = foundListId;
            save();
            render();
        }

        // ׳’׳׳•׳ ׳׳₪׳¨׳™׳˜ ׳•׳”׳“׳’׳© ׳׳•׳×׳•
        setTimeout(() => {
            const cards = document.querySelectorAll('.item-card');
            // ׳׳¦׳ ׳׳₪׳™ ׳׳™׳ ׳“׳§׳¡ ׳‘׳×׳¦׳•׳’׳” (׳׳׳—׳¨ render)
            const currentItems = db.lists[foundListId].items;
            // ׳¡׳™׳ ׳•׳ ׳׳₪׳™ ׳×׳¦׳•׳’׳” ׳ ׳•׳›׳—׳™׳× (׳›׳•׳׳ unchecked)
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
    // ׳˜׳¢׳ GitHub Token
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
                נ“… ${formatDate(item.dueDate)}${isOverdue ? ' (׳₪׳’ ׳×׳•׳§׳£!)' : ''}
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
                נ“ ${linkedNotes}
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
// ג”€ג”€ dismissed notifications stored in localStorage ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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

                // ׳‘׳“׳•׳§ ׳׳ ׳ ׳׳—׳§׳” ׳™׳“׳ ׳™׳× ׳׳׳¨׳›׳– ׳”׳”׳×׳¨׳׳•׳×
                const notifKey = makeNotifKey(listId, idx, dueDateMs);
                if (dismissed.includes(notifKey)) return;
                
                // ׳”׳¦׳’ ׳‘׳׳¨׳›׳– ׳”׳×׳¨׳׳•׳× ׳¨׳§ ׳׳ ׳™׳© ׳”׳×׳¨׳׳” ׳׳•׳’׳“׳¨׳×
                const hasReminder = !!(item.reminderValue && item.reminderUnit) || !!(item.nextAlertTime && item.nextAlertTime > 0);
                if (!hasReminder) return;

                // ׳”׳¦׳’ ׳׳× ׳”׳₪׳¨׳™׳˜ ג€” ׳™׳© ׳”׳×׳¨׳׳” (׳׳ ׳׳©׳ ׳” ׳׳ ׳”׳’׳™׳¢ ׳”׳–׳׳ ׳¢׳“׳™׳™׳)
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
    // ׳¨׳¢׳ ׳ badge ׳•-clear-all ׳‘׳׳‘׳“, ׳׳׳ re-render ׳׳׳ (׳”-swipe ׳¢׳¦׳׳• ׳׳•׳¨׳™׳“ ׳׳× ׳”׳§׳׳£)
    const items = getNotificationItems();
    const btn = document.getElementById('clearAllNotifsBtn');
    if (btn) btn.style.display = items.length > 0 ? 'flex' : 'none';
    const hint = document.getElementById('ncSwipeHint');
    if (hint) hint.style.display = items.length > 0 ? 'block' : 'none';
    if (items.length === 0) {
        const container = document.getElementById('notificationsList');
        if (container) container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:3rem;margin-bottom:12px;">נ‰</div>
                <div style="color:#7367f0;font-weight:700;font-size:1rem;">׳׳™׳ ׳”׳×׳¨׳׳•׳× ׳›׳¨׳’׳¢</div>
                <div style="color:#c4b5fd;font-size:0.82rem;margin-top:6px;">׳”׳›׳ ׳×׳—׳× ׳©׳׳™׳˜׳”!</div>
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
    openNotificationCenter(); // ׳¨׳¢׳ ׳
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
                <div style="font-size:3rem;margin-bottom:12px;">נ‰</div>
                <div style="color:#7367f0;font-weight:700;font-size:1rem;">׳׳™׳ ׳”׳×׳¨׳׳•׳× ׳›׳¨׳’׳¢</div>
                <div style="color:#c4b5fd;font-size:0.82rem;margin-top:6px;">׳”׳›׳ ׳×׳—׳× ׳©׳׳™׳˜׳”!</div>
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
                <div class="nc-swipe-bg left-swipe">נ—‘ן¸ ׳׳—׳§</div>
                <div class="nc-swipe-bg right-swipe">נ—‘ן¸ ׳׳—׳§</div>
            `;

            // Card
            let notifClass = 'soon';
            if (notif.isOverdue) notifClass = 'overdue';
            else if (notif.isUpcoming && !notif.isToday) notifClass = 'upcoming';

            let dateText = '';
            if (notif.isOverdue) {
                const d = Math.floor((new Date().setHours(0,0,0,0) - notif.dueDate) / 86400000);
                dateText = `ג ן¸ ׳׳™׳—׳•׳¨ ${d} ${d === 1 ? '׳™׳•׳' : '׳™׳׳™׳'}`;
            } else if (notif.isToday) {
                dateText = 'נ“… ׳”׳™׳•׳!';
            } else if (notif.isTomorrow) {
                dateText = 'נ“… ׳׳—׳¨';
            } else {
                const d = Math.floor((notif.dueDate - new Date().setHours(0,0,0,0)) / 86400000);
                if (notif.isUpcoming && notif.reminderValue && notif.reminderUnit) {
                    dateText = `נ”” ׳×׳–׳›׳•׳¨׳× ${formatReminderText(notif.reminderValue, notif.reminderUnit)} ׳׳₪׳ ׳™ ג€” ׳‘׳¢׳•׳“ ${d} ${d === 1 ? '׳™׳•׳' : '׳™׳׳™׳'}`;
                } else {
                    dateText = `נ“… ׳‘׳¢׳•׳“ ${d} ${d === 1 ? '׳™׳•׳' : '׳™׳׳™׳'}`;
                }
            }

            const card = document.createElement('div');
            card.className = `notification-item ${notifClass}`;
            card.innerHTML = `
                <div class="notification-item-title">${notif.item.name}</div>
                <div class="notification-item-date">${dateText}</div>
                <div class="notification-item-list">נ“‹ ${notif.listName}</div>
            `;
            card.addEventListener('click', () => jumpToItem(notif.listId, notif.itemIdx));

            wrap.appendChild(card);
            container.appendChild(wrap);

            // ג”€ג”€ Swipe to dismiss ג”€ג”€
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

        if (!dirLocked || !isHoriz) return; // vertical scroll ג€” don't touch the card

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

        if (!wasHoriz) return; // was a scroll ג€” nothing to do

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

    // Touch events ג€” touchmove is NOT passive so we keep native scroll for vertical
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
    return noteText.replace(urlRegex, '<a href="$1" target="_blank" style="color: #7367f0; text-decoration: underline;">׳§׳™׳©׳•׳¨</a>');
}

function toggleVoiceInput() {
    const input = document.getElementById('newItemInput');
    if (!input) return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('׳”׳“׳₪׳“׳₪׳ ׳׳ ׳×׳•׳׳ ׳‘׳–׳™׳”׳•׳™ ׳§׳•׳׳™', 'error');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    
    const voiceIcon = document.getElementById('voiceIcon');
    voiceIcon.textContent = 'ג÷ן¸';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        voiceIcon.textContent = 'נ₪';
        showNotification('ג… ׳–׳•׳”׳”: ' + transcript);
    };
    
    recognition.onerror = () => {
        voiceIcon.textContent = 'נ₪';
        showNotification('׳©׳’׳™׳׳” ׳‘׳–׳™׳”׳•׳™ ׳§׳•׳׳™', 'error');
    };
    
    recognition.onend = () => {
        voiceIcon.textContent = 'נ₪';
    };
    
    try {
        recognition.start();
        showNotification('נ₪ ׳׳׳–׳™׳...');
    } catch (error) {
        voiceIcon.textContent = 'נ₪';
        showNotification('׳©׳’׳™׳׳” ׳‘׳”׳₪׳¢׳׳× ׳”׳׳™׳§׳¨׳•׳₪׳•׳', 'error');
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
        showNotification('ג… ' + name + ' ׳ ׳•׳¡׳£!');
    }
}

function createNewList() {
    const name = prompt('׳©׳ ׳”׳¨׳©׳™׳׳” ׳”׳—׳“׳©׳”:');
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
            showNotification('ג… ׳¨׳©׳™׳׳” ׳—׳“׳©׳” ׳ ׳•׳¦׳¨׳”!');
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
    if (confirm('׳׳׳—׳•׳§ ׳׳× ׳›׳ ׳”׳₪׳¨׳™׳˜׳™׳ ׳”׳׳¡׳•׳׳ ׳™׳?')) {
        db.lists[db.currentId].items = db.lists[db.currentId].items.filter(item => !item.checked);
        save();
        showNotification('נ—‘ן¸ ׳₪׳¨׳™׳˜׳™׳ ׳׳¡׳•׳׳ ׳™׳ ׳ ׳׳—׳§׳•');
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
        const cat = item.category || '׳׳—׳¨';
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
    showNotification('׳™׳¦׳•׳ ׳׳׳§׳¡׳ - ׳‘׳₪׳™׳×׳•׳—');
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

        console.log('ג… Clipboard text found, length:', clipboardText.length);

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
            console.log('נ†• New clipboard text detected!');
            clipboardState.lastClipboardText = clipboardText;
            clipboardState.clipboardDismissed = false;
            clipboardState.clipboardImported = false;
            localStorage.setItem('clipboardState', JSON.stringify(clipboardState));
        }

        // Show import modal
        showClipboardImportModal(clipboardText);

    } catch (error) {
        console.log('ג Clipboard access error:', error.name, error.message);
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
    if (label) label.textContent = isOn ? '׳׳•׳₪׳¢׳' : '׳׳•׳©׳‘׳×';
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
    if (label) { label.textContent = autoOpen ? '׳׳•׳₪׳¢׳' : '׳׳•׳©׳‘׳×'; label.style.color = autoOpen ? '#7367f0' : '#94a3b8'; }

    // Set the text
    textarea.value = text;
    pendingImportText = text;

    // Detect list type
    detectedListType = detectListType(text);
    
    // Show detected type
    const typeNames = {
        'shopping': 'נ›’ ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳×',
        'appointment': 'נ¥ ׳×׳•׳¨/׳₪׳’׳™׳©׳”',
        'tasks': 'ג… ׳¨׳©׳™׳׳× ׳׳©׳™׳׳•׳×',
        'general': 'נ“ ׳¨׳©׳™׳׳” ׳›׳׳׳™׳×'
    };
    
    detectedTypeName.textContent = typeNames[detectedListType] || 'נ“ ׳¨׳©׳™׳׳” ׳›׳׳׳™׳×';
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
            'shopping': 'נ›’ ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳×',
            'appointment': 'נ¥ ׳×׳•׳¨/׳₪׳’׳™׳©׳”',
            'tasks': 'ג… ׳¨׳©׳™׳׳× ׳׳©׳™׳׳•׳×',
            'general': 'נ“ ׳¨׳©׳™׳׳” ׳›׳׳׳™׳×'
        };
        
        detectedTypeName.textContent = typeNames[detectedListType] || 'נ“ ׳¨׳©׳™׳׳” ׳›׳׳׳™׳×';
        detectedTypeDiv.style.display = 'block';
    } else {
        // No text yet - set default
        detectedListType = 'shopping';
        detectedTypeName.textContent = 'נ›’ ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳×';
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
            'shopping': 'נ›’ ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳×',
            'appointment': 'נ¥ ׳×׳•׳¨/׳₪׳’׳™׳©׳”',
            'tasks': 'ג… ׳¨׳©׳™׳׳× ׳׳©׳™׳׳•׳×',
            'general': 'נ“ ׳¨׳©׳™׳׳” ׳›׳׳׳™׳×'
        };
        
        detectedTypeName.textContent = typeNames[detectedListType] || 'נ“ ׳¨׳©׳™׳׳” ׳›׳׳׳™׳×';
    }
}

// Detect list type from text
function detectListType(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // Check for appointment indicators - IMPROVED
    const appointmentKeywords = [
        '׳×׳•׳¨', '׳₪׳’׳™׳©׳”', '׳“"׳¨', '׳“׳•׳§׳˜׳•׳¨', '׳¨׳•׳₪׳', '׳׳¨׳₪׳׳”', '׳‘׳™׳× ׳—׳•׳׳™׳', '׳§׳׳™׳ ׳™׳§׳”',
        '׳׳›׳‘׳™׳“׳ ׳˜', '׳›׳׳׳™׳×', '׳׳׳•׳—׳“׳×', '׳׳׳•׳׳™׳×', '׳₪׳¨׳•׳₪', '׳׳•׳׳—׳”',
        '׳˜׳™׳₪׳•׳', '׳‘׳“׳™׳§׳”', '׳™׳™׳¢׳•׳¥', '׳ ׳™׳×׳•׳—', '׳¦׳™׳׳•׳', '׳׳•׳׳˜׳¨׳¡׳׳•׳ ׳“'
    ];
    const hasAppointmentKeyword = appointmentKeywords.some(keyword => text.includes(keyword));
    
    // Check for date/time patterns
    const datePattern = /\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]?\d{0,4}/;
    const timePattern = /\d{1,2}:\d{2}|׳‘׳©׳¢׳”|׳©׳¢׳”/;
    const hasDateTime = datePattern.test(text) || timePattern.test(text);
    
    // Check for phone pattern
    const phonePattern = /0\d{1,2}[\-\s]?\d{3,4}[\-\s]?\d{3,4}|׳˜׳׳₪׳•׳|׳˜׳:|׳ ׳™׳™׳“/;
    const hasPhone = phonePattern.test(text);
    
    // Check for URL (common in appointments)
    const hasUrl = /https?:\/\//.test(text);
    
    // Check for address pattern
    const addressPattern = /׳¨׳—׳•׳‘|׳¨׳—'|׳›׳×׳•׳‘׳×|׳׳™׳§׳•׳|׳§׳•׳׳”|׳‘׳ ׳™׳™׳/;
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
    const pricePattern = /\d+\s*׳©"׳—|ג‚×\s*\d+|\d+\s*׳©׳§׳/;
    const hasPrice = pricePattern.test(text);
    
    // Check for common shopping items
    const shoppingKeywords = ['׳—׳׳‘', '׳׳—׳', '׳‘׳™׳¦׳™׳', '׳’׳‘׳™׳ ׳”', '׳™׳•׳’׳•׳¨׳˜', '׳¢׳’׳‘׳ ׳™׳•׳×', '׳׳׳₪׳₪׳•׳', '׳‘׳©׳¨', '׳¢׳•׳£', '׳“׳’׳™׳'];
    const shoppingItemCount = shoppingKeywords.filter(keyword => text.includes(keyword)).length;
    
    if (hasPrice || shoppingItemCount >= 2 || (lines.length >= 3 && lines.length <= 30 && !hasDateTime)) {
        return 'shopping';
    }
    
    // Check for tasks indicators
    const taskKeywords = ['׳׳©׳™׳׳”', '׳׳¢׳©׳•׳×', '׳׳”׳©׳׳™׳', '׳׳‘׳“׳•׳§', '׳׳§׳ ׳•׳×', '׳׳”׳×׳§׳©׳¨'];
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
        'shopping': 'נ›’ ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳×',
        'appointment': 'נ¥ ׳×׳•׳¨/׳₪׳’׳™׳©׳”',
        'tasks': 'ג… ׳¨׳©׳™׳׳× ׳׳©׳™׳׳•׳×',
        'general': 'נ“ ׳¨׳©׳™׳׳” ׳›׳׳׳™׳×'
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
    
    showNotification('ג… ׳‘׳—׳¨ ׳¨׳©׳™׳׳” ׳׳• ׳¦׳•׳¨ ׳¨׳©׳™׳׳” ׳—׳“׳©׳” ׳׳”׳•׳¡׳₪׳× ׳”׳₪׳¨׳™׳˜׳™׳');
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
    showNotification(`ג… ${items.length} ׳₪׳¨׳™׳˜׳™׳ ׳ ׳•׳¡׳₪׳• ׳׳¨׳©׳™׳׳”!`);
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
        
        // Handle 2-digit year (26 ג†’ 2026)
        if (year.length === 2) {
            year = '20' + year;
        }
        
        dueDate = `${year}-${month}-${day}`;
    }
    
    // Extract time - IMPROVED with multiple patterns
    let timeMatch = text.match(/׳‘׳©׳¢׳”\s+(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
        timeMatch = text.match(/׳©׳¢׳”\s+(\d{1,2}):(\d{2})/);
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
    // Pattern 1: "׳×׳•׳¨ ׳[׳©׳]" - extract the name after "׳"
    const namePattern1 = /׳×׳•׳¨ ׳(\w+)/;
    const nameMatch1 = text.match(namePattern1);
    if (nameMatch1) {
        const personName = nameMatch1[1];
        
        // Also look for clinic/location name
        const clinicPattern = /(׳׳›׳‘׳™׳“׳ ׳˜|׳›׳׳׳™׳×|׳׳׳•׳—׳“׳×|׳׳׳•׳׳™׳×)[\s\w-]*/;
        const clinicMatch = text.match(clinicPattern);
        
        if (clinicMatch) {
            name = `׳×׳•׳¨ ׳${personName} - ${clinicMatch[0]}`;
        } else {
            name = `׳×׳•׳¨ ׳${personName}`;
        }
    }
    
    // Pattern 2: Look for doctor/clinic names if no "׳×׳•׳¨ ׳" found
    if (!name) {
        for (const line of lines) {
            if (line.includes('׳“"׳¨') || line.includes('׳“׳•׳§׳˜׳•׳¨') || line.includes('׳¨׳•׳₪׳') || 
                line.includes('׳₪׳¨׳•׳₪') || line.includes('׳׳¨׳₪׳׳”') || line.includes('׳§׳׳™׳ ׳™׳§׳”')) {
                name = line;
                break;
            }
        }
    }
    
    // Pattern 3: Look for specific clinic names
    if (!name) {
        const clinicPattern = /(׳׳›׳‘׳™׳“׳ ׳˜|׳›׳׳׳™׳×|׳׳׳•׳—׳“׳×|׳׳׳•׳׳™׳×)[\s\w-]*/;
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
    const locationPattern = /(׳׳›׳‘׳™׳“׳ ׳˜|׳›׳׳׳™׳×|׳׳׳•׳—׳“׳×|׳׳׳•׳׳™׳×)[\s\w-]*/;
    const locationMatch = text.match(locationPattern);
    if (locationMatch) {
        location = locationMatch[0];
    }
    
    // Pattern 2: Street/address patterns
    if (!location) {
        for (const line of lines) {
            if (line.includes('׳¨׳—׳•׳‘') || line.includes('׳¨׳—\'') || line.includes('׳›׳×׳•׳‘׳×') || 
                line.includes('׳׳™׳§׳•׳') || line.includes('׳‘-') || /\d+\s*\w+/.test(line)) {
                location = line;
                break;
            }
        }
    }
    
    // Extract doctor/contact person - IMPROVED
    const doctorPattern = /(?:׳)?׳’׳‘['׳³]?\s+(\w+\s+\w+)|(?:׳)?׳“["׳´]׳¨\s+(\w+\s+\w+)|(?:׳)?׳₪׳¨׳•׳₪['׳³]?\s+(\w+\s+\w+)/;
    const doctorMatch = text.match(doctorPattern);
    let doctorName = '';
    if (doctorMatch) {
        doctorName = 'נ‘₪ ' + doctorMatch[0];
    }
    
    // Build notes from remaining text
    const noteParts = [];
    
    // Add doctor name if found
    if (doctorName) {
        noteParts.push(doctorName);
    }
    
    // Add location if found
    if (location) {
        noteParts.push('נ“ ' + location);
    }
    
    // Add phone if found
    if (phone) {
        noteParts.push('ג˜ן¸ ' + phone);
    }
    
    // Add URL if found
    if (url) {
        noteParts.push('נ”— ' + url);
    }
    
    // Add remaining text as notes (filter out already extracted info)
    for (const line of lines) {
        const lineClean = line.trim();
        if (lineClean.length < 3) continue;
        
        const isExtracted = 
            (name && lineClean.includes(name.replace('׳×׳•׳¨ ׳', '').replace(' - ', ''))) ||
            (location && lineClean.includes(location)) ||
            (phone && lineClean.includes(phone)) ||
            (url && lineClean.includes(url)) ||
            (doctorName && lineClean.includes(doctorName.replace('נ‘₪ ', ''))) ||
            (dueTime && lineClean.includes(dueTime)) ||
            (dateMatch && lineClean.includes(dateMatch[0]));
        
        if (!isExtracted) {
            noteParts.push(lineClean);
        }
    }
    
    notes = noteParts.join('\n');
    
    return [{
        name: name || '׳₪׳’׳™׳©׳”',
        price: 0,
        qty: 0,  // No quantity for appointments
        checked: false,
        category: '׳×׳•׳¨/׳₪׳’׳™׳©׳”',
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
        
        // Pattern: "׳—׳׳‘ 12" or "׳—׳׳‘ 12 ׳©"׳—" or "׳—׳׳‘ ג‚×12"
        const pricePattern = /(.+?)\s*[ג‚×]?\s*(\d+(?:\.\d+)?)\s*(?:׳©"׳—|׳©׳§׳)?/;
        const match = line.match(pricePattern);
        
        if (match) {
            name = match[1].trim();
            price = parseFloat(match[2]) || 0;
        }
        
        // Auto-detect category
        const category = detectCategory(name) || '׳׳—׳¨';
        
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
        category: '׳׳—׳¨',
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
        // ׳׳ ׳”׳’׳¢׳ ׳• ׳׳׳—׳™׳¦׳” ׳¢׳ ׳”׳×׳¨׳׳” (URL param ׳׳• SW) ג€” ׳“׳׳’ ׳¢׳ ׳”-modal ׳”׳׳•׳˜׳•׳׳˜׳™,
        // ׳›׳™ checkNotificationUrlParam ׳™׳¦׳™׳’ ׳‘׳¢׳¦׳׳• ׳¨׳§ ׳׳× ׳”׳”׳×׳¨׳׳” ׳”׳ ׳•׳›׳—׳™׳×
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





// ========== ׳׳¢׳¨׳›׳× ׳×׳–׳›׳•׳¨׳•׳× ג€” ׳ ׳‘׳ ׳×׳” ׳׳—׳“׳© ==========
//
// ׳׳¨׳›׳™׳˜׳§׳˜׳•׳¨׳” ׳ ׳§׳™׳™׳”:
//   nextAlertTime  ג€” ׳׳×׳™ ׳×׳™׳¨׳” ׳”׳”׳×׳¨׳׳” (ms epoch). snooze = ׳¢׳“׳›׳•׳ ׳׳¢׳×׳™׳“.
//   alertDismissedAt ג€” ׳׳×׳™ ׳¡׳’׳¨ ׳”׳׳©׳×׳׳© (= nextAlertTime ׳©׳ ׳׳•׳×׳” ׳₪׳¢׳).
//   dismiss ׳׳ ׳׳©׳ ׳” nextAlertTime ג€” ׳¨׳§ ׳׳•׳ ׳¢ popup ׳׳•׳˜׳•׳׳˜׳™.
//   snooze ׳׳•׳—׳§ alertDismissedAt ׳•׳׳’׳“׳™׳¨ nextAlertTime ׳—׳“׳©.
// ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

let _reminderTimers = new Map();
// _forceShowAfterNotificationClick declared above (line 6500)

// ג”€ג”€ ׳—׳™׳©׳•׳‘ ׳–׳׳ ׳”׳”׳×׳¨׳׳” ׳”׳˜׳‘׳¢׳™ ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function computeNextAlertTime(item) {
    if (!item.dueDate || !item.reminderValue || !item.reminderUnit) return null;
    const timeStr = item.dueTime || '09:00';
    const [h, m] = timeStr.split(':');
    const due = new Date(item.dueDate);
    due.setHours(parseInt(h), parseInt(m), 0, 0);
    const reminderMs = getReminderMilliseconds(item.reminderValue, item.reminderUnit);
    return due.getTime() - reminderMs;
}

// ג”€ג”€ initItemAlertTime: ׳§׳¨׳ ׳‘׳¢׳× ׳™׳¦׳™׳¨׳”/׳¢׳¨׳™׳›׳” ׳©׳ ׳₪׳¨׳™׳˜ ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function initItemAlertTime(item) {
    const natural = computeNextAlertTime(item);
    if (!natural) {
        item.nextAlertTime = null;
        return;
    }
    const now = Date.now();
    // ׳׳ ׳׳™׳ nextAlertTime, ׳׳• ׳׳ ׳©׳™׳ ׳• ׳׳× ׳”׳×׳׳¨׳™׳/׳×׳–׳›׳•׳¨׳× ג€” ׳׳₪׳¡
    if (!item.nextAlertTime || item.nextAlertTime <= now) {
        item.nextAlertTime = natural;
        item.alertDismissedAt = null;
    }
    // ׳׳ ׳™׳© nextAlertTime ׳‘׳¢׳×׳™׳“ (snooze) ג€” ׳©׳׳•׳¨ ׳׳•׳×׳•
}

// ג”€ג”€ snoozeUrgentAlert: ׳“׳—׳” ׳׳× ׳”׳”׳×׳¨׳׳” ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function snoozeUrgentAlert(ms) {
    const now = Date.now();
    const snoozeUntil = now + ms;
    let count = 0;

    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            if (!item.nextAlertTime) return;
            // snooze ׳₪׳¨׳™׳˜׳™׳ ׳©׳”׳×׳¨׳׳” ׳©׳׳”׳ ׳”׳’׳™׳¢׳” (׳‘׳¢׳‘׳¨) ג€” ׳׳׳” ׳”׳ ׳•׳›׳—׳™׳™׳
            // ׳’׳ ׳׳ dismissed ג€” snooze ׳׳ ׳¦׳— (׳”׳׳©׳×׳׳© ׳‘׳—׳¨ ׳׳₪׳•׳¨׳©׳•׳×)
            if (item.nextAlertTime > now && !item.alertDismissedAt) return;
            item.nextAlertTime = snoozeUntil;
            item.alertDismissedAt = null; // ׳ ׳§׳” dismiss
            count++;
        });
    });

    if (count === 0) {
        // fallback: snooze ׳›׳ ׳₪׳¨׳™׳˜ ׳¢׳ ׳×׳–׳›׳•׳¨׳×
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
    _scheduleAllReminders(); // ׳¨׳©׳•׳ timers ׳—׳“׳©׳™׳ ׳׳™׳“

    const label = ms < 3600000
        ? Math.round(ms / 60000) + ' ׳“׳§׳•׳×'
        : ms < 86400000 ? Math.round(ms / 3600000) + ' ׳©׳¢׳•׳×'
        : Math.round(ms / 86400000) + ' ׳™׳׳™׳';
    showNotification('ג° ׳×׳•׳–׳›׳¨ ׳‘׳¢׳•׳“ ' + label, 'info');
}

// ג”€ג”€ closeUrgentAlert: dismiss ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function closeUrgentAlert() {
    const now = Date.now();
    Object.values(db.lists).forEach(list => {
        (list.items || []).forEach(item => {
            if (item.checked || item.isPaid || !item.dueDate) return;
            const t = item.nextAlertTime;
            if (!t || t > now) return;
            if (item.alertDismissedAt && item.alertDismissedAt >= t) return;
            item.alertDismissedAt = t; // ׳¡׳׳ dismissed ׳¢׳‘׳•׳¨ ׳–׳׳ ׳–׳” ׳‘׳׳‘׳“
        });
    });
    save();
    closeModal('urgentAlertModal');
}

// ג”€ג”€ checkUrgentPayments: ׳‘׳“׳•׳§ ׳•׳”׳¦׳’ ׳”׳×׳¨׳׳•׳× ׳©׳”׳’׳™׳¢׳• ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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

// ג”€ג”€ showUrgentAlertModal ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function showUrgentAlertModal(urgentItems) {
    const modal = document.getElementById('urgentAlertModal');
    const itemsList = document.getElementById('urgentItemsList');
    if (!modal || !itemsList) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdue  = urgentItems.filter(i => { const d = new Date(i.dueDate); d.setHours(0,0,0,0); return d < today; });
    const upcoming = urgentItems.filter(i => { const d = new Date(i.dueDate); d.setHours(0,0,0,0); return d >= today; });

    let html = '';

    if (overdue.length > 0) {
        html += '<div style="font-weight:bold;color:#ef4444;margin-bottom:10px;">ג ן¸ ׳‘׳׳™׳—׳•׳¨:</div>';
        overdue.forEach(item => {
            const esc = (item.name || '').replace(/'/g, "\'");
            html += `<div class="urgent-item" style="border-right:3px solid #ef4444;cursor:pointer;" onclick="goToItemFromAlert('${esc}')">
                <div class="urgent-item-name">${item.name}</div>
                <div class="urgent-item-date">נ“… ׳×׳׳¨׳™׳ ׳™׳¢׳“: ${formatDate(item.dueDate)}</div>
                <div style="font-size:0.72rem;color:#7367f0;margin-top:4px;">׳׳—׳¥ ׳׳¦׳₪׳™׳™׳” ׳‘׳׳•׳¦׳¨ ג†</div>
            </div>`;
        });
    }

    if (upcoming.length > 0) {
        if (overdue.length > 0) html += '<div style="margin-top:15px;"></div>';
        html += '<div style="font-weight:bold;color:#3b82f6;margin-bottom:10px;">נ”” ׳×׳–׳›׳•׳¨׳•׳×:</div>';
        upcoming.forEach(item => {
            const d = new Date(item.dueDate); d.setHours(0,0,0,0);
            const days = Math.floor((d - today) / 86400000);
            const daysText = days === 0 ? '׳”׳™׳•׳' : days === 1 ? '׳׳—׳¨' : `׳‘׳¢׳•׳“ ${days} ׳™׳׳™׳`;
            const reminderText = item.reminderValue && item.reminderUnit
                ? ` (׳”׳×׳¨׳׳”: ${formatReminderText(item.reminderValue, item.reminderUnit)} ׳׳₪׳ ׳™)` : '';
            const esc = (item.name || '').replace(/'/g, "\'");
            html += `<div class="urgent-item" style="border-right:3px solid #3b82f6;cursor:pointer;" onclick="goToItemFromAlert('${esc}')">
                <div class="urgent-item-name">${item.name}</div>
                <div class="urgent-item-date">נ“… ${formatDate(item.dueDate)} (${daysText})${reminderText}</div>
                <div style="font-size:0.72rem;color:#7367f0;margin-top:4px;">׳׳—׳¥ ׳׳¦׳₪׳™׳™׳” ׳‘׳׳•׳¦׳¨ ג†</div>
            </div>`;
        });
    }

    itemsList.innerHTML = html;
    modal.classList.add('active');
}

// ג”€ג”€ _scheduleAllReminders: ׳”׳’׳“׳¨ timers ׳׳›׳ ׳”׳₪׳¨׳™׳˜׳™׳ ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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
                // ׳”׳’׳™׳¢ ׳›׳‘׳¨ ג€” ׳”׳¦׳’
                checkUrgentPayments();
            }
        });
    });
}

// ג”€ג”€ _firePushNotification: ׳©׳׳— push ׳“׳¨׳ SW ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function _firePushNotification(item) {
    const title = `ג° ׳×׳–׳›׳•׳¨׳×: ${item.name}`;
    const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString('he-IL') : '';
    const timeStr = item.dueTime ? ' ׳‘׳©׳¢׳” ' + item.dueTime : '';
    const body = dateStr ? `׳™׳¢׳“: ${dateStr}${timeStr}` : '׳™׳© ׳׳ ׳×׳–׳›׳•׳¨׳×';
    const data = { type: 'reminder', itemName: item.name, dueDate: item.dueDate || '', dueTime: item.dueTime || '' };

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION', title, body,
            tag: 'reminder-' + (item.cloudId || item.name), data
        });
    }
}

// ג”€ג”€ initNotificationSystem ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
async function initNotificationSystem() {
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    _scheduleAllReminders();
    checkUrgentPayments();
    // heartbeat ג€” ׳’׳™׳‘׳•׳™ ׳missed timers
    setInterval(checkUrgentPayments, 30000);
}

window.addEventListener('load', () => { setTimeout(initNotificationSystem, 2000); });

// ׳›׳©׳ ׳©׳׳¨ ג€” ׳¨׳©׳•׳ ׳׳—׳“׳©
const _origSave = save;
save = function() {
    _origSave.apply(this, arguments);
    setTimeout(_scheduleAllReminders, 150);
};

// ג”€ג”€ Custom Snooze ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function openCustomSnooze() {
    closeModal('urgentAlertModal');
    openModal('customSnoozeModal');
}

function applyCustomSnooze() {
    const value = parseFloat(document.getElementById('customSnoozeValue').value);
    const unit  = document.getElementById('customSnoozeUnit').value;
    if (!value || value <= 0) { showNotification('ג ן¸ ׳ ׳ ׳׳”׳–׳™׳ ׳׳¡׳₪׳¨ ׳—׳™׳•׳‘׳™', 'warning'); return; }
    const ms = unit === 'minutes' ? value * 60000
             : unit === 'hours'   ? value * 3600000
             : value * 86400000;
    snoozeUrgentAlert(ms);
    closeModal('customSnoozeModal');
    document.getElementById('customSnoozeValue').value = '1';
    document.getElementById('customSnoozeUnit').value  = 'hours';
}

// ג”€ג”€ Legacy stubs ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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

// ג”€ג”€ SW Message Listener ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
// flag: ׳׳•׳ ׳¢ ׳׳”-startup modal ׳׳”׳•׳₪׳™׳¢ ׳›׳©׳׳’׳™׳¢׳™׳ ׳׳”׳×׳¨׳׳” ׳“׳¨׳ SW
let _suppressStartupModal = false;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'NOTIFICATION_ACTION' || msg.type === 'SHOW_URGENT_ALERT') {
            const action = msg.action || 'show';
            if (action === 'snooze-10')  { snoozeUrgentAlert(10 * 60 * 1000); return; }
            if (action === 'snooze-60')  { snoozeUrgentAlert(60 * 60 * 1000); return; }
            _suppressStartupModal = true; // ׳׳ ׳¢ modal ׳׳•׳˜׳•׳׳˜׳™
            closeModal('urgentAlertModal');
            _forceShowAfterNotificationClick = true;
            checkUrgentPayments();
        }

        if (msg.type === 'ALERT_DATA_RESPONSE') {
            if (msg.data && msg.data.action) {
                const action = msg.data.action;
                if (action === 'snooze-10') { snoozeUrgentAlert(10 * 60 * 1000); return; }
                if (action === 'snooze-60') { snoozeUrgentAlert(60 * 60 * 1000); return; }
                _suppressStartupModal = true; // ׳׳ ׳¢ modal ׳׳•׳˜׳•׳׳˜׳™
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

// ג”€ג”€ URL Param Handler (׳›׳©׳ ׳₪׳×׳— ׳׳”׳×׳¨׳׳”) ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
function checkNotificationUrlParam() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('vplus-action');
    if (action) {
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => {
            if (action === 'snooze-10') { snoozeUrgentAlert(10 * 60 * 1000); return; }
            if (action === 'snooze-60') { snoozeUrgentAlert(60 * 60 * 1000); return; }
            closeModal('urgentAlertModal'); // ׳¡׳’׳•׳¨ modal ׳™׳©׳ ׳©׳ ׳₪׳×׳— ׳‘-startup ׳׳₪׳ ׳™ ׳”׳¦׳’׳× ׳”׳ ׳›׳•׳
            _forceShowAfterNotificationClick = true;
            checkUrgentPayments();
        }, 1500);
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'GET_ALERT_DATA' });
    }
}
window.addEventListener('load', () => { setTimeout(checkNotificationUrlParam, 1000); });


// ג•‘    נ§™ VPLUS WIZARD ג€” Full-Screen Cinematic Experience v3        ג•‘
// ג•‘    ׳›׳ ׳׳—׳™׳¦׳” = ׳׳¡׳ ׳”׳¡׳‘׳¨ ׳׳׳, ׳׳¨׳”׳™׳‘, ׳׳ ׳™׳׳˜׳™׳‘׳™                    ג•‘
// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•

let wizardMode = false;
let _wizDismissCallback = null;
let _wizAutoTimer       = null;

// ג”€ג”€ Content library ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
const WIZ = {
    plusBtn: {
        emoji:'ג•', phase:'before', emojiColor:'#22c55e',
        title:'׳”׳•׳¡׳₪׳× ׳׳•׳¦׳¨ ׳׳¨׳©׳™׳׳”',
        body:'׳׳—׳¥ ׳׳× ׳”׳›׳₪׳×׳•׳¨ ׳”׳™׳¨׳•׳§ ׳›׳“׳™ ׳׳₪׳×׳•׳— ׳׳× ׳—׳׳•׳ ׳”׳•׳¡׳₪׳× ׳”׳׳•׳¦׳¨.\n׳×׳•׳›׳ ׳׳”׳–׳™׳ ׳©׳, ׳׳—׳™׳¨, ׳›׳׳•׳× ׳•׳§׳˜׳’׳•׳¨׳™׳”.',
        tip:'נ’¡ ׳˜׳™׳₪: ׳”׳₪׳¢׳ "׳”׳•׳¡׳₪׳” ׳¨׳¦׳™׳₪׳”" ׳›׳“׳™ ׳׳”׳•׳¡׳™׳£ ׳›׳׳” ׳׳•׳¦׳¨׳™׳ ׳‘׳¨׳¦׳£ ׳׳”׳™׳¨!',
    },
    voiceBought: {
        emoji:'ג…', phase:'before',
        title:'׳§׳ ׳™׳×׳™ ג€” ׳¡׳™׳׳•׳ ׳§׳•׳׳™',
        body:'׳׳—׳¥ ׳•׳׳׳•׳¨ ׳‘׳§׳•׳ ׳©׳ ׳©׳ ׳׳•׳¦׳¨ ׳©׳›׳‘׳¨ ׳§׳ ׳™׳×.\n׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳×׳׳¦׳ ׳׳•׳×׳• ׳‘׳¨׳©׳™׳׳” ׳•׳×׳¡׳׳ ׳׳•׳×׳• ׳›׳ ׳¨׳›׳© ׳׳•׳˜׳•׳׳˜׳™׳×.\n׳׳ ׳”׳׳•׳¦׳¨ ׳›׳‘׳¨ ׳׳¡׳•׳׳ ג€” ׳×׳§׳‘׳ ׳”׳•׳“׳¢׳” ׳©׳”׳•׳ ׳›׳‘׳¨ ׳ ׳¨׳›׳©.',
        tip:'נ’¡ ׳×׳•׳›׳ ׳׳‘׳˜׳ ׳‘׳§׳׳•׳× ׳¢׳ ׳›׳₪׳×׳•׳¨ "׳‘׳™׳˜׳•׳" ׳©׳™׳•׳₪׳™׳¢ ׳׳™׳“ ׳׳—׳¨׳™ ׳”׳¡׳™׳׳•׳.',
    },
    voiceTobuy: {
        emoji:'נ›ן¸', phase:'before',
        title:'׳׳§׳ ׳•׳× ג€” ׳—׳™׳₪׳•׳© ׳§׳•׳׳™',
        body:'׳׳—׳¥ ׳•׳׳׳•׳¨ ׳©׳ ׳׳•׳¦׳¨.\nג… ׳׳ ׳§׳™׳™׳ ׳•׳׳¡׳•׳׳ ג€” ׳™׳•׳—׳–׳¨ ׳׳׳¦׳‘ ׳׳§׳ ׳•׳×.\nנ“‹ ׳׳ ׳§׳™׳™׳ ׳•׳׳ ׳ ׳¨׳›׳© ג€” ׳×׳§׳‘׳ ׳”׳•׳“׳¢׳” ׳©׳”׳•׳ ׳›׳‘׳¨ ׳׳׳×׳™׳.\nג• ׳׳ ׳׳ ׳§׳™׳™׳ ׳‘׳¨׳©׳™׳׳” ג€” ׳×׳•׳¦׳¢ ׳׳ ׳׳₪׳©׳¨׳•׳× ׳׳”׳•׳¡׳™׳£ ׳׳•׳×׳•.',
        tip:'נ’¡ ׳©׳™׳׳•׳©׳™ ׳›׳©׳˜׳¢׳™׳× ׳‘׳¡׳™׳׳•׳, ׳׳• ׳›׳©׳׳•׳¦׳¨ ׳©׳’׳׳¨ ׳¦׳¨׳™׳ ׳׳—׳–׳•׳¨ ׳׳¨׳©׳™׳׳”.',
    },
    plusDone: {
        emoji:'נ‰', phase:'after',
        title:'׳׳•׳¦׳¨ ׳ ׳•׳¡׳£ ׳‘׳”׳¦׳׳—׳”!',
        body:'׳”׳׳•׳¦׳¨ ׳ ׳•׳¡׳£ ׳׳¨׳©׳™׳׳” ׳©׳׳.\n׳”׳¡׳›׳•׳ ׳”׳›׳•׳׳ ׳”׳×׳¢׳“׳›׳ ׳׳•׳˜׳•׳׳˜׳™׳×.',
        tip:'נ’¡ ׳׳—׳¥ ג• ׳©׳•׳‘ ׳׳”׳•׳¡׳₪׳× ׳׳•׳¦׳¨ ׳ ׳•׳¡׳£, ׳׳• ׳’׳׳•׳ ׳׳׳˜׳” ׳׳¨׳׳•׳× ׳׳× ׳”׳¨׳©׳™׳׳”.',
    },
    checkItem: {
        emoji:'ג…', phase:'before',
        title:'׳¡׳™׳׳•׳ ׳׳•׳¦׳¨ ׳›׳¨׳›׳•׳©',
        body:'׳׳—׳¥ ׳¢׳ ׳”׳›׳¨׳˜׳™׳¡ ׳›׳“׳™ ׳׳¡׳׳ ׳©׳¨׳›׳©׳× ׳׳× ׳”׳׳•׳¦׳¨.\n׳”׳׳•׳¦׳¨ ׳™׳•׳¢׳‘׳¨ ׳׳¨׳©׳™׳׳× "׳©׳•׳׳".',
        tip:'נ’¡ ׳©׳™׳ ׳™׳× ׳׳× ׳“׳¢׳×׳? ׳׳—׳¥ ׳©׳•׳‘ ׳›׳“׳™ ׳׳‘׳˜׳ ׳׳× ׳”׳¡׳™׳׳•׳.',
    },
    checkDone: {
        emoji:'ג…', phase:'after',
        title:'׳׳•׳¦׳¨ ׳¡׳•׳׳!',
        body:'׳׳¦׳•׳™׳! ׳”׳׳•׳¦׳¨ ׳ ׳¨׳©׳ ׳›׳¨׳›׳™׳©׳” ׳©׳‘׳•׳¦׳¢׳”.\n׳ ׳™׳×׳ ׳׳‘׳˜׳ ׳‘׳׳—׳™׳¦׳” ׳ ׳•׳¡׳₪׳×.',
        tip:'נ’¡ ׳׳•׳¦׳¨׳™׳ ׳׳¡׳•׳׳ ׳™׳ ׳ ׳¡׳₪׳¨׳™׳ ׳‘"׳©׳•׳׳" ׳‘׳¡׳¨׳’׳ ׳”׳×׳—׳×׳•׳.',
    },
    removeItem: {
        emoji:'נ—‘ן¸', phase:'before',
        title:'׳׳—׳™׳§׳× ׳׳•׳¦׳¨',
        body:'׳”׳׳•׳¦׳¨ ׳™׳•׳¡׳¨ ׳׳”׳¨׳©׳™׳׳”.\n׳™׳© ׳׳ 5 ׳©׳ ׳™׳•׳× ׳׳‘׳˜׳ ׳׳× ׳”׳׳—׳™׳§׳”!',
        tip:'ג ן¸ ׳׳—׳¥ ׳¢׳ "׳‘׳˜׳" ׳©׳™׳•׳₪׳™׳¢ ׳׳׳˜׳” ׳›׳“׳™ ׳׳©׳—׳–׳¨.',
    },
    removeDone: {
        emoji:'נ—‘ן¸', phase:'after',
        title:'׳׳•׳¦׳¨ ׳”׳•׳¡׳¨',
        body:'׳”׳׳•׳¦׳¨ ׳”׳•׳¡׳¨ ׳׳”׳¨׳©׳™׳׳”.\n׳׳—׳¥ "׳‘׳˜׳" ׳׳ ׳˜׳¢׳™׳×.',
        tip:'נ’¡ ׳”׳׳•׳¦׳¨ ׳™׳›׳•׳ ׳׳”׳•׳₪׳™׳¢ ׳‘׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳׳ ׳”׳©׳×׳׳©׳× ׳‘׳”׳©׳׳׳” ׳¨׳©׳™׳׳”.',
    },
    newList: {
        emoji:'נ“‹', phase:'before',
        title:'׳™׳¦׳™׳¨׳× ׳¨׳©׳™׳׳” ׳—׳“׳©׳”',
        body:'׳×׳•׳›׳ ׳׳×׳× ׳©׳ ׳׳¨׳©׳™׳׳”, ׳׳”׳’׳“׳™׳¨ ׳×׳§׳¦׳™׳‘ ׳•׳׳”׳•׳¡׳™׳£ ׳§׳™׳©׳•׳¨ ׳׳׳×׳¨ ׳”׳—׳ ׳•׳×.',
        tip:'נ’¡ ׳׳₪׳©׳¨ ׳’׳ ׳׳©׳׳•׳¨ ׳›׳×׳‘׳ ׳™׳× ׳׳©׳™׳׳•׳© ׳¢׳×׳™׳“׳™!',
    },
    newListDone: {
        emoji:'נ', phase:'after',
        title:'׳”׳¨׳©׳™׳׳” ׳ ׳•׳¦׳¨׳”!',
        body:'׳”׳¨׳©׳™׳׳” ׳”׳—׳“׳©׳” ׳©׳׳ ׳׳•׳›׳ ׳”.\n׳¢׳›׳©׳™׳• ׳׳—׳¥ ג• ׳›׳“׳™ ׳׳”׳×׳—׳™׳ ׳׳”׳•׳¡׳™׳£ ׳׳•׳¦׳¨׳™׳.',
        tip:'נ’¡ ׳׳₪׳©׳¨ ׳׳¢׳‘׳•׳¨ ׳‘׳™׳ ׳¨׳©׳™׳׳•׳× ׳׳”׳˜׳׳‘ "׳”׳¨׳©׳™׳׳•׳× ׳©׳׳™".',
    },
    completeList: {
        emoji:'נ', phase:'before',
        title:'׳¡׳™׳•׳ ׳•׳¡׳’׳™׳¨׳× ׳¨׳©׳™׳׳”',
        body:'׳”׳¨׳©׳™׳׳” ׳×׳¡׳•׳׳ ׳›׳”׳•׳©׳׳׳” ׳•׳×׳™׳©׳׳¨ ׳‘׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳©׳׳.\n׳×׳•׳›׳ ׳׳¦׳₪׳•׳× ׳‘׳” ׳׳׳•׳—׳¨ ׳™׳•׳×׳¨.',
        tip:'נ’¡ ׳¨׳•׳¦׳” ׳׳”׳©׳×׳׳© ׳‘׳” ׳©׳•׳‘? ׳©׳׳•׳¨ ׳׳•׳×׳” ׳›׳×׳‘׳ ׳™׳× ׳׳₪׳ ׳™ ׳”׳¡׳’׳™׳¨׳”!',
    },
    completeDone: {
        emoji:'נ†', phase:'after',
        title:'׳›׳ ׳”׳›׳‘׳•׳“! ׳”׳¨׳©׳™׳׳” ׳”׳•׳©׳׳׳”',
        body:'׳”׳¨׳©׳™׳׳” ׳ ׳©׳׳¨׳” ׳‘׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳©׳׳.\n׳›׳ ׳”׳”׳•׳¦׳׳•׳× ׳ ׳¨׳©׳׳• ׳‘׳¡׳˜׳˜׳™׳¡׳˜׳™׳§׳•׳×.',
        tip:'נ’¡ ׳›׳ ׳¡ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳›׳“׳™ ׳׳¦׳₪׳•׳× ׳‘׳¡׳™׳›׳•׳ ׳”׳¨׳›׳™׳©׳•׳×.',
    },
    lockBtn: {
        emoji:'נ”’', phase:'before',
        title:'׳ ׳¢׳™׳׳× ׳”׳¨׳©׳™׳׳”',
        body:'׳”׳ ׳¢׳™׳׳” ׳׳•׳ ׳¢׳× ׳©׳™׳ ׳•׳™׳™׳ ׳‘׳©׳•׳’׳’.\n׳©׳™׳׳•׳©׳™ ׳›׳©׳”׳¨׳©׳™׳׳” ׳׳•׳›׳ ׳” ׳׳§׳ ׳™׳™׳”.',
        tip:'נ’¡ ׳׳—׳¥ ׳©׳•׳‘ ׳¢׳ ׳”׳›׳₪׳×׳•׳¨ ׳›׳“׳™ ׳׳©׳—׳¨׳¨ ׳׳× ׳”׳ ׳¢׳™׳׳”.',
    },
    lockDone: {
        emoji:'נ”', phase:'after',
        title:'׳”׳¨׳©׳™׳׳” ׳ ׳¢׳•׳׳”',
        body:'׳”׳¨׳©׳™׳׳” ׳›׳¢׳× ׳׳•׳’׳ ׳× ׳׳₪׳ ׳™ ׳¢׳¨׳™׳›׳” ׳‘׳©׳•׳’׳’.\n׳׳—׳¥ ׳©׳•׳‘ ׳׳”׳¡׳¨׳× ׳”׳ ׳¢׳™׳׳”.',
        tip:'נ’¡ ׳‘׳–׳׳ ׳ ׳¢׳™׳׳” ׳׳₪׳©׳¨ ׳¢׳“׳™׳™׳ ׳׳¡׳׳ ׳׳•׳¦׳¨׳™׳ ׳›׳¨׳›׳•׳©׳™׳.',
    },
    bellBtn: {
        emoji:'נ””', phase:'before',
        title:'׳׳¨׳›׳– ׳”׳×׳¨׳׳•׳×',
        body:'׳›׳׳ ׳׳¨׳•׳›׳–׳•׳× ׳›׳ ׳”׳”׳×׳¨׳׳•׳× ׳”׳₪׳¢׳™׳׳•׳× ׳©׳׳.\nנ”´ ׳׳“׳•׳ ג€” ׳×׳׳¨׳™׳ ׳”׳™׳¢׳“ ׳¢׳‘׳¨, ׳”׳₪׳¨׳™׳˜ ׳‘׳׳™׳—׳•׳¨.\nנ  ׳›׳×׳•׳ ג€” ׳”׳₪׳¨׳™׳˜ ׳“׳•׳¨׳© ׳×׳©׳•׳׳× ׳׳‘ ׳”׳™׳•׳ ׳׳• ׳׳—׳¨.\nנ”µ ׳›׳—׳•׳ ג€” ׳™׳© ׳×׳–׳›׳•׳¨׳× ׳©׳₪׳¢׳™׳׳” ׳‘׳™׳׳™׳ ׳”׳§׳¨׳•׳‘׳™׳.',
        tip:'נ’¡ ׳”׳—׳׳§ ׳”׳×׳¨׳׳” ׳©׳׳׳׳” ׳׳• ׳™׳׳™׳ ׳” ׳›׳“׳™ ׳׳׳—׳•׳§ ׳׳•׳×׳”.',
    },
    cloudBtn: {
        emoji:'ג˜ן¸', phase:'before',
        title:'׳¡׳ ׳›׳¨׳•׳ ׳•׳’׳™׳‘׳•׳™ ׳׳¢׳ ׳',
        body:'׳—׳‘׳¨ ׳׳× ׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳׳—׳©׳‘׳•׳ Google ׳©׳׳.\n׳›׳ ׳”׳¨׳©׳™׳׳•׳× ׳™׳’׳•׳‘׳• ׳׳•׳˜׳•׳׳˜׳™׳× ׳‘׳¢׳ ׳ ׳•׳™׳”׳™׳• ׳–׳׳™׳ ׳•׳× ׳׳›׳ ׳׳›׳©׳™׳¨.\n׳”׳ ׳×׳•׳ ׳™׳ ׳©׳׳ ׳׳׳•׳‘׳˜׳—׳™׳ ׳•׳׳ ׳™׳׳‘׳“׳• ׳’׳ ׳׳ ׳×׳—׳׳™׳£ ׳˜׳׳₪׳•׳.',
        tip:'נ’¡ ׳”׳¡׳ ׳›׳¨׳•׳ ׳׳×׳‘׳¦׳¢ ׳׳•׳˜׳•׳׳˜׳™׳× ׳‘׳›׳ ׳©׳™׳ ׳•׳™ ג€” ׳׳׳ ׳׳—׳™׳¦׳•׳× ׳ ׳•׳¡׳₪׳•׳×.',
    },
    settingsBtn: {
        emoji:'ג™ן¸', phase:'before',
        title:'׳”׳’׳“׳¨׳•׳× ׳”׳׳₪׳׳™׳§׳¦׳™׳”',
        body:'׳›׳׳ ׳×׳׳¦׳: ׳©׳₪׳× ׳׳׳©׳§, ׳׳¦׳‘ ׳׳™׳׳”, ׳¡׳ ׳›׳¨׳•׳ ׳¢׳ ׳, ׳ ׳™׳”׳•׳ ׳§׳˜׳’׳•׳¨׳™׳•׳× ׳•׳¢׳•׳“.',
        tip:'נ’¡ ׳”׳₪׳¢׳ ׳׳¦׳‘ ׳׳™׳׳” ׳׳ ׳•׳—׳•׳× ׳©׳™׳׳•׳© ׳‘׳©׳¢׳•׳× ׳”׳׳₪׳׳”.',
    },
    tabList: {
        emoji:'נ›’', phase:'before',
        title:'׳”׳¨׳©׳™׳׳” ׳”׳₪׳¢׳™׳׳”',
        body:'׳”׳¦׳’ ׳׳× ׳”׳¨׳©׳™׳׳” ׳”׳₪׳¢׳™׳׳” ׳¢׳ ׳›׳ ׳”׳₪׳¨׳™׳˜׳™׳ ׳©׳׳”.\n׳›׳׳ ׳׳×׳‘׳¦׳¢׳× ׳”׳§׳ ׳™׳™׳”.',
        tip:'נ’¡ ׳’׳¨׳•׳¨ ׳₪׳¨׳™׳˜׳™׳ ׳׳¡׳™׳“׳•׳¨ ׳׳—׳“׳© ׳©׳ ׳”׳¨׳©׳™׳׳”.',
    },
    tabLists: {
        emoji:'נ“', phase:'before',
        title:'׳›׳ ׳”׳¨׳©׳™׳׳•׳× ׳©׳׳',
        body:'׳›׳׳ ׳×׳׳¦׳ ׳׳× ׳›׳ ׳”׳¨׳©׳™׳׳•׳×.\n׳ ׳™׳×׳ ׳׳™׳¦׳•׳¨, ׳׳¢׳¨׳•׳, ׳׳׳—׳•׳§ ׳•׳׳‘׳—׳•׳¨ ׳¨׳©׳™׳׳” ׳₪׳¢׳™׳׳”.',
        tip:'נ’¡ ׳׳—׳¥ ׳׳׳•׳©׳ ׳¢׳ ׳¨׳©׳™׳׳” ׳׳׳₪׳©׳¨׳•׳™׳•׳× ׳ ׳•׳¡׳₪׳•׳×.',
    },
    tabStats: {
        emoji:'נ“', phase:'before',
        title:'׳¡׳˜׳˜׳™׳¡׳˜׳™׳§׳•׳× ׳”׳•׳¦׳׳•׳×',
        body:'׳’׳¨׳₪׳™׳ ׳•׳×׳•׳‘׳ ׳•׳× ׳¢׳ ׳”׳”׳•׳¦׳׳•׳× ׳©׳׳ ׳׳₪׳™ ׳—׳•׳“׳©, ׳§׳˜׳’׳•׳¨׳™׳” ׳•׳–׳׳.',
        tip:'נ’¡ ׳”׳©׳×׳׳© ׳‘׳¡׳˜׳˜׳™׳¡׳˜׳™׳§׳•׳× ׳׳×׳›׳ ׳•׳ ׳×׳§׳¦׳™׳‘ ׳—׳›׳ ׳™׳•׳×׳¨.',
    },
    editName: {
        emoji:'גן¸', phase:'before',
        title:'׳¢׳¨׳™׳›׳× ׳©׳ ׳׳•׳¦׳¨',
        body:'׳׳—׳¥ ׳¢׳ ׳©׳ ׳”׳׳•׳¦׳¨ ׳›׳“׳™ ׳׳©׳ ׳•׳× ׳׳•׳×׳•.\n׳”׳©׳™׳ ׳•׳™ ׳™׳™׳©׳׳¨ ׳׳•׳˜׳•׳׳˜׳™׳×.',
        tip:'נ’¡ ׳©׳ ׳‘׳¨׳•׳¨ ׳¢׳•׳–׳¨ ׳׳׳¦׳•׳ ׳׳•׳¦׳¨׳™׳ ׳׳”׳¨ ׳‘׳—׳™׳₪׳•׳©.',
    },
    editPrice: {
        emoji:'ג‚×', phase:'before',
        title:'׳¢׳¨׳™׳›׳× ׳׳—׳™׳¨',
        body:'׳׳—׳¥ ׳¢׳ ׳”׳¡׳›׳•׳ ׳›׳“׳™ ׳׳¢׳“׳›׳ ׳׳× ׳”׳׳—׳™׳¨.\n׳”׳¡׳™׳›׳•׳ ׳”׳›׳•׳׳ ׳׳×׳¢׳“׳›׳ ׳׳™׳™׳“׳™׳×.',
        tip:'נ’¡ ׳׳₪׳©׳¨ ׳׳”׳–׳™׳ ׳׳—׳™׳¨ ׳-0 ׳׳ ׳”׳׳•׳¦׳¨ ׳—׳™׳ ׳׳™.',
    },
    category: {
        emoji:'נ·ן¸', phase:'before',
        title:'׳©׳™׳ ׳•׳™ ׳§׳˜׳’׳•׳¨׳™׳”',
        body:'׳§׳˜׳’׳•׳¨׳™׳•׳× ׳¢׳•׳–׳¨׳•׳× ׳׳¡׳“׳¨ ׳•׳׳¡׳ ׳ ׳׳× ׳”׳¨׳©׳™׳׳” ׳‘׳§׳׳•׳×.\n׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳׳ ׳¡׳” ׳׳–׳”׳•׳× ׳§׳˜׳’׳•׳¨׳™׳” ׳׳•׳˜׳•׳׳˜׳™׳×.',
        tip:'נ’¡ ׳ ׳™׳×׳ ׳׳™׳¦׳•׳¨ ׳§׳˜׳’׳•׳¨׳™׳•׳× ׳׳•׳×׳׳׳•׳× ׳׳™׳©׳™׳× ׳‘׳”׳’׳“׳¨׳•׳×.',
    },
    note: {
        emoji:'נ“', phase:'before',
        title:'׳”׳•׳¡׳₪׳× ׳”׳¢׳¨׳”',
        body:'׳”׳•׳¡׳£ ׳₪׳¨׳˜׳™׳ ׳ ׳•׳¡׳₪׳™׳: ׳׳™׳ ׳§ ׳׳׳•׳¦׳¨, ׳”׳•׳¨׳׳•׳× ׳׳™׳•׳—׳“׳•׳×, ׳׳• ׳›׳ ׳׳™׳“׳¢ ׳©׳—׳©׳•׳‘ ׳׳.',
        tip:'נ’¡ ׳”׳¢׳¨׳•׳× ׳¢׳ ׳׳™׳ ׳§׳™׳ ׳™׳”׳₪׳›׳• ׳׳׳—׳™׳¦׳™׳ ׳׳•׳˜׳•׳׳˜׳™׳×.',
    },
    reminder: {
        emoji:'ג°', phase:'before',
        title:'׳”׳’׳“׳¨׳× ׳×׳–׳›׳•׳¨׳×',
        body:'׳§׳‘׳¢ ׳׳×׳™ ׳×׳§׳‘׳ ׳”׳×׳¨׳׳” ׳׳₪׳ ׳™ ׳×׳׳¨׳™׳ ׳”׳™׳¢׳“ ׳©׳ ׳”׳₪׳¨׳™׳˜.\n׳”׳×׳–׳›׳•׳¨׳•׳× ׳׳’׳™׳¢׳•׳× ׳’׳ ׳›׳©׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳¡׳’׳•׳¨׳”.',
        tip:'נ’¡ ׳”׳’׳“׳¨ ׳×׳–׳›׳•׳¨׳× ׳©׳ ׳™׳•׳׳™׳™׳ ׳׳₪׳ ׳™ ׳׳×׳›׳ ׳•׳ ׳׳¨׳׳©.',
    },
    qtyPlus: {
        emoji:'נ”¢', phase:'before',
        title:'׳”׳’׳“׳׳× ׳›׳׳•׳×',
        body:'׳׳—׳¥ + ׳›׳“׳™ ׳׳”׳’׳“׳™׳ ׳׳× ׳׳¡׳₪׳¨ ׳”׳™׳—׳™׳“׳•׳×.\n׳”׳׳—׳™׳¨ ׳”׳›׳•׳׳ ׳™׳×׳¢׳“׳›׳ ׳׳•׳˜׳•׳׳˜׳™׳×.',
        tip:'נ’¡ ׳©׳ ׳” ׳›׳׳•׳× ׳׳”׳™׳¨׳”: ׳׳—׳¥ ׳׳׳•׳©׳ ׳¢׳ + ׳׳¨׳™׳‘׳•׳™ ׳׳”׳™׳¨.',
    },
    qtyMinus: {
        emoji:'נ”¢', phase:'before',
        title:'׳”׳₪׳—׳×׳× ׳›׳׳•׳×',
        body:'׳׳—׳¥ גˆ’ ׳›׳“׳™ ׳׳”׳₪׳—׳™׳× ׳™׳—׳™׳“׳”.\n׳›׳׳•׳× ׳׳™׳ ׳™׳׳׳™׳× ׳”׳™׳ 1.',
        tip:'נ’¡ ׳׳—׳¥ נ—‘ן¸ ׳׳ ׳‘׳¨׳¦׳•׳ ׳ ׳׳׳—׳•׳§ ׳׳’׳׳¨׳™.',
    },
    pasteBtn: {
        emoji:'נ“‹', phase:'before',
        title:'׳™׳™׳‘׳•׳ ׳¨׳©׳™׳׳” ׳׳˜׳§׳¡׳˜',
        body:'׳”׳“׳‘׳§ ׳˜׳§׳¡׳˜ ׳׳•׳•׳׳˜׳¡׳׳₪, ׳׳™׳׳™׳™׳ ׳׳• ׳›׳ ׳׳§׳•׳¨ ׳׳—׳¨.\n׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳×׳–׳”׳” ׳׳•׳˜׳•׳׳˜׳™׳× ׳׳× ׳”׳₪׳¨׳™׳˜׳™׳ ׳•׳×׳‘׳ ׳” ׳¨׳©׳™׳׳”.',
        tip:'נ’¡ ׳¢׳•׳‘׳“ ׳¢׳ ׳¨׳©׳™׳׳•׳× ׳׳•׳•׳׳˜׳¡׳׳₪, ׳”׳¢׳¨׳•׳× ׳˜׳׳₪׳•׳ ׳•׳¢׳•׳“!',
    },
    excelBtn: {
        emoji:'נ“', phase:'before',
        title:'׳™׳™׳‘׳•׳ ׳׳׳§׳¡׳ / ׳›׳¨׳˜׳™׳¡ ׳׳©׳¨׳׳™',
        body:'׳™׳™׳‘׳ ׳§׳•׳‘׳¥ Excel (.xlsx) ׳™׳©׳™׳¨׳•׳× ׳׳”׳‘׳ ׳§ ׳׳• ׳—׳‘׳¨׳× ׳”׳׳©׳¨׳׳™.\n׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳×׳”׳₪׳•׳ ׳׳× ׳”׳¢׳׳•׳“׳•׳× ׳׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳× ׳—׳›׳׳”.',
        tip:'נ’¡ ׳×׳•׳׳ ׳‘׳§׳‘׳¦׳™ Excel ׳׳‘׳ ׳§ ׳”׳₪׳•׳¢׳׳™׳, ׳׳׳•׳׳™, ׳›׳׳, ׳™׳©׳¨׳׳›׳¨׳˜ ׳•׳¢׳•׳“.',
    },
    bankBtn: {
        emoji:'נ¦', phase:'before',
        title:'׳™׳™׳‘׳•׳ PDF ׳׳”׳‘׳ ׳§ / ׳׳©׳¨׳׳™',
        body:'׳”׳¢׳׳” ׳§׳•׳‘׳¥ PDF ׳©׳ ׳“׳£ ׳—׳©׳‘׳•׳, ׳—׳™׳•׳‘׳™ ׳›׳¨׳˜׳™׳¡ ׳׳©׳¨׳׳™ ׳׳• ׳§׳‘׳׳”.\n׳”׳׳¢׳¨׳›׳× ׳×׳¡׳¨׳•׳§ ׳׳× ׳”׳ ׳×׳•׳ ׳™׳ ׳•׳×׳™׳™׳¦׳¨ ׳׳׳ ׳ ׳¨׳©׳™׳׳” ׳׳•׳˜׳•׳׳˜׳™׳×.',
        tip:'נ’¡ ׳¢׳•׳‘׳“ ׳¢׳ PDF ׳׳—׳‘׳¨׳•׳× ׳׳©׳¨׳׳™, ׳“׳₪׳™ ׳‘׳ ׳§ ׳•׳—׳©׳‘׳•׳ ׳™׳•׳×.',
    },
    myLists: {
        emoji:'נ“', phase:'before',
        title:'׳”׳¨׳©׳™׳׳•׳× ׳©׳׳™',
        body:'׳›׳׳ ׳×׳׳¦׳ ׳׳× ׳›׳ ׳¨׳©׳™׳׳•׳× ׳”׳§׳ ׳™׳•׳× ׳©׳׳.\n׳׳—׳¥ ׳¢׳ ׳¨׳©׳™׳׳” ׳׳₪׳×׳™׳—׳×׳”, ׳׳• ׳¦׳•׳¨ ׳¨׳©׳™׳׳” ׳—׳“׳©׳”.',
        tip:'נ’¡ ׳ ׳™׳×׳ ׳׳’׳¨׳•׳¨ ׳•׳׳¡׳“׳¨ ׳׳× ׳”׳¨׳©׳™׳׳•׳× ׳‘׳¡׳“׳¨ ׳”׳¨׳¦׳•׳™.',
    },
};

// ג”€ג”€ Core: show a full-screen wizard card ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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
    phaseLabel.textContent = isBefore ? '׳׳₪׳ ׳™ ׳”׳₪׳¢׳•׳׳”' : '׳‘׳•׳¦׳¢!';

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
    okBtn.textContent   = isBefore ? '׳”׳‘׳ ׳×׳™, ׳‘׳•׳׳• ׳ ׳׳©׳™׳ ג“' : '׳׳¦׳•׳™׳! ג“';
    skipBtn.textContent = '׳“׳׳’';

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

    // After-phase: NO auto-dismiss ג€” only button closes card

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
    // ׳¡׳’׳•׳¨ ׳׳× ׳›׳¨׳˜׳™׳¡ ׳”׳׳“׳¨׳™׳
    _wizDismiss();
    // ׳”׳׳×׳ ׳׳׳ ׳™׳׳¦׳™׳™׳× ׳”׳¡׳’׳™׳¨׳” ׳•׳׳– ׳›׳‘׳” ׳׳“׳¨׳™׳ + toast
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
            if (panelTxt) panelTxt.textContent = '׳׳“׳¨׳™׳';
            _showToast({ message: 'ג¨ ׳׳“׳¨׳™׳ ׳›׳•׳‘׳”', type: 'success', duration: 3000 });
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

// ג”€ג”€ Toggle wizard mode ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

window._closeDemoPrompt = function() {
    var el = document.getElementById('demoWizardPrompt');
    if (el) el.remove();
};

function _askDemoBeforeWizard() {
    var hasRealData = Object.values(db.lists).some(function(l){ return l.items && l.items.length > 0 && !l.isDemo; });
    if (isDemoMode || hasRealData) {
        // ׳™׳© ׳›׳‘׳¨ ׳ ׳×׳•׳ ׳™׳ ג€” ׳₪׳×׳— ׳׳“׳¨׳™׳ ׳™׳©׳™׳¨׳•׳×
        _wizShowWelcome();
        return;
    }
    // ׳©׳׳ ׳¢׳ ׳“׳׳•
    var overlay = document.createElement('div');
    overlay.id = 'demoWizardPrompt';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.6);display:flex;align-items:flex-end;font-family:system-ui,sans-serif;';
    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:white;border-radius:28px 28px 0 0;width:100%;padding:24px 20px 40px;animation:demoSheetIn 0.35s cubic-bezier(0.34,1.56,0.64,1);';
    sheet.innerHTML = '<div style="display:flex;justify-content:flex-end;margin-bottom:6px;"><button onclick="window._closeDemoPrompt();" style="background:rgba(0,0,0,0.06);border:none;border-radius:50%;width:32px;height:32px;font-size:20px;cursor:pointer;color:#888;">ֳ—</button></div><div style="width:38px;height:4px;background:#e5e7eb;border-radius:99px;margin:0 auto 18px;"></div>'
        + '<div style="font-size:44px;text-align:center;margin-bottom:10px;">נ¯</div>'
        + '<div style="font-size:19px;font-weight:900;color:#1e1b4b;text-align:center;margin-bottom:6px;">׳˜׳¨׳ ׳”׳×׳—׳׳× ׳׳”׳©׳×׳׳©</div>'
        + '<div style="font-size:13px;color:#6b7280;text-align:center;line-height:1.6;margin-bottom:20px;">׳¨׳•׳¦׳” ׳׳˜׳¢׳•׳ 10 ׳¨׳©׳™׳׳•׳× ׳׳“׳•׳’׳׳”<br>׳›׳“׳™ ׳©׳”׳׳“׳¨׳™׳ ׳™׳”׳™׳” ׳—׳™ ׳•׳׳¢׳ ׳™׳™׳ ׳™׳•׳×׳¨?</div>'
        + '<div style="display:flex;flex-direction:column;gap:10px;">'
        + '<button onclick="window._closeDemoPrompt();loadDemoMode();_wizShowWelcome();" style="background:linear-gradient(135deg,#7367f0,#9055ff);color:white;border:none;border-radius:18px;padding:16px;font-size:15px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif;box-shadow:0 6px 20px rgba(115,103,240,0.35);">\uD83C\uDFAF ׳›׳, ׳˜׳¢׳ ׳ ׳×׳•׳ ׳™ ׳“׳׳•</button>'
        + '<button onclick="window._closeDemoPrompt();_wizShowWelcome();" style="background:#f3f4f6;color:#6b7280;border:none;border-radius:18px;padding:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;">׳׳ ׳×׳•׳“׳”, ׳”׳×׳—׳ ׳׳“׳¨׳™׳ ׳¨׳™׳§</button>'
        + '</div>'
        + '<style>@keyframes demoSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>';
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
}

// ג”€ג”€ GitHub Token Management ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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
        showNotification('נ—‘ן¸ Token ׳ ׳׳—׳§');
    } else if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        showNotification('ג ן¸ Token ׳׳ ׳×׳§׳™׳ ג€” ׳—׳™׳™׳‘ ׳׳”׳×׳—׳™׳ ׳‘-ghp_ ׳׳• github_pat_', 'warning');
        return;
    } else {
        localStorage.setItem('vplus_github_pat', token);
        window.GITHUB_PAT = token;
        showNotification('ג… GitHub Token ׳ ׳©׳׳¨!');
    }
    updateGithubTokenStatus();
}

function updateGithubTokenStatus() {
    const input  = document.getElementById('githubTokenInput');
    const status = document.getElementById('githubTokenStatus');
    if (!status) return;
    const val = (input ? input.value : '') || localStorage.getItem('vplus_github_pat') || '';
    if (val.startsWith('ghp_') || val.startsWith('github_pat_')) {
        status.textContent = 'ג… ׳׳•׳’׳“׳¨';
        status.style.color = '#22c55e';
    } else if (val.length > 0) {
        status.textContent = 'ג ן¸ ׳׳ ׳×׳§׳™׳';
        status.style.color = '#f59e0b';
    } else {
        status.textContent = 'ג ׳׳ ׳׳•׳’׳“׳¨';
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
        if (txt) txt.textContent = '׳׳“׳¨׳™׳';
        if (panelPill) { panelPill.style.background='#7367f0'; panelPill.style.color='white'; }
        if (panelTxt) panelTxt.textContent = 'ג¨ ׳₪׳¢׳™׳';
        document.body.classList.add('wizard-mode-active');
        // ׳©׳׳ ׳¢׳ ׳“׳׳• ׳׳₪׳ ׳™ ׳₪׳×׳™׳—׳× ׳”׳׳“׳¨׳™׳
        _askDemoBeforeWizard();
    } else {
        if (btn) btn.classList.remove('wizard-active');
        if (txt) txt.textContent = '׳׳“׳¨׳™׳';
        if (panelPill) { panelPill.style.background=''; panelPill.style.color=''; }
        if (panelTxt) panelTxt.textContent = '׳׳“׳¨׳™׳';
        document.body.classList.remove('wizard-mode-active');
        // Close any open card
        const overlay = document.getElementById('wizCardOverlay');
        if (overlay) overlay.classList.remove('wiz-active');
        _wizDismissCallback = null;
        clearTimeout(_wizAutoTimer);
        showNotification('׳׳¦׳‘ ׳׳“׳¨׳™׳ ׳›׳•׳‘׳”');
    }
}

// ג”€ג”€ handlePlusBtn ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
// ׳§׳•׳ ׳˜׳§׳¡׳˜׳•׳׳׳™: ׳”׳¨׳©׳™׳׳•׳× ׳©׳׳™ ג†’ ׳¨׳©׳™׳׳” ׳—׳“׳©׳” | ׳”׳¨׳©׳™׳׳” ׳©׳׳™ ג†’ ׳”׳•׳¡׳£ ׳׳•׳¦׳¨
function handlePlusBtn(e) {
    if (e) e.stopPropagation();
    if (activePage === 'summary') {
        // ׳˜׳׳‘ ׳”׳¨׳©׳™׳׳•׳× ׳©׳׳™ ג€” ׳™׳¦׳™׳¨׳× ׳¨׳©׳™׳׳” ׳—׳“׳©׳”
        if (wizardMode) {
            wiz('newList', 'before', () => openModal('newListModal'));
        } else {
            openModal('newListModal');
        }
    } else {
        // ׳˜׳׳‘ ׳”׳¨׳©׳™׳׳” ׳©׳׳™ ג€” ׳”׳•׳¡׳₪׳× ׳׳•׳¦׳¨
        if (wizardMode) {
            wiz('plusBtn', 'before', () => openModal('inputForm'));
        } else {
            openModal('inputForm');
        }
    }
}

// ג”€ג”€ Wrap core functions with wizard before/after ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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

// openNotificationCenter ג€” NOT wizard-intercepted (must open immediately, also from lock screen)

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

// changeQty ג€” wrap for qty tips
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

// ג”€ג”€ Patch render to keep wizard mode indicator ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
if (typeof render === 'function') {
    const _origRender = render;
    window.render = function() {
        _origRender();
        if (wizardMode) {
            document.body.classList.add('wizard-mode-active');
        }
    };
}

// ג”€ג”€ Stubs for legacy HTML compatibility ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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

// ג”€ג”€ Init on DOMContentLoaded ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
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
        if (txt) txt.textContent = '׳׳“׳¨׳™׳';
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

// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
// נ™ן¸ VOICE ACTION BUTTONS ג€” "׳§׳ ׳™׳×׳™" & "׳׳§׳ ׳•׳×"
// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•

let _voiceActionRecognition = null;
let _voiceActionMode = null; // 'bought' | 'tobuy'
let _voiceActionActive = false;

function initVoiceAction() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('׳”׳“׳₪׳“׳₪׳ ׳׳ ׳×׳•׳׳ ׳‘׳–׳™׳”׳•׳™ ׳§׳•׳׳™', 'error');
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

// Fuzzy match ג€” returns best matching item index or -1
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
        showNotification('׳׳™׳ ׳¨׳©׳™׳׳” ׳₪׳¢׳™׳׳”', 'error'); return;
    }

    if (_voiceActionActive) {
        _stopVoiceAction(); return;
    }

    _voiceActionMode = mode;
    _voiceActionRecognition = initVoiceAction();
    if (!_voiceActionRecognition) return;

    _voiceActionActive = true;
    _updateVoiceActionBtns(true);

    const label = mode === 'bought' ? 'נ›’ ׳׳׳•׳¨ ׳©׳ ׳׳•׳¦׳¨ ׳©׳§׳ ׳™׳×...' : 'נ“‹ ׳׳׳•׳¨ ׳©׳ ׳׳•׳¦׳¨ ׳׳¨׳©׳™׳׳”...';
    showNotification(label, 'success');

    _voiceActionRecognition.onresult = (e) => {
        // Try all alternatives for best match
        const transcripts = Array.from({length: e.results[0].length}, (_, i) => e.results[0][i].transcript);
        _handleVoiceActionResult(transcripts, mode);
    };

    _voiceActionRecognition.onerror = (e) => {
        _stopVoiceAction();
        if (e.error === 'no-speech') showNotification('׳׳ ׳–׳•׳”׳” ׳“׳™׳‘׳•׳¨', 'warning');
        else showNotification('׳©׳’׳™׳׳× ׳–׳™׳”׳•׳™ ׳§׳•׳׳™', 'error');
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
            showNotification(`ג ׳׳ ׳׳¦׳׳×׳™ "${transcript}" ׳‘׳¨׳©׳™׳׳”`, 'error');
            return;
        }
        const item = items[bestIdx];
        if (item.checked) {
            showNotification(`ג„¹ן¸ "${item.name}" ׳›׳‘׳¨ ׳׳¡׳•׳׳ ׳›׳ ׳¨׳›׳©`, 'warning');
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
                showNotification(`ג„¹ן¸ "${item.name}" ׳›׳‘׳¨ ׳‘׳¨׳©׳™׳׳” ׳•׳׳׳×׳™׳ ׳׳¨׳›׳™׳©׳”`, 'warning');
            } else {
                // Uncheck ג€” move back to "to buy"
                item.checked = false;
                lastCheckedItem = item;
                lastCheckedIdx = bestIdx;
                lastCheckedState = true;
                db.lists[db.currentId].items = sortItemsByStatusAndCategory(items);
                save();
                showUndoCheckNotification(item.name, false);
            }
        } else {
            // Not found ג€” offer to add
            _showAddItemPrompt(transcript);
        }
    }
}

function _showAddItemPrompt(name) {
    // Use existing toast system with a custom action
    _showToast({
        message: `"${name}" ׳׳ ׳‘׳¨׳©׳™׳׳” ג€” ׳׳”׳•׳¡׳™׳£?`,
        type: 'warning',
        undoCallback: () => _addItemByVoice(name),
        undoLabel: 'ג• ׳”׳•׳¡׳£',
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
    showNotification(`ג… "${trimmed}" ׳ ׳•׳¡׳£ ׳׳¨׳©׳™׳׳”!`, 'success');
}
// ========== Bank Sync Functions ==========


// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
// נ’° FINANCIAL MODALS ג€” Credit Card + Bank Scraper
// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•

let selectedCreditCompany = null;
let selectedBank = null;

const BANK_CONFIG = {
    hapoalim:     { field1: 'userCode',  field1Label: '׳§׳•׳“ ׳׳©׳×׳׳©',    field2: null,  field2Label: '',                     hint: '׳§׳•׳“ ׳”׳׳©׳×׳׳© ׳©׳׳ ׳‘׳׳™׳ ׳˜׳¨׳ ׳˜ ׳₪׳•׳¢׳׳™׳' },
    leumi:        { field1: 'username',  field1Label: '׳©׳ ׳׳©׳×׳׳©',      field2: null,  field2Label: '',                     hint: '׳©׳ ׳”׳׳©׳×׳׳© ׳©׳׳ ׳‘׳׳׳•׳׳™ ׳“׳™׳’׳™׳˜׳' },
    mizrahi:      { field1: 'username',  field1Label: '׳©׳ ׳׳©׳×׳׳©',      field2: null,  field2Label: '',                     hint: '' },
    discount:     { field1: 'id',        field1Label: '׳×׳¢׳•׳“׳× ׳–׳”׳•׳×',     field2: 'num', field2Label: '׳׳¡׳₪׳¨ ׳¡׳ ׳™׳£ (3 ׳¡׳₪׳¨׳•׳×)', hint: '׳ ׳“׳¨׳©: ׳×"׳– + ׳׳¡׳₪׳¨ ׳¡׳ ׳™׳£ + ׳¡׳™׳¡׳׳”' },
    otsarHahayal: { field1: 'username',  field1Label: '׳©׳ ׳׳©׳×׳׳©',      field2: null,  field2Label: '',                     hint: '' },
    yahav:        { field1: 'username',  field1Label: '׳©׳ ׳׳©׳×׳׳©',      field2: null,  field2Label: '',                     hint: '' },
    massad:       { field1: 'username',  field1Label: '׳©׳ ׳׳©׳×׳׳©',      field2: null,  field2Label: '',                     hint: '' },
    unionBank:    { field1: 'username',  field1Label: '׳©׳ ׳׳©׳×׳׳©',      field2: null,  field2Label: '',                     hint: '' },
    beinleumi:    { field1: 'username',  field1Label: '׳©׳ ׳׳©׳×׳׳©',      field2: null,  field2Label: '',                     hint: '' },
};

const BANK_NAMES = {
    hapoalim: '׳₪׳•׳¢׳׳™׳', leumi: '׳׳׳•׳׳™', mizrahi: '׳׳–׳¨׳—׳™',
    discount: '׳“׳™׳¡׳§׳•׳ ׳˜', otsarHahayal: '׳׳•׳¦׳¨ ׳”׳—׳™׳™׳',
    yahav: '׳™׳”׳‘', massad: '׳׳¡׳“', unionBank: '׳׳™׳’׳•׳“', beinleumi: '׳‘׳™׳ ׳׳׳•׳׳™'
};

const CREDIT_NAMES = { max: 'Max', visaCal: 'Cal', leumincard: '׳׳׳•׳׳™ ׳§׳׳¨׳“', isracard: '׳™׳©׳¨׳׳›׳¨׳˜' };

// ג”€ג”€ Legacy stub (keep pageBank button working) ג”€ג”€
function openBankModal() { openModal('financialChoiceModal'); }
function closeBankModal() { closeModal('financialChoiceModal'); }
function openBankConnectModal() {
    selectedBank = null;
    document.getElementById('bankField1').value = '';
    document.getElementById('bankConnectPassword').value = '';
    document.getElementById('bankField2').value = '';
    document.getElementById('bankField2Wrap').style.display = 'none';
    document.getElementById('bankField1').placeholder = '׳©׳ ׳׳©׳×׳׳©';
    document.getElementById('bankConnectHint').style.display = 'none';
    document.querySelectorAll('#bankConnectModal .fin-btn').forEach(b => b.classList.remove('selected'));
    openModal('bankConnectModal');
}

// ג”€ג”€ Credit company selector ג”€ג”€
function selectCreditCompany(id, btn) {
    selectedCreditCompany = id;
    document.querySelectorAll('#creditCardModal .fin-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// ג”€ג”€ Bank selector ג”€ג”€
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
    if (cfg.hint) { hint.textContent = 'ג„¹ן¸ ' + cfg.hint; hint.style.display = 'block'; }
    else { hint.style.display = 'none'; }
}

// ג”€ג”€ Progress helpers ג”€ג”€
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
        dot.textContent = i < step ? 'ג“' : String(i);
    }
}

// ג”€ג”€ Debug log panel ג”€ג”€
// ג”€ג”€ Global debug log ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
const _globalDebugLogs = [];
function dbgLog(msg, color) {
    const type = color === '#ff4444' ? 'error' : color === '#ffaa00' ? 'warn' : 'info';
    const icon = color === '#ff4444' ? 'נ”´' : color === '#ffaa00' ? 'נ¡' : color === '#22c55e' ? 'נ¢' : 'ג€¢';
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

        // ג”€ג”€ Header (׳™׳“׳™׳× ׳’׳¨׳™׳¨׳”) ג”€ג”€
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
        title.innerHTML = 'ג ¿ נ› Debug Log';
        title.style.cssText = 'color:#e94560;font-weight:bold;font-size:12px;';

        const btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'display:flex;gap:4px;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'נ“‹';
        copyBtn.title = '׳”׳¢׳×׳§';
        copyBtn.style.cssText = 'background:#1a6b8a;color:white;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px;';
        copyBtn.onclick = () => {
            const c = document.getElementById('debugLogContent');
            if (c) navigator.clipboard?.writeText(c.innerText).then(() => alert('׳”׳•׳¢׳×׳§!'));
        };

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'נ—‘';
        clearBtn.title = '׳ ׳§׳”';
        clearBtn.style.cssText = 'background:#555;color:white;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px;';
        clearBtn.onclick = () => {
            _globalDebugLogs.length = 0;
            const c = document.getElementById('debugLogContent');
            if (c) c.innerHTML = '';
        };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'ג•';
        closeBtn.style.cssText = 'background:#e94560;color:white;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px;';
        closeBtn.onclick = () => { const p = document.getElementById('debugLogPanel'); if (p) p.remove(); };

        btnWrap.appendChild(copyBtn);
        btnWrap.appendChild(clearBtn);
        btnWrap.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(btnWrap);

        // ג”€ג”€ Content ג”€ג”€
        const content = document.createElement('div');
        content.id = 'debugLogContent';
        content.style.cssText = 'overflow-y:auto;flex:1;padding:6px 8px;direction:ltr;text-align:left;';

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

        // ג”€ג”€ Drag logic (touch + mouse) ג”€ג”€
        let dragging = false, startX, startY, origLeft, origTop, origRight, origBottom;

        function dragStart(clientX, clientY) {
            dragging = true;
            startX = clientX;
            startY = clientY;
            const rect = panel.getBoundingClientRect();
            origLeft = rect.left;
            origTop  = rect.top;
            // ׳¢׳‘׳•׳¨ ׳-left/top ׳׳“׳•׳™׳§, ׳‘׳˜׳ right
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
        return `<div style="color:${color};padding:2px 0;border-bottom:1px solid #2a2a4a;">${l.icon||'ג€¢'} [${l.time}] ${l.msg}</div>`;
    }).join('');
    content.scrollTop = content.scrollHeight;
}

// ג”€ג”€ Shared fetch helper ג”€ג”€
async function runFinancialFetch({ companyId, credentials, modalId, nameLabel }) {
    const debugLogs = [];
    const log = (msg, type='info', icon='ג€¢') => {
        debugLogs.push({ msg, type, icon, time: new Date().toLocaleTimeString('he-IL') });
        showDebugLog(debugLogs);
    };

    closeModal(modalId);
    showFinProgress();

    try {
        const user = window.firebaseAuth?.currentUser;
        log(`׳—׳‘׳¨׳”: ${companyId}`, 'info', 'נ¦');
        log(`currentUser: ${user ? user.email : 'null'}`, user ? 'success' : 'error', user ? 'נ‘₪' : 'ג');
        if (!user) { hideFinProgress(); showNotification('ג ׳™׳© ׳׳”׳×׳—׳‘׳¨ ׳׳—׳©׳‘׳•׳ ׳×׳—׳™׳׳”', 'error'); return; }

        const userId = user.uid;
        const jobId  = 'job_' + Date.now();

        setFinStage(1, 'נ”', '׳©׳•׳׳— ׳׳¡׳ ׳›׳¨׳•׳...', '׳׳₪׳¢׳™׳ GitHub Actions', '15%');

        // ג”€ג”€ ׳©׳׳— ׳-GitHub Actions ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
        const GITHUB_TOKEN = window.GITHUB_PAT || '';
        const REPO         = 'ronmailx-boop/Shopping-list';

        if (!GITHUB_TOKEN) {
            log('ג ן¸ ׳—׳¡׳¨ GITHUB_PAT ג€” ׳¢׳™׳™׳ ׳‘׳”׳’׳“׳¨׳•׳×', 'error', 'ג');
            hideFinProgress();
            showNotification('ג ׳—׳¡׳¨ GitHub Token ג€” ׳”׳’׳“׳¨ GITHUB_PAT', 'error');
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

        log('׳©׳•׳׳— ׳-GitHub Actions...', 'info', 'נ€');
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
            log(`׳©׳’׳™׳׳× GitHub: ${ghRes.status} ג€” ${errText}`, 'error', 'ג');
            hideFinProgress();
            showNotification('ג ׳©׳’׳™׳׳× GitHub Actions', 'error');
            return;
        }

        log('GitHub Actions ׳”׳•׳₪׳¢׳ ג…', 'success', 'נ€');
        setFinStage(2, 'ג³', '׳׳׳×׳™׳ ׳׳×׳•׳¦׳׳•׳×...', '׳–׳” ׳׳•׳§׳— ׳¢׳“ 3 ׳“׳§׳•׳×', '40%');

        // ג”€ג”€ ׳”׳׳×׳ ׳׳×׳•׳¦׳׳•׳× ׳‘-Firestore ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
        const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const jobRef = doc(window.firebaseDb, 'bankSync', userId, 'jobs', jobId);

        const transactions = await new Promise((resolve, reject) => {
            const TIMEOUT = 8 * 60 * 1000; // 8 ׳“׳§׳•׳×
            let settled = false;

            const timer = setTimeout(() => {
                if (!settled) { settled = true; unsubscribe(); reject(new Error('timeout')); }
            }, TIMEOUT);

            const unsubscribe = onSnapshot(jobRef, (snap) => {
                if (!snap.exists()) return;
                const data = snap.data();
                log(`׳¡׳˜׳˜׳•׳¡: ${data.status}`, 'info', 'נ“');

                if (data.status === 'running') {
                    setFinStage(2, 'נ”', '׳׳×׳—׳‘׳¨ ׳׳‘׳ ׳§...', 'GitHub Actions ׳₪׳•׳¢׳', '55%');
                }

                if (data.status === 'done') {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timer);
                        unsubscribe();
                        // ׳›׳ account ג†’ ׳׳•׳‘׳™׳™׳§׳˜ ׳ ׳₪׳¨׳“ ׳¢׳ ׳׳¡׳₪׳¨ ׳›׳¨׳˜׳™׳¡ + ׳¢׳¡׳§׳׳•׳× ׳׳׳•׳™׳ ׳•׳×
                        const accounts = (data.accounts || []).map(acc => {
                            const txns = (acc.txns || [])
                                .map(t => ({
                                    name:   t.description || '׳¢׳¡׳§׳”',
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
                        log(`׳”׳×׳§׳‘׳׳• ${totalTxns} ׳¢׳¡׳§׳׳•׳× ׳‘-${accounts.length} ׳›׳¨׳˜׳™׳¡׳™׳ ג…`, 'success', 'ג…');
                        resolve(accounts);
                    }
                }

                if (data.status === 'error') {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timer);
                        unsubscribe();
                        reject(new Error(data.errorMessage || data.errorType || '׳©׳’׳™׳׳”'));
                    }
                }
            }, (err) => {
                if (!settled) { settled = true; clearTimeout(timer); unsubscribe(); reject(err); }
            });
        });

        // ג”€ג”€ ׳”׳¦׳’ ׳¡׳™׳•׳ ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
        setFinStage(3, 'ג™ן¸', '׳׳¢׳‘׳“ ׳ ׳×׳•׳ ׳™׳...', '׳¢׳•׳“ ׳¨׳’׳¢...', '85%');
        await new Promise(r => setTimeout(r, 800));

        document.getElementById('finProgressBar').style.width = '100%';
        document.getElementById('finProgressIcon').textContent = 'ג…';
        document.getElementById('finProgressTitle').textContent = '׳”׳•׳©׳׳ ׳‘׳”׳¦׳׳—׳”!';
        document.getElementById('finProgressSub').textContent = `׳™׳•׳‘׳׳• ${transactions.length} ׳¢׳¡׳§׳׳•׳×`;
        for (let i = 1; i <= 3; i++) {
            document.getElementById('finDot' + i).textContent = 'ג“';
            document.getElementById('finDot' + i).style.background = '#7367f0';
            document.getElementById('finDot' + i).style.color = 'white';
        }
        await new Promise(r => setTimeout(r, 1000));
        hideFinProgress();

        if (transactions.length > 0) {
            // ׳›׳ account+׳—׳•׳“׳© ׳׳§׳‘׳ ׳¨׳©׳™׳׳” ׳ ׳₪׳¨׳“׳×
            const MONTHS_HE = ['׳™׳ ׳•׳׳¨','׳₪׳‘׳¨׳•׳׳¨','׳׳¨׳¥','׳׳₪׳¨׳™׳','׳׳׳™','׳™׳•׳ ׳™','׳™׳•׳׳™','׳׳•׳’׳•׳¡׳˜','׳¡׳₪׳˜׳׳‘׳¨','׳׳•׳§׳˜׳•׳‘׳¨','׳ ׳•׳‘׳׳‘׳¨','׳“׳¦׳׳‘׳¨'];
            let totalImported = 0;
            transactions.forEach(acc => {
                if (!acc.txns || acc.txns.length === 0) return;
                const cardSuffix = acc.accountNumber ? ` ${acc.accountNumber}` : '';
                // ׳§׳‘׳¥ ׳׳₪׳™ ׳—׳•׳“׳©
                const byMonth = {};
                acc.txns.forEach(t => {
                    const d = new Date(t.date);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (!byMonth[key]) byMonth[key] = { year: d.getFullYear(), month: d.getMonth(), txns: [] };
                    byMonth[key].txns.push(t);
                });
                // ׳׳™׳•׳ ׳׳—׳•׳“׳© ׳—׳“׳© ׳׳™׳©׳
                Object.values(byMonth)
                    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
                    .forEach(({ year, month, txns }) => {
                        const monthLabel = `${MONTHS_HE[month]} ${year}`;
                        const listName = `${nameLabel}${cardSuffix} - ${monthLabel}`;
                        // ׳׳™׳™׳ ׳¢׳¡׳§׳׳•׳× ׳׳—׳“׳© ׳׳™׳©׳
                        txns.sort((a, b) => new Date(b.date) - new Date(a.date));
                        importFinancialTransactions(txns, listName);
                        totalImported += txns.length;
                    });
            });
            if (totalImported === 0) showNotification('ג„¹ן¸ ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳×', 'warning');
        } else {
            showNotification('ג„¹ן¸ ׳׳ ׳ ׳׳¦׳׳• ׳¢׳¡׳§׳׳•׳×', 'warning');
        }

    } catch (err) {
        const msg = err.message === 'timeout' ? '׳₪׳¡׳§ ׳”׳–׳׳ ג€” ׳ ׳¡׳” ׳©׳•׳‘' : err.message;
        log(`׳©׳’׳™׳׳”: ${msg}`, 'error', 'נ’¥');
        hideFinProgress();
        showNotification('ג ' + msg, 'error');
    }
}

// ג”€ג”€ Credit card fetch ג”€ג”€
async function startCreditCardFetch() {
    if (!selectedCreditCompany) { showNotification('ג ן¸ ׳‘׳—׳¨ ׳—׳‘׳¨׳× ׳׳©׳¨׳׳™ ׳×׳—׳™׳׳”', 'warning'); return; }
    const username = document.getElementById('creditUsername').value.trim();
    const password = document.getElementById('creditPassword').value.trim();
    if (!username || !password) { showNotification('ג ן¸ ׳”׳–׳ ׳©׳ ׳׳©׳×׳׳© ׳•׳¡׳™׳¡׳׳”', 'warning'); return; }
    await runFinancialFetch({
        companyId: selectedCreditCompany,
        credentials: { username, password },
        modalId: 'creditCardModal',
        nameLabel: 'נ’³ ' + (CREDIT_NAMES[selectedCreditCompany] || '׳׳©׳¨׳׳™')
    });
}

// ג”€ג”€ Bank fetch ג”€ג”€
async function startBankFetch() {
    if (!selectedBank) { showNotification('ג ן¸ ׳‘׳—׳¨ ׳‘׳ ׳§ ׳×׳—׳™׳׳”', 'warning'); return; }
    const cfg = BANK_CONFIG[selectedBank];
    const field1Val = document.getElementById('bankField1').value.trim();
    const password  = document.getElementById('bankConnectPassword').value.trim();
    const field2Val = document.getElementById('bankField2').value.trim();
    if (!field1Val || !password) { showNotification('ג ן¸ ׳”׳–׳ ׳׳× ׳›׳ ׳₪׳¨׳˜׳™ ׳”׳”׳×׳—׳‘׳¨׳•׳×', 'warning'); return; }
    if (cfg.field2 && !field2Val) { showNotification('ג ן¸ ' + cfg.field2Label + ' ׳ ׳“׳¨׳©', 'warning'); return; }
    const credentials = { password };
    credentials[cfg.field1] = field1Val;
    if (cfg.field2) credentials[cfg.field2] = field2Val;
    await runFinancialFetch({
        companyId: selectedBank,
        credentials,
        modalId: 'bankConnectModal',
        nameLabel: 'נ›ן¸ ' + (BANK_NAMES[selectedBank] || '׳‘׳ ׳§')
    });
}

// ג”€ג”€ Import transactions to list ג”€ג”€
function importFinancialTransactions(transactions, nameLabel) {
    const today = new Date().toLocaleDateString('he-IL');
    const newId = 'L' + Date.now();
    const items = transactions.map(t => ({
        name: t.name || t.description || '׳¢׳¡׳§׳”',
        price: parseFloat(t.amount || t.price || 0),
        qty: 1, checked: false, isPaid: true,
        category: detectCategory(t.name || t.description || ''),
        note: t.date ? 'נ“… ' + new Date(t.date).toLocaleDateString('he-IL') : '',
        dueDate: '', paymentUrl: '',
        lastUpdated: Date.now(),
        cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }));
    db.lists[newId] = { name: nameLabel + ' - ' + today, url: '', budget: 0, isTemplate: false, items };
    db.currentId = newId;
    activePage = 'lists';
    save();
    showNotification('ג… ׳™׳•׳‘׳׳• ' + items.length + ' ׳¨׳©׳•׳׳•׳× ׳' + nameLabel + '!');
}

// ג”€ג”€ Dynamic padding for list name bar ג”€ג”€
function adjustContentPadding() {
    const bar = document.getElementById('listNameBar');
    const spacer = document.getElementById('barSpacer');
    if (bar && spacer) {
        const barRect = bar.getBoundingClientRect();
        // ׳’׳•׳‘׳” ׳”׳‘׳¨ + ׳׳™׳§׳•׳׳• ׳׳”׳—׳׳§ ׳”׳¢׳׳™׳•׳ ׳©׳ ׳”׳“׳£
        const totalHeight = barRect.bottom + 8;
        spacer.style.height = totalHeight + 'px';
        document.documentElement.style.setProperty('--lnb-height', barRect.height + 'px');
    }
}

// ResizeObserver ג€” ׳¢׳•׳§׳‘ ׳׳—׳¨׳™ ׳’׳•׳‘׳” ׳”׳‘׳¨ ׳‘׳–׳׳ ׳׳׳×
(function initBarObserver() {
    const bar = document.getElementById('listNameBar');
    if (!bar) { setTimeout(initBarObserver, 100); return; }
    const observer = new ResizeObserver(() => adjustContentPadding());
    observer.observe(bar);
    adjustContentPadding();
    // ׳¨׳¥ ׳©׳•׳‘ ׳׳—׳¨׳™ ׳˜׳¢׳™׳ ׳× ׳₪׳•׳ ׳˜׳™׳
    setTimeout(adjustContentPadding, 100);
    setTimeout(adjustContentPadding, 400);
    setTimeout(adjustContentPadding, 800);
})();

// ג”€ג”€ Compact Mode ג”€ג”€


// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
// גן¸ ׳¡׳“׳¨ ׳¨׳©׳™׳׳•׳× ג€” Edit Mode
// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
function toggleListEditMode() {
    listEditMode = !listEditMode;
    const btn = document.getElementById('listEditModeBtn');
    if (btn) {
        btn.textContent = listEditMode ? 'ג… ׳¡׳™׳•׳' : 'גן¸ ׳¡׳“׳¨ ׳¨׳©׳™׳׳•׳×';
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

// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
// גן¸ ׳¡׳“׳¨ ׳׳•׳¦׳¨׳™׳ ג€” Item Edit Mode
// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
function toggleItemEditMode() {
    itemEditMode = !itemEditMode;
    const btn = document.getElementById('itemEditModeBtn');
    if (btn) {
        btn.textContent = itemEditMode ? 'ג… ׳¡׳™׳•׳' : 'גן¸ ׳¡׳“׳¨ ׳׳•׳¦׳¨׳™׳';
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

// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
// נ“ ׳”׳¦׳’ ׳¡׳›׳•׳ ׳‘-compact mode
// ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•ג•
function toggleCompactStats() {
    compactStatsOpen = !compactStatsOpen;
    const btn1 = document.getElementById('summaryStatsBtn');
    const btn2 = document.getElementById('listsStatsBtn');
    const label = compactStatsOpen ? 'ג• ׳”׳¡׳×׳¨ ׳¡׳›׳•׳' : 'נ“ ׳”׳¦׳’ ׳¡׳›׳•׳';
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
    [btn1, btn2].forEach(b => { if (b) { b.textContent = 'נ“ ׳”׳¦׳’ ׳¡׳›׳•׳'; b.style.background = 'rgba(115,103,240,0.08)'; b.style.color = '#7367f0'; } });
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
        // ׳¨׳©׳™׳׳•׳× ׳©׳׳™ ג€” ׳¨׳©׳™׳׳” ׳—׳“׳©׳”
        if (typeof wizardMode !== 'undefined' && wizardMode) {
            wiz('newList', 'before', () => openModal('newListModal'));
        } else {
            openModal('newListModal');
        }
    } else {
        // ׳¨׳©׳™׳׳” ׳©׳׳™ ג€” ׳₪׳×׳— actions
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

// ג”€ג”€ Legacy startBankSync stub ג”€ג”€
async function startBankSync() { startBankFetch(); }

function renderBankData() {
    const container = document.getElementById('bankDataContainer');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-gray-400 py-10 bg-white rounded-3xl shadow-sm border border-gray-100"><span class="text-5xl block mb-4">נ¦</span><p class="font-medium">׳”׳©׳×׳׳© ׳‘׳›׳₪׳×׳•׳¨ ׳₪׳™׳ ׳ ׳¡׳™ ׳׳©׳׳™׳₪׳× ׳ ׳×׳•׳ ׳™׳.</p></div>';
}



// ג•ג• LIST NAME BAR ג€” ACTIONS PANEL ג•ג•
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

// ׳¢׳“׳›׳•׳ ׳׳™׳§׳•׳ ׳”׳₪׳׳ ׳ ׳•׳”׳‘׳¨ ׳׳₪׳™ ׳’׳•׳‘׳” ׳”-header ׳‘׳₪׳•׳¢׳
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

// ׳¡׳’׳™׳¨׳” ׳‘׳׳—׳™׳¦׳” ׳׳—׳•׳¥ ׳׳₪׳׳ ׳
document.addEventListener('click', function(e) {
    if (!_listPanelOpen) return;
    const arrow  = document.getElementById('lnbArrow');
    const panel  = document.getElementById('listActionsPanel');
    if (arrow && !arrow.contains(e.target) && panel && !panel.contains(e.target)) {
        closeListActionsPanel();
    }
});

// ג”€ג”€ ׳¢׳“׳›׳•׳ ׳×׳•׳•׳™׳× ׳›׳₪׳×׳•׳¨ + ׳׳₪׳™ ׳˜׳׳‘ ג”€ג”€
function _updatePlusBtnLabel() {
    const lbl = document.getElementById('plusBtnLabel');
    if (!lbl) return;
    lbl.textContent = (activePage === 'summary') ? '׳¨׳©׳™׳׳” ׳—׳“׳©׳”' : '׳”׳•׳¡׳£ ׳׳•׳¦׳¨';
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






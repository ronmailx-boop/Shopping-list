// ========== Firebase Configuration ==========
// Firebase methods are attached to window in index.html
let unsubscribeSnapshot = null;
let isSyncing = false;
let isConnected = false;
let currentUser = null;
let syncTimeout = null;

// ========== Categories ==========
const CATEGORIES = {
    'פירות וירקות': '#22c55e',
    'בשר ודגים': '#ef4444',
    'חלב וביצים': '#3b82f6',
    'לחם ומאפים': '#f59e0b',
    'שימורים': '#8b5cf6',
    'חטיפים': '#ec4899',
    'משקאות': '#06b6d4',
    'ניקיון': '#10b981',
    'היגיינה': '#6366f1',
    'אחר': '#6b7280'
};

// ========== Category Keywords ==========
const CATEGORY_KEYWORDS = {
    'פירות וירקות': [
        'עגבניות', 'עגבנייה', 'מלפפון', 'מלפפונים', 'חסה', 'חציל', 'גזר', 'בצל', 'שום', 'תפוח', 'תפוחים',
        'בננה', 'בננות', 'תפוז', 'תפוזים', 'אבוקדו', 'לימון', 'לימונים', 'תות', 'תותים', 'ענבים',
        'אבטיח', 'מלון', 'אפרסק', 'אפרסקים', 'שזיף', 'שזיפים', 'אגס', 'אגסים', 'תרד', 'כרוב',
        'ברוקולי', 'כרובית', 'פלפל', 'פלפלים', 'קישוא', 'קישואים', 'דלעת', 'תירס', 'פטריות',
        'ירקות', 'פירות', 'ירק', 'פרי', 'סלט', 'פטרוזיליה', 'כוסברה', 'נענע', 'בזיליקום'
    ],
    'בשר ודגים': [
        'בשר', 'עוף', 'תרנגולת', 'הודו', 'נקניק', 'נקניקיות', 'קבב', 'המבורגר', 'שניצל',
        'סטייק', 'אנטריקוט', 'צלי', 'כבד', 'לב', 'קורנדביף', 'סלמי', 'נתחי', 'כנפיים',
        'דג', 'דגים', 'סלמון', 'טונה', 'בקלה', 'אמנון', 'דניס', 'לוקוס', 'מושט', 'בורי',
        'שרימפס', 'קלמרי', 'פירות ים', 'סרדינים', 'מקרל'
    ],
    'חלב וביצים': [
        'חלב', 'גבינה', 'גבינות', 'קוטג', 'קוטג׳', 'יוגורט', 'שמנת', 'חמאה', 'ביצים', 'ביצה',
        'לבן', 'לבנה', 'צפתית', 'בולגרית', 'צהובה', 'מוצרלה', 'פרמזן', 'עמק', 'גילה',
        'גד', 'תנובה', 'שטראוס', 'יופלה', 'דנונה', 'מילקי', 'פודינג', 'חלבון', 'מעדן',
        'גלידה', 'גלידות', 'חלבי', 'חלביים'
    ],
    'לחם ומאפים': [
        'לחם', 'לחמניה', 'לחמניות', 'פיתה', 'פיתות', 'בגט', 'חלה', 'חלות', 'טוסט', 'כריך',
        'רוגלך', 'בורקס', 'בורקסים', 'קרואסון', 'קרואסונים', 'מאפה', 'מאפים', 'עוגה', 'עוגות',
        'עוגיות', 'עוגייה', 'ביסקוויט', 'קרקר', 'קרקרים', 'פריכיות', 'לחמית', 'בייגל',
        'מצה', 'מצות', 'פיצה', 'פסטה', 'ספגטי', 'מקרוני', 'אטריות', 'קוסקוס', 'בורגול',
        'קמח', 'שמרים', 'אבקת אפייה', 'סוכר', 'אורז', 'פתיתים'
    ],
    'שימורים': [
        'שימורים', 'קופסא', 'קופסת', 'שימורי', 'תירס שימורי', 'פטריות שימורי', 'זיתים',
        'מלפפונים חמוצים', 'חמוצים', 'כבושים', 'רוטב עגבניות', 'עגבניות מרוסקות', 'ממרח',
        'טונה קופסא', 'סרדינים קופסא', 'הומוס', 'טחינה', 'חומוס', 'פול', 'חומוס מוכן',
        'סלט', 'פסטה מוכנה', 'רוטב', 'רטבים', 'קטשופ', 'מיונז', 'חרדל', 'ריבה', 'דבש',
        'ממרחים', 'נוטלה', 'שוקולד ממרח'
    ],
    'חטיפים': [
        'חטיף', 'חטיפים', 'במבה', 'ביסלי', 'דוריטוס', 'צ׳יפס', 'צ׳יטוס', 'אפרופו', 'טורטית',
        'פופקורן', 'בוטנים', 'אגוזים', 'שקדים', 'קשיו', 'פיסטוק', 'גרעינים', 'צימוקים',
        'פירות יבשים', 'תמרים', 'משמש מיובש', 'שוקולד', 'ממתק', 'ממתקים', 'סוכריות',
        'גומי', 'מנטה', 'מסטיק', 'וופל', 'וופלים', 'חטיף אנרגיה', 'חטיף חלבון', 'גרנולה',
        'בר', 'ברים', 'קליק', 'פסק זמן', 'קינדר', 'מרס', 'סניקרס', 'טוויקס', 'קיט קט'
    ],
    'משקאות': [
        'מים', 'מי', 'מינרלים', 'נביעות', 'עדן', 'נווה', 'קולה', 'פפסי', 'ספרייט', 'פאנטה',
        'שוופס', 'סודה', 'משקה', 'משקאות', 'מיץ', 'מיצים', 'תפוזים', 'פריגת', 'פרימור',
        'בירה', 'יין', 'וודקה', 'ויסקי', 'אלכוהול', 'קפה', 'נס', 'נסקפה', 'תה', 'תיונים',
        'ויסוצקי', 'חליבה', 'שוקו', 'חלב שוקולד', 'אייס קפה', 'אנרגיה', 'רד בול', 'XL',
        'פחית', 'בקבוק', 'שתייה', 'לימונדה', 'לימונענע', 'תפוזינה'
    ],
    'ניקיון': [
        'סבון', 'סבונים', 'ניקוי', 'ניקיון', 'דטרגנט', 'אבקת כביסה', 'מרכך', 'מרככים',
        'אקונומיקה', 'סנו', 'כלורקס', 'ווניש', 'פרסיל', 'אריאל', 'ביומט', 'סיף', 'מטליות',
        'ספוג', 'ספוגים', 'מגבונים', 'נייר מגבת', 'נייר טואלט', 'טישו', 'מברשת', 'מברשות',
        'שואב', 'שקיות אשפה', 'אשפה', 'סמרטוט', 'דלי', 'מנקה', 'מנקים', 'אקונומיקה',
        'ג׳ל כלים', 'נוזל כלים', 'פיירי', 'סודה לשתייה', 'חומץ', 'אלכוהול ניקוי', 'כפפות'
    ],
    'היגיינה': [
        'שמפו', 'מרכך שיער', 'סבון גוף', 'ג׳ל רחצה', 'משחת שיניים', 'מברשת שיניים', 'חוט דנטלי',
        'דאודורנט', 'בושם', 'קרם', 'קרמים', 'תחליב', 'לוסיון', 'קצף גילוח', 'סכין גילוח',
        'מכונת גילוח', 'ג׳ילט', 'ואקס', 'תחבושות', 'פלסטרים', 'צמר גפן', 'מקלוני אוזניים',
        'טמפונים', 'תחבושות היגייניות', 'מגבונים לחים', 'חיתולים', 'האגיס', 'פמפרס',
        'קרם ידיים', 'קרם פנים', 'מסכה', 'מסכות', 'איפור', 'שפתון', 'מסקרה', 'טיפוח'
    ]
};

// Function to detect category from product name
function detectCategory(productName) {
    if (!productName) return '';

    const nameLower = productName.toLowerCase().trim();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    return ''; // Return empty string if no match (will become 'כללי' in render)
}


// ========== Category Translations ==========
const categoryTranslations = {
    he: {
        'פירות וירקות': '🥬 פירות וירקות',
        'בשר ודגים': '🥩 בשר ודגים',
        'חלב וביצים': '🥛 חלב וביצים',
        'לחם ומאפים': '🍞 לחם ומאפים',
        'שימורים': '🥫 שימורים',
        'חטיפים': '🍪 חטיפים',
        'משקאות': '🥤 משקאות',
        'ניקיון': '🧹 ניקיון',
        'היגיינה': '🧴 היגיינה',
        'אחר': '📦 אחר'
    },
    en: {
        'פירות וירקות': '🥬 Fruits & Vegetables',
        'בשר ודגים': '🥩 Meat & Fish',
        'חלב וביצים': '🥛 Dairy & Eggs',
        'לחם ומאפים': '🍞 Bread & Bakery',
        'שימורים': '🥫 Canned Goods',
        'חטיפים': '🍪 Snacks',
        'משקאות': '🥤 Beverages',
        'ניקיון': '🧹 Cleaning',
        'היגיינה': '🧴 Hygiene',
        'אחר': '📦 Other'
    },
    ru: {
        'פירות וירקות': '🥬 Фрукты и Овощи',
        'בשר ודגים': '🥩 Мясо и Рыба',
        'חלב וביצים': '🥛 Молочные и Яйца',
        'לחם ומאפים': '🍞 Хлеб и Выпечка',
        'שימורים': '🥫 Консервы',
        'חטיפים': '🍪 Закуски',
        'משקאות': '🥤 Напитки',
        'ניקיון': '🧹 Уборка',
        'היגיינה': '🧴 Гигиена',
        'אחר': '📦 Другое'
    },
    ro: {
        'פירות וירקות': '🥬 Fructe și Legume',
        'בשר ודגים': '🥩 Carne și Pește',
        'חלב וביצים': '🥛 Lactate și Ouă',
        'לחם ומאפים': '🍞 Pâine și Patiserie',
        'שימורים': '🥫 Conserve',
        'חטיפים': '🍪 Gustări',
        'משקאות': '🥤 Băuturi',
        'ניקיון': '🧹 Curățenie',
        'היגיינה': '🧴 Igienă',
        'אחר': '📦 Altele'
    }
};

// ========== Translations ==========
const translations = {
    he: {
        appName: 'Vplus', cloudSync: 'סנכרון ענן', myList: 'הרשימה שלי', myLists: 'הרשימות שלי',
        statistics: '📊 סטטיסטיקות', newList: '+ רשימה חדשה', import: '📥 ייבוא', scanReceipt: '📸 סרוק קבלה',
        addItem: '+', share: 'שתף', translate: 'תרגם', settings: 'הגדרות', items: 'מוצרים',
        locked: 'נעול', unlocked: 'עריכה (גרירה פעילה)', categorySortBtn: '🔤 מיון לפי קטגוריות', manualSortBtn: '📋 מיון ידני',
        budgetWarning: '⚠️ חריגה מתקציב!', searchPlaceholder: 'חפש מוצר ברשימה...', totalList: 'סה"כ רשימה',
        paidInList: 'שולם ברשימה', remainingToPay: 'נשאר לשלם', addItemTitle: 'הוספת מוצר',
        productName: 'שם המוצר', price: 'מחיר', selectCategory: 'בחר קטגוריה (אופציונלי)', add: 'הוסף',
        cancel: 'ביטול', importTitle: 'ייבוא רשימה מטקסט', importDesc: 'הדבק טקסט מוואטסאפ או כל רשימה',
        importPlaceholder: 'הדבק כאן טקסט לייבוא...', importBtn: 'ייבא', newListTitle: 'רשימה חדשה',
        listName: 'שם הרשימה', websiteUrl: 'כתובת אתר (אופציונלי)', budget: 'תקציב (אופציונלי)',
        saveAsTemplate: '⭐ שמור כתבנית', create: 'צור', completeListTitle: 'סיום רשימה',
        completeListMsg: 'לסמן רשימה זו כהושלמה ולשמור בהיסטוריה?', complete: 'השלם',
        deleteListTitle: 'מחיקת רשימה', delete: 'מחק', editListTitle: 'עריכת רשימה', save: 'שמור',
        updatePriceTitle: 'עדכון מחיר', update: 'עדכן', historyTitle: '📁 היסטוריית רכישות', close: 'סגור',
        templatesTitle: '⭐ תבניות רשימות', completedListsTitle: '✅ רשימות שהושלמו', settingsTitle: 'הגדרות',
        darkMode: 'מצב לילה 🌙', lightMode: 'מצב יום ☀️', savedTemplates: '⭐ תבניות שמורות',
        printPDF: 'הדפס PDF 🖨️', backupData: '💾 גיבוי נתונים', restoreData: '📂 שחזר נתונים',
        language: 'שפת ממשק', translateListTitle: 'תרגם רשימה', translateDesc: 'בחר שפת יעד לתרגום כל המוצרים ברשימה',
        translateBtn: '🌐 תרגם', scanReceiptTitle: 'סריקת קבלה', scanReceiptDesc: 'העלה תמונת קבלה לזיהוי אוטומטי של מוצרים', selectImage: 'בחר תמונה', scan: 'סרוק',
        uploading: 'מעלה תמונה...', detectingText: 'מזהה טקסט...', processingResults: 'מעבד תוצאות...',
        completed: 'הושלם!', monthlyStats: '📊 סטטיסטיקות חודשיות', monthlyExpenses: 'הוצאות החודש',
        completedListsCount: 'רשימות הושלמו 👆', avgPerList: 'ממוצע לרשימה', popularItems: '🏆 מוצרים פופולריים',
        history: '📁 היסטוריה', viewCompletedLists: 'צפה ברשימות שהושלמו', pleaseSelectImage: 'אנא בחר תמונה',
        noTextDetected: 'לא זוהה טקסט בתמונה - נסה תמונה ברורה יותר', noItemsFound: 'לא נמצאו מוצרים בקבלה - נסה תמונה אחרת',
        listCreated: 'נוצרה רשימה עם', items2: 'מוצרים!', scanError: 'שגיאה בסריקת הקבלה',
        apiError: 'שגיאת הרשאה - ה-API Key לא תקין או אין הרשאות', formatError: 'שגיאה בפורמט הבקשה',
        quotaError: 'חרגת ממכסת ה-API - נסה שוב מאוחר יותר', categorySortEnabled: '✅ מיון לפי קטגוריות מופעל',
        manualSortEnabled: '✅ מיון ידני מופעל', listening: '🎤 מקשיב...', noSpeechDetected: 'לא זוהה דיבור, נסה שוב',
        voiceError: 'שגיאה בזיהוי קולי', browserNotSupported: 'הדפדפן לא תומך בזיהוי קולי',
        micError: 'שגיאה בהפעלת המיקרופון', noItemsDetected: 'לא זוהו מוצרים, נסה שוב', addedItems: 'נוספו',
        selectAll: 'בחר את כל הרשימות'
    },
    en: {
        appName: 'Vplus', cloudSync: 'Cloud Sync', myList: 'My List', myLists: 'My Lists',
        statistics: '📊 Statistics', newList: '+ New List', import: '📥 Import', scanReceipt: '📸 Scan Receipt',
        addItem: '+', share: 'Share', translate: 'Translate', settings: 'Settings', items: 'items',
        locked: 'Locked', unlocked: 'Editing (Drag Active)', categorySortBtn: '🔤 Sort by Categories', manualSortBtn: '📋 Manual Sort',
        budgetWarning: '⚠️ Over Budget!', searchPlaceholder: 'Search for product...', totalList: 'Total',
        paidInList: 'Paid', remainingToPay: 'Remaining', addItemTitle: 'Add Item',
        productName: 'Product Name', price: 'Price', selectCategory: 'Select Category (optional)', add: 'Add',
        cancel: 'Cancel', importTitle: 'Import List from Text', importDesc: 'Paste text from WhatsApp or any list',
        importPlaceholder: 'Paste text here to import...', importBtn: 'Import', newListTitle: 'New List',
        listName: 'List Name', websiteUrl: 'Website URL (optional)', budget: 'Budget (optional)',
        saveAsTemplate: '⭐ Save as Template', create: 'Create', completeListTitle: 'Complete List',
        completeListMsg: 'Mark this list as completed and save to history?', complete: 'Complete',
        deleteListTitle: 'Delete List', delete: 'Delete', editListTitle: 'Edit List', save: 'Save',
        updatePriceTitle: 'Update Price', update: 'Update', historyTitle: '📁 Purchase History', close: 'Close',
        templatesTitle: '⭐ List Templates', completedListsTitle: '✅ Completed Lists', settingsTitle: 'Settings',
        darkMode: 'Dark Mode 🌙', lightMode: 'Light Mode ☀️', savedTemplates: '⭐ Saved Templates',
        printPDF: 'Print PDF 🖨️', backupData: '💾 Backup Data', restoreData: '📂 Restore Data',
        language: 'Interface Language', translateListTitle: 'Translate List', translateDesc: 'Select target language to translate all items',
        translateBtn: '🌐 Translate', scanReceiptTitle: 'Scan Receipt', scanReceiptDesc: 'Upload receipt image for automatic product detection', selectImage: 'Select Image', scan: 'Scan',
        uploading: 'Uploading image...', detectingText: 'Detecting text...', processingResults: 'Processing results...',
        completed: 'Completed!', monthlyStats: '📊 Monthly Statistics', monthlyExpenses: 'Monthly Expenses',
        completedListsCount: 'Lists Completed 👆', avgPerList: 'Average per List', popularItems: '🏆 Popular Items',
        history: '📁 History', viewCompletedLists: 'View Completed Lists', pleaseSelectImage: 'Please select an image',
        noTextDetected: 'No text detected - try a clearer image', noItemsFound: 'No items found in receipt - try another image',
        listCreated: 'Created list with', items2: 'items!', scanError: 'Error scanning receipt',
        apiError: 'Authorization error - API Key invalid or no permissions', formatError: 'Request format error',
        quotaError: 'API quota exceeded - try again later', categorySortEnabled: '✅ Category sort enabled',
        manualSortEnabled: '✅ Manual sort enabled', listening: '🎤 Listening...', noSpeechDetected: 'No speech detected, try again',
        voiceError: 'Voice recognition error', browserNotSupported: 'Browser does not support voice recognition',
        micError: 'Error activating microphone', noItemsDetected: 'No items detected, try again', addedItems: 'Added',
        selectAll: 'Select All Lists'
    },
    ru: {
        appName: 'Vplus', cloudSync: 'Синхронизация', myList: 'Мой Список', myLists: 'Мои Списки',
        statistics: '📊 Статистика', newList: '+ Новый Список', import: '📥 Импорт', scanReceipt: '📸 Сканировать Чек',
        addItem: '+', share: 'Поделиться', translate: 'Перевести', settings: 'Настройки', items: 'товаров',
        locked: 'Заблокировано', unlocked: 'Редактирование (перетаскивание активно)', categorySortBtn: '🔤 Сортировка по Категориям', manualSortBtn: '📋 Ручная Сортировка',
        budgetWarning: '⚠️ Превышен Бюджет!', searchPlaceholder: 'Поиск товара...', totalList: 'Всего',
        paidInList: 'Оплачено', remainingToPay: 'Осталось', addItemTitle: 'Добавить Товар',
        productName: 'Название Товара', price: 'Цена', selectCategory: 'Выбрать Категорию (необязательно)', add: 'Добавить',
        cancel: 'Отмена', importTitle: 'Импорт Списка из Текста', importDesc: 'Вставьте текст из WhatsApp или любого списка',
        importPlaceholder: 'Вставьте текст для импорта...', importBtn: 'Импортировать', newListTitle: 'Новый Список',
        listName: 'Название Списка', websiteUrl: 'URL Сайта (необязательно)', budget: 'Бюджет (необязательно)',
        saveAsTemplate: '⭐ Сохранить как Шаблон', create: 'Создать', completeListTitle: 'Завершить Список',
        completeListMsg: 'Отметить этот список как завершенный и сохранить в истории?', complete: 'Завершить',
        deleteListTitle: 'Удалить Список', delete: 'Удалить', editListTitle: 'Редактировать Список', save: 'Сохранить',
        updatePriceTitle: 'Обновить Цену', update: 'Обновить', historyTitle: '📁 История Покупок', close: 'Закрыть',
        templatesTitle: '⭐ Шаблоны Списков', completedListsTitle: '✅ Завершенные Списки', settingsTitle: 'Настройки',
        darkMode: 'Темный Режим 🌙', lightMode: 'Светлый Режим ☀️', savedTemplates: '⭐ Сохраненные Шаблоны',
        printPDF: 'Печать PDF 🖨️', backupData: '💾 Резервное Копирование', restoreData: '📂 Восстановить Данные',
        language: 'Язык Интерфейса', translateListTitle: 'Перевести Список', translateDesc: 'Выберите язык для перевода всех товаров',
        translateBtn: '🌐 Перевести', scanReceiptTitle: 'Сканирование Чека', scanReceiptDesc: 'Загрузите фото чека для автоматического распознавания товаров', selectImage: 'Выбрать Изображение', scan: 'Сканировать',
        uploading: 'Загрузка изображения...', detectingText: 'Распознавание текста...', processingResults: 'Обработка результатов...',
        completed: 'Завершено!', monthlyStats: '📊 Месячная Статистика', monthlyExpenses: 'Расходы за Месяц',
        completedListsCount: 'Завершено Списков 👆', avgPerList: 'Средний на Список', popularItems: '🏆 Популярные Товары',
        history: '📁 История', viewCompletedLists: 'Просмотр Завершенных Списков', pleaseSelectImage: 'Пожалуйста, выберите изображение',
        noTextDetected: 'Текст не обнаружен - попробуйте более четкое изображение', noItemsFound: 'Товары не найдены в чеке - попробуйте другое изображение',
        listCreated: 'Создан список с', items2: 'товарами!', scanError: 'Ошибка сканирования чека',
        apiError: 'Ошибка авторизации - API ключ недействителен или нет разрешений', formatError: 'Ошибка формата запроса',
        quotaError: 'Превышена квота API - попробуйте позже', categorySortEnabled: '✅ Сортировка по категориям включена',
        manualSortEnabled: '✅ Ручная сортировка включена', listening: '🎤 Слушаю...', noSpeechDetected: 'Речь не обнаружена, попробуйте снова',
        voiceError: 'Ошибка распознавания голоса', browserNotSupported: 'Браузер не поддерживает распознавание голоса',
        micError: 'Ошибка активации микрофона', noItemsDetected: 'Товары не обнаружены, попробуйте снова', addedItems: 'Добавлено',
        selectAll: 'Выбрать Все Списки'
    },
    ro: {
        appName: 'Vplus', cloudSync: 'Sincronizare Cloud', myList: 'Lista Mea', myLists: 'Listele Mele',
        statistics: '📊 Statistici', newList: '+ Listă Nouă', import: '📥 Import', scanReceipt: '📸 Scanează Bon',
        addItem: '+', share: 'Distribuie', translate: 'Traduce', settings: 'Setări', items: 'produse',
        locked: 'Blocat', unlocked: 'Editare (Tragere Activă)', categorySortBtn: '🔤 Sortare după Categorii', manualSortBtn: '📋 Sortare Manuală',
        budgetWarning: '⚠️ Buget Depășit!', searchPlaceholder: 'Caută produs...', totalList: 'Total',
        paidInList: 'Plătit', remainingToPay: 'Rămas', addItemTitle: 'Adaugă Produs',
        productName: 'Nume Produs', price: 'Preț', selectCategory: 'Selectează Categorie (opțional)', add: 'Adaugă',
        cancel: 'Anulează', importTitle: 'Import Listă din Text', importDesc: 'Lipește text din WhatsApp sau orice listă',
        importPlaceholder: 'Lipește text aici pentru import...', importBtn: 'Importă', newListTitle: 'Listă Nouă',
        listName: 'Nume Listă', websiteUrl: 'URL Site (opțional)', budget: 'Buget (opțional)',
        saveAsTemplate: '⭐ Salvează ca Șablon', create: 'Creează', completeListTitle: 'Finalizare Listă',
        completeListMsg: 'Marchează această listă ca finalizată și salvează în istoric?', complete: 'Finalizează',
        deleteListTitle: 'Șterge Listă', delete: 'Șterge', editListTitle: 'Editează Listă', save: 'Salvează',
        updatePriceTitle: 'Actualizare Preț', update: 'Actualizează', historyTitle: '📁 Istoric Achiziții', close: 'Închide',
        templatesTitle: '⭐ Șabloane Liste', completedListsTitle: '✅ Liste Finalizate', settingsTitle: 'Setări',
        darkMode: 'Mod Întunecat 🌙', lightMode: 'Mod Luminos ☀️', savedTemplates: '⭐ Șabloane Salvate',
        printPDF: 'Printează PDF 🖨️', backupData: '💾 Backup Date', restoreData: '📂 Restaurare Date',
        language: 'Limba Interfeței', translateListTitle: 'Traduce Listă', translateDesc: 'Selectează limba țintă pentru traducerea tuturor produselor',
        translateBtn: '🌐 Traduce', scanReceiptTitle: 'Scanare Bon', scanReceiptDesc: 'Încărcați imaginea bonului pentru detectarea automată a produselor', selectImage: 'Selectează Imagine', scan: 'Scanează',
        uploading: 'Se încarcă imaginea...', detectingText: 'Se detectează textul...', processingResults: 'Se procesează rezultatele...',
        completed: 'Finalizat!', monthlyStats: '📊 Statistici Lunare', monthlyExpenses: 'Cheltuieli Lunare',
        completedListsCount: 'Liste Finalizate 👆', avgPerList: 'Medie pe Listă', popularItems: '🏆 Produse Populare',
        history: '📁 Istoric', viewCompletedLists: 'Vezi Liste Finalizate', pleaseSelectImage: 'Vă rugăm selectați o imagine',
        noTextDetected: 'Nu s-a detectat text - încercați o imagine mai clară', noItemsFound: 'Nu s-au găsit produse în bon - încercați altă imagine',
        listCreated: 'Listă creată cu', items2: 'produse!', scanError: 'Eroare la scanarea bonului',
        apiError: 'Eroare de autorizare - Cheia API invalidă sau fără permisiuni', formatError: 'Eroare de format cerere',
        quotaError: 'Cotă API depășită - încercați mai târziu', categorySortEnabled: '✅ Sortare după categorii activată',
        manualSortEnabled: '✅ Sortare manuală activată', listening: '🎤 Ascult...', noSpeechDetected: 'Nu s-a detectat vorbire, încercați din nou',
        voiceError: 'Eroare recunoaștere vocală', browserNotSupported: 'Browserul nu suportă recunoașterea vocală',
        micError: 'Eroare activare microfon', noItemsDetected: 'Nu s-au detectat produse, încercați din nou', addedItems: 'Adăugate',
        selectAll: 'Selectează Toate Listele'
    }
};

// Current language (default: Hebrew)
let currentLang = localStorage.getItem('appLanguage') || 'he';

// Translation helper function
function t(key) {
    return translations[currentLang][key] || translations['he'][key] || key;
}


// ========== App Data ==========
let db = JSON.parse(localStorage.getItem('BUDGET_FINAL_V28')) || {
    currentId: 'L1',
    selectedInSummary: [],
    lists: {
        'L1': {
            name: 'הרשימה שלי',
            url: '',
            budget: 0,
            isTemplate: false,
            items: []
        }
    },
    history: [],
    templates: [],
    lastActivePage: 'lists',
    lastSync: 0,
    stats: {
        totalSpent: 0,
        listsCompleted: 0,
        monthlyData: {}
    }
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;
let monthlyChart = null;
let highlightedItemIndex = null;
let highlightedListId = null;
let categorySortEnabled = localStorage.getItem('categorySortEnabled') === 'true' || false;


// ========== Core Functions ==========
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();

    if (isConnected && currentUser) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncToCloud();
        }, 1500);
    }
}

function toggleItem(idx) {
    db.lists[db.currentId].items[idx].checked = !db.lists[db.currentId].items[idx].checked;
    save();
}

function toggleSum(id) {
    const i = db.selectedInSummary.indexOf(id);
    if (i > -1) db.selectedInSummary.splice(i, 1);
    else db.selectedInSummary.push(id);
    save();
}

function toggleSelectAll(checked) {
    db.selectedInSummary = checked ? Object.keys(db.lists) : [];
    save();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    const text = document.getElementById('darkModeText');
    if (text) {
        text.textContent = document.body.classList.contains('dark-mode') ? 'מצב יום ☀️' : 'מצב לילה 🌙';
    }
}

function showPage(p) {
    activePage = p;
    save();
}

function toggleCategorySorting() {
    categorySortEnabled = !categorySortEnabled;
    localStorage.setItem('categorySortEnabled', categorySortEnabled);

    const btn = document.getElementById('categorySortText');
    if (btn) {
        // Show current active state, not next action
        btn.textContent = categorySortEnabled ? '🔤 מיון לפי קטגוריות' : '📋 מיון ידני';
    }

    render();
    showNotification(categorySortEnabled ? '✅ מיון לפי קטגוריות מופעל' : '✅ מיון ידני מופעל');
}

// ========== Language Functions ==========
function confirmLanguageChange() {
    const selector = document.getElementById('languageSelector');
    const newLang = selector.value;

    if (newLang === currentLang) {
        showNotification('✓ ' + t('language') + ' ' + selector.options[selector.selectedIndex].text);
        return;
    }

    changeLanguage(newLang);
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLanguage', lang);

    // Update HTML direction and lang attribute
    const html = document.documentElement;
    if (lang === 'he') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'he');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', lang);
    }

    // Update all UI text
    updateUILanguage();

    // Reset voice recognition to use new language
    recognition = null;

    // Re-render to update dynamic content
    render();

    // Show success notification
    showNotification('✓ ' + t('language') + ' ' + document.getElementById('languageSelector').options[document.getElementById('languageSelector').selectedIndex].text);
}

function updateUILanguage() {
    // Update settings modal
    const settingsTitle = document.getElementById('settingsModalTitle');
    if (settingsTitle) settingsTitle.textContent = t('settingsTitle');

    const languageLabel = document.getElementById('languageLabel');
    if (languageLabel) languageLabel.textContent = t('language');

    const confirmLangBtn = document.getElementById('confirmLangBtn');
    if (confirmLangBtn) confirmLangBtn.innerHTML = '✓ ' + (currentLang === 'he' ? 'אשר שינוי שפה' : currentLang === 'en' ? 'Confirm Language Change' : currentLang === 'ru' ? 'Подтвердить Изменение Языка' : 'Confirmă Schimbarea Limbii');

    const savedTemplatesBtn = document.getElementById('savedTemplatesBtn');
    if (savedTemplatesBtn) savedTemplatesBtn.textContent = t('savedTemplates');

    const printPDFBtn = document.getElementById('printPDFBtn');
    if (printPDFBtn) printPDFBtn.textContent = t('printPDF');

    const backupDataBtn = document.getElementById('backupDataBtn');
    if (backupDataBtn) backupDataBtn.textContent = t('backupData');

    const restoreDataBtn = document.getElementById('restoreDataBtn');
    if (restoreDataBtn) restoreDataBtn.textContent = t('restoreData');

    // Update dark mode text
    const darkModeText = document.getElementById('darkModeText');
    if (darkModeText) {
        darkModeText.textContent = document.body.classList.contains('dark-mode') ? t('lightMode') : t('darkMode');
    }

    // Update category sort button text
    const categorySortText = document.getElementById('categorySortText');
    if (categorySortText) {
        categorySortText.textContent = categorySortEnabled ? t('categorySortBtn') : t('manualSortBtn');
    }

    // Update language selector value
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.value = currentLang;
    }

    // Update bottom bar labels
    const totalListLabel = document.getElementById('totalListLabel');
    if (totalListLabel) totalListLabel.textContent = t('totalList');

    const paidInListLabel = document.getElementById('paidInListLabel');
    if (paidInListLabel) paidInListLabel.textContent = t('paidInList');

    const remainingToPayLabel = document.getElementById('remainingToPayLabel');
    if (remainingToPayLabel) remainingToPayLabel.textContent = t('remainingToPay');

    // Update statistics page labels
    const completedListsCountLabel = document.getElementById('completedListsCountLabel');
    if (completedListsCountLabel) completedListsCountLabel.textContent = t('completedListsCount');

    const avgPerListLabel = document.getElementById('avgPerListLabel');
    if (avgPerListLabel) avgPerListLabel.textContent = t('avgPerList');

    const popularItemsTitle = document.getElementById('popularItemsTitle');
    if (popularItemsTitle) popularItemsTitle.textContent = t('popularItems');

    const historyStatsTitle = document.getElementById('historyStatsTitle');
    if (historyStatsTitle) historyStatsTitle.textContent = t('history');

    const viewCompletedListsBtn = document.getElementById('viewCompletedListsBtn');
    if (viewCompletedListsBtn) viewCompletedListsBtn.textContent = t('viewCompletedLists');

    // Update select all lists label
    const selectAllLabel = document.getElementById('selectAllLabel');
    if (selectAllLabel) selectAllLabel.textContent = t('selectAll');

    // Update tabs
    const tabs = document.querySelectorAll('.tab-btn');
    if (tabs.length >= 3) {
        tabs[0].textContent = t('myList');
        tabs[1].textContent = t('myLists');
        tabs[2].textContent = t('statistics');
    }

    // Update header buttons
    const cloudSyncText = document.getElementById('cloudSyncText');
    if (cloudSyncText) cloudSyncText.textContent = t('cloudSync');

    const cloudSyncBtn = document.querySelector('[onclick="handleAuthClick()"]');
    if (cloudSyncBtn) cloudSyncBtn.textContent = t('cloudSync');

    // Update action buttons
    const newListBtn = document.querySelector('[onclick="openModal(\'newListModal\')"]');
    if (newListBtn) newListBtn.textContent = t('newList');

    const importBtn = document.querySelector('[onclick="openModal(\'importModal\')"]');
    if (importBtn) importBtn.textContent = t('import');

    const scanReceiptBtn = document.querySelector('[onclick="openModal(\'receiptScanModal\')"]');
    if (scanReceiptBtn) scanReceiptBtn.textContent = t('scanReceipt');

    // Update search input placeholder
    const listSearchInput = document.getElementById('listSearchInput');
    if (listSearchInput) listSearchInput.placeholder = t('searchPlaceholder');

    // Update modal titles and buttons
    updateModalTexts();

    // Update category options
    updateCategoryOptions();
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('itemCategory');
    if (!categorySelect) return;

    const currentValue = categorySelect.value;
    const categories = categoryTranslations[currentLang] || categoryTranslations['he'];

    // Update all option texts except the first one (placeholder)
    const options = categorySelect.options;
    options[0].textContent = t('selectCategory');

    // Update category options
    let optionIndex = 1;
    for (const hebrewKey in categories) {
        if (options[optionIndex]) {
            options[optionIndex].textContent = categories[hebrewKey];
            optionIndex++;
        }
    }

    // Restore selected value
    categorySelect.value = currentValue;
}

function updateModalTexts() {
    // Update statistics page
    const monthlyStatsTitle = document.getElementById('monthlyStatsTitle');
    if (monthlyStatsTitle) monthlyStatsTitle.textContent = t('monthlyStats');

    const monthlyExpensesLabel = document.getElementById('monthlyExpensesLabel');
    if (monthlyExpensesLabel) monthlyExpensesLabel.textContent = t('monthlyExpenses');

    // Add Item Modal
    const addItemModalTitle = document.getElementById('addItemModalTitle');
    if (addItemModalTitle) addItemModalTitle.textContent = t('addItemTitle');

    const addItemTitle = document.querySelector('#addItemModal h2');
    if (addItemTitle) addItemTitle.textContent = t('addItemTitle');

    const itemNameInput = document.getElementById('itemName');
    if (itemNameInput) itemNameInput.placeholder = t('productName');

    const itemPriceInput = document.getElementById('itemPrice');
    if (itemPriceInput) itemPriceInput.placeholder = t('price');

    const categorySelect = document.getElementById('itemCategory');
    if (categorySelect && categorySelect.options.length > 0) {
        categorySelect.options[0].textContent = t('selectCategory');
    }

    // Import Modal
    const importTitle = document.querySelector('#importModal h2');
    if (importTitle) importTitle.textContent = t('importTitle');

    const importTextarea = document.getElementById('importText');
    if (importTextarea) importTextarea.placeholder = t('importPlaceholder');

    // New List Modal
    const newListTitle = document.querySelector('#newListModal h2');
    if (newListTitle) newListTitle.textContent = t('newListTitle');

    const newListNameInput = document.getElementById('newListName');
    if (newListNameInput) newListNameInput.placeholder = t('listName');

    const newListUrlInput = document.getElementById('newListUrl');
    if (newListUrlInput) newListUrlInput.placeholder = t('websiteUrl');

    const newListBudgetInput = document.getElementById('newListBudget');
    if (newListBudgetInput) newListBudgetInput.placeholder = t('budget');

    // Receipt Scan Modal
    const scanReceiptModalTitle = document.getElementById('scanReceiptModalTitle');
    if (scanReceiptModalTitle) scanReceiptModalTitle.textContent = t('scanReceiptTitle');

    const scanReceiptDesc = document.getElementById('scanReceiptDesc');
    if (scanReceiptDesc) scanReceiptDesc.textContent = t('scanReceiptDesc');

    // Confirm Modal
    const confirmTitle = document.querySelector('#confirmModal h2');
    if (confirmTitle) confirmTitle.textContent = t('completeListTitle');

    const confirmMsg = document.querySelector('#confirmModal p');
    if (confirmMsg) confirmMsg.textContent = t('completeListMsg');

    // Delete List Modal
    const deleteListTitle = document.querySelector('#deleteListModal h2');
    if (deleteListTitle) deleteListTitle.textContent = t('deleteListTitle');

    // Edit List Modal
    const editListTitle = document.querySelector('#editListNameModal h2');
    if (editListTitle) editListTitle.textContent = t('editListTitle');

    const editListNameInput = document.getElementById('editListNameInput');
    if (editListNameInput) editListNameInput.placeholder = t('listName');

    const editListUrlInput = document.getElementById('editListUrlInput');
    if (editListUrlInput) editListUrlInput.placeholder = t('websiteUrl');

    const editListBudget = document.getElementById('editListBudget');
    if (editListBudget) editListBudget.placeholder = t('budget');

    // Edit Total Modal
    const editTotalTitle = document.querySelector('#editTotalModal h2');
    if (editTotalTitle) editTotalTitle.textContent = t('updatePriceTitle');

    // History Modal
    const historyTitle = document.querySelector('#historyModal h2');
    if (historyTitle) historyTitle.textContent = t('historyTitle');

    // Templates Modal
    const templatesTitle = document.querySelector('#templatesModal h2');
    if (templatesTitle) templatesTitle.textContent = t('templatesTitle');

    // Completed Lists Modal
    const completedTitle = document.querySelector('#completedListsModal h2');
    if (completedTitle) completedTitle.textContent = t('completedListsTitle');

    // Receipt Scan Modal
    const scanTitle = document.querySelector('#receiptScanModal h2');
    if (scanTitle) scanTitle.textContent = t('scanReceiptTitle');

    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) scanBtn.textContent = t('scan');

    // Translate Modal
    const translateTitle = document.querySelector('#translateModal h2');
    if (translateTitle) translateTitle.textContent = t('translateListTitle');

    const translateDesc = document.querySelector('#translateModal p');
    if (translateDesc) translateDesc.textContent = t('translateDesc');

    // Update all buttons with common text
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim();
        if (text === 'הוסף' || text === 'Add' || text === 'Добавить' || text === 'Adaugă') {
            btn.textContent = t('add');
        } else if (text === 'ביטול' || text === 'Cancel' || text === 'Отмена' || text === 'Anulează') {
            btn.textContent = t('cancel');
        } else if (text === 'שמור' || text === 'Save' || text === 'Сохранить' || text === 'Salvează') {
            btn.textContent = t('save');
        } else if (text === 'צור' || text === 'Create' || text === 'Создать' || text === 'Creează') {
            btn.textContent = t('create');
        } else if (text === 'מחק' || text === 'Delete' || text === 'Удалить' || text === 'Șterge') {
            btn.textContent = t('delete');
        } else if (text === 'השלם' || text === 'Complete' || text === 'Завершить' || text === 'Finalizează') {
            btn.textContent = t('complete');
        } else if (text === 'עדכן' || text === 'Update' || text === 'Обновить' || text === 'Actualizează') {
            btn.textContent = t('update');
        } else if (text === 'סגור' || text === 'Close' || text === 'Закрыть' || text === 'Închide') {
            btn.textContent = t('close');
        } else if (text === 'ייבא' || text === 'Import' || text === 'Импортировать' || text === 'Importă') {
            btn.textContent = t('importBtn');
        }
    });
}


// ========== Voice Input Functions ==========
let recognition = null;
let isRecording = false;

function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();

    // Map language codes to speech recognition locale codes
    const langMap = {
        'he': 'he-IL',
        'en': 'en-US',
        'ru': 'ru-RU',
        'ro': 'ro-RO'
    };

    recog.lang = langMap[currentLang] || 'he-IL';
    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    return recog;
}

function startVoiceInput() {
    if (!recognition) {
        recognition = initVoiceRecognition();
        if (!recognition) {
            showNotification(t('browserNotSupported'), 'error');
            return;
        }
    }

    if (isRecording) {
        stopVoiceInput();
        return;
    }

    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.classList.add('recording');
    isRecording = true;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        parseVoiceInput(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopVoiceInput();
        if (event.error === 'no-speech') {
            showNotification(t('noSpeechDetected'), 'warning');
        } else {
            showNotification(t('voiceError'), 'error');
        }
    };

    recognition.onend = () => {
        stopVoiceInput();
    };

    try {
        recognition.start();
        showNotification(t('listening'), 'success');
    } catch (error) {
        console.error('Error starting recognition:', error);
        stopVoiceInput();
        showNotification(t('micError'), 'error');
    }
}

function stopVoiceInput() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.classList.remove('recording');
    }
    isRecording = false;

    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            // Already stopped
        }
    }
}

function parseVoiceInput(text) {
    console.log('Voice input:', text);

    // Common separators in Hebrew
    const separators = [
        'ו', 'וגם', 'גם', ',', 'עוד', 'בנוסף', 'ועוד'
    ];

    // Build regex pattern
    const pattern = new RegExp(`\\s+(${separators.join('|')})\\s+`, 'gi');

    // Split by separators
    let items = text.split(pattern).filter(item => {
        const trimmed = item.trim();
        // Filter out the separators themselves and empty strings
        return trimmed && !separators.some(sep => sep.toLowerCase() === trimmed.toLowerCase());
    });

    // Clean up common phrases
    const phrasesToRemove = [
        'צריך לקנות', 'לקנות', 'קנה', 'תקנה', 'רוצה', 'צריך'
    ];

    items = items.map(item => {
        let cleaned = item.trim();
        phrasesToRemove.forEach(phrase => {
            const regex = new RegExp(`^${phrase}\\s+`, 'gi');
            cleaned = cleaned.replace(regex, '');
        });
        return cleaned.trim();
    }).filter(item => item.length > 0);

    if (items.length === 0) {
        showNotification('לא זוהו מוצרים, נסה שוב', 'warning');
        return;
    }

    // Smart behavior: single item fills the form, multiple items add directly
    if (items.length === 1) {
        // Fill the input field with the single item
        const itemName = items[0];
        const category = detectCategory(itemName);

        document.getElementById('itemName').value = itemName;
        if (category) {
            document.getElementById('itemCategory').value = category;
        }
        document.getElementById('itemPrice').focus();

        showNotification(`🎤 "${itemName}" - הוסף מחיר או לחץ הוסף`);
    } else {
        // Multiple items - add them all and close modal
        let addedCount = 0;
        items.forEach(itemName => {
            if (itemName) {
                const category = detectCategory(itemName);
                db.lists[db.currentId].items.push({
                    name: itemName,
                    price: 0,
                    qty: 1,
                    checked: false,
                    category: category
                });
                addedCount++;
            }
        });

        save();
        closeModal('inputForm');
        showNotification(`✅ נוספו ${addedCount} מוצרים: ${items.join(', ')}`);
    }
}


// ========== Translation Functions ==========
async function performTranslation() {
    const targetLang = document.getElementById('targetLanguage').value;
    const list = db.lists[db.currentId];

    if (!list || list.items.length === 0) {
        showNotification('אין מוצרים לתרגום', 'warning');
        return;
    }

    const progressDiv = document.getElementById('translationProgress');
    const statusDiv = document.getElementById('translationStatus');
    progressDiv.classList.remove('hidden');

    let translated = 0;
    const total = list.items.length;

    try {
        for (let i = 0; i < list.items.length; i++) {
            const item = list.items[i];
            statusDiv.textContent = `מתרגם ${i + 1} מתוך ${total}...`;

            const translatedName = await translateText(item.name, targetLang);
            if (translatedName) {
                list.items[i].name = translatedName;
                translated++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        save();
        closeModal('translateModal');
        progressDiv.classList.add('hidden');
        showNotification(`✅ תורגמו ${translated} מוצרים!`);
    } catch (error) {
        console.error('Translation error:', error);
        progressDiv.classList.add('hidden');
        showNotification('שגיאה בתרגום', 'error');
    }
}

async function translateText(text, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }
        return null;
    } catch (error) {
        console.error('Translation API error:', error);
        return null;
    }
}

// ========== Receipt Scanning Functions ==========
async function processReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('אנא בחר תמונה', 'warning');
        return;
    }

    // Show preview
    const preview = document.getElementById('scanPreview');
    const previewImg = document.getElementById('previewImg');
    const reader = new FileReader();

    reader.onload = function (e) {
        previewImg.src = e.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    // Show progress
    const progressDiv = document.getElementById('scanProgress');
    const progressBar = document.getElementById('scanProgressBar');
    const statusDiv = document.getElementById('scanStatus');
    const scanBtn = document.getElementById('scanBtn');

    progressDiv.classList.remove('hidden');
    scanBtn.disabled = true;
    scanBtn.classList.add('opacity-50');

    try {
        // Update progress to show we're starting
        progressBar.style.width = '30%';
        statusDiv.textContent = 'מעלה תמונה...';

        // Convert file to base64
        const base64Image = await new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const base64 = fileReader.result.split(',')[1];
                resolve(base64);
            };
            fileReader.onerror = reject;
            fileReader.readAsDataURL(file);
        });

        // Update progress
        progressBar.style.width = '60%';
        statusDiv.textContent = 'מזהה טקסט...';

        // Call Google Cloud Vision API
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{
                    image: {
                        content: base64Image
                    },
                    features: [{
                        type: 'TEXT_DETECTION'
                    }]
                }]
            })
        });

        // Check if response is OK
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Vision API HTTP Error:', response.status, errorText);

            let errorMessage = 'שגיאה בסריקת הקבלה';
            if (response.status === 403) {
                errorMessage = 'שגיאת הרשאה - ה-API Key לא תקין או אין הרשאות';
            } else if (response.status === 400) {
                errorMessage = 'שגיאה בפורמט הבקשה';
            } else if (response.status === 429) {
                errorMessage = 'חרגת ממכסת ה-API - נסה שוב מאוחר יותר';
            }

            throw new Error(`${errorMessage} (${response.status})`);
        }

        const result = await response.json();

        // Check for API errors in response
        if (result.responses && result.responses[0] && result.responses[0].error) {
            const apiError = result.responses[0].error;
            console.error('Google Vision API Error:', apiError);
            throw new Error(`שגיאת API: ${apiError.message || 'שגיאה לא ידועה'}`);
        }

        // Update progress
        progressBar.style.width = '90%';
        statusDiv.textContent = 'מעבד תוצאות...';

        // Extract text from response
        const text = result.responses[0]?.fullTextAnnotation?.text || '';

        console.log('OCR Result:', text);

        // Check if any text was detected
        if (!text || text.trim().length === 0) {
            showNotification('לא זוהה טקסט בתמונה - נסה תמונה ברורה יותר', 'warning');
            progressDiv.classList.add('hidden');
            scanBtn.disabled = false;
            scanBtn.classList.remove('opacity-50');
            return;
        }

        // Parse receipt
        const items = parseReceiptText(text);

        if (items.length === 0) {
            showNotification('לא נמצאו מוצרים בקבלה - נסה תמונה אחרת', 'warning');
            progressDiv.classList.add('hidden');
            scanBtn.disabled = false;
            scanBtn.classList.remove('opacity-50');
            return;
        }

        // Complete progress
        progressBar.style.width = '100%';
        statusDiv.textContent = 'הושלם!';

        // Create new list from receipt
        createListFromReceipt(items);

        closeModal('receiptScanModal');
        progressDiv.classList.add('hidden');
        preview.classList.add('hidden');
        fileInput.value = '';
        scanBtn.disabled = false;
        scanBtn.classList.remove('opacity-50');

        showNotification(`✅ נוצרה רשימה עם ${items.length} מוצרים!`);

    } catch (error) {
        console.error('OCR Error Details:', error);

        // Show detailed error message
        let errorMessage = 'שגיאה בסריקת הקבלה';
        if (error.message) {
            errorMessage = error.message;
        }

        showNotification(errorMessage, 'error');
        progressDiv.classList.add('hidden');
        scanBtn.disabled = false;
        scanBtn.classList.remove('opacity-50');
    }
}

function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];

    // Common patterns for receipt items
    // Pattern 1: "Item Name 12.50" or "Item Name ₪12.50"
    // Pattern 2: "Item Name" followed by price on next line

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 2) continue;

        // Skip common receipt headers/footers (Hebrew and English)
        if (line.match(/סה"כ|סהכ|total|sum|תאריך|date|קופה|קבלה|receipt|ח\.פ|חפ|vat|מע"מ|מעמ|ברקוד|barcode|תודה|thank|שעה|time|כתובת|address|טלפון|phone|אשראי|credit|מזומן|cash/i)) continue;

        // Pattern: Name followed by price (12.50 or ₪12.50 or ש"ח12.50)
        // Support both Hebrew (₪, ש"ח) and English formats
        const match1 = line.match(/^(.+?)\s+(₪|ש"ח|שח)?\s*([\d.,]+)\s*(₪|ש"ח|שח)?$/);
        if (match1) {
            const name = match1[1].trim();
            const priceStr = match1[3].replace(/,/g, '.').trim(); // Handle comma as decimal separator
            const price = parseFloat(priceStr);

            if (name.length > 2 && !name.match(/^[\d\s]+$/) && price > 0 && price < 1000) {
                items.push({
                    name: name,
                    price: price,
                    qty: 1,
                    checked: false,
                    category: detectCategory(name)
                });
            }
            continue;
        }

        // Pattern: Just a name, check next line for price
        if (i < lines.length - 1) {
            const nextLine = lines[i + 1].trim();
            // Support Hebrew (₪, ש"ח) and English price formats
            const priceMatch = nextLine.match(/^(₪|ש"ח|שח)?\s*([\d.,]+)\s*(₪|ש"ח|שח)?$/);
            if (priceMatch) {
                const priceStr = priceMatch[2].replace(/,/g, '.').trim();
                const price = parseFloat(priceStr);
                if (line.length > 2 && !line.match(/^[\d\s]+$/) && price > 0 && price < 1000) {
                    items.push({
                        name: line,
                        price: price,
                        qty: 1,
                        checked: false,
                        category: detectCategory(line)
                    });
                    i++; // Skip next line since we used it
                }
            }
        }
    }

    return items;
}

function createListFromReceipt(items) {
    const newId = 'L' + Date.now();
    const listName = 'קבלה - ' + new Date().toLocaleDateString('he-IL');

    db.lists[newId] = {
        name: listName,
        url: '',
        budget: 0,
        isTemplate: false,
        items: items
    };

    db.currentId = newId;
    activePage = 'lists';
    save();
}

function toggleBottomBar() {
    const bottomBar = document.querySelector('.bottom-bar');
    const toggleBtn = document.getElementById('floatingToggle');

    if (bottomBar.classList.contains('minimized')) {
        bottomBar.classList.remove('minimized');
        toggleBtn.classList.remove('bar-hidden');
    } else {
        bottomBar.classList.add('minimized');
        toggleBtn.classList.add('bar-hidden');
    }
}

function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('active');

    if (id === 'inputForm') {
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemCategory').value = '';

        // Setup autocomplete
        const itemNameInput = document.getElementById('itemName');
        itemNameInput.oninput = function () {
            showAutocompleteSuggestions(this.value);
        };
        itemNameInput.onblur = function () {
            hideAutocompleteSuggestions();
        };

        setTimeout(() => itemNameInput.focus(), 150);
    }

    if (id === 'newListModal') {
        document.getElementById('newListNameInput').value = '';
        document.getElementById('newListUrlInput').value = '';
        document.getElementById('newListBudget').value = '';
        document.getElementById('newListTemplate').checked = false;
        setTimeout(() => document.getElementById('newListNameInput').focus(), 150);
    }

    if (id === 'editListNameModal') {
        const list = db.lists[db.currentId];
        document.getElementById('editListNameInput').value = list.name;
        document.getElementById('editListUrlInput').value = list.url || '';
        document.getElementById('editListBudget').value = list.budget || '';
        setTimeout(() => document.getElementById('editListNameInput').focus(), 150);
    }

    if (id === 'editTotalModal') {
        setTimeout(() => document.getElementById('editTotalInput').focus(), 150);
    }

    if (id === 'importModal') {
        document.getElementById('importText').value = '';
        setTimeout(() => document.getElementById('importText').focus(), 150);
    }

    if (id === 'historyModal') {
        renderHistory();
    }

    if (id === 'templatesModal') {
        renderTemplates();
    }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.background = type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#ef4444';
    notif.style.color = 'white';
    notif.innerHTML = `<strong>${message}</strong>`;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ========== Autocomplete Functions ==========
function getProductHistory() {
    const productMap = {};

    // Extract products from history
    if (db.history && db.history.length > 0) {
        db.history.forEach(entry => {
            entry.items.forEach(item => {
                const name = item.name.trim();
                // Keep the most recent price for each product
                if (!productMap[name] || productMap[name].lastUsed < entry.completedAt) {
                    productMap[name] = {
                        price: item.price,
                        category: item.category || '',
                        lastUsed: entry.completedAt
                    };
                }
            });
        });
    }

    return productMap;
}

function showAutocompleteSuggestions(searchTerm) {
    const container = document.getElementById('autocompleteContainer');
    if (!container) return;

    if (!searchTerm || searchTerm.length < 2) {
        container.classList.remove('active');
        container.innerHTML = '';
        return;
    }

    const productHistory = getProductHistory();
    const searchLower = searchTerm.toLowerCase();

    // Filter products that match the search term
    const matches = Object.entries(productHistory)
        .filter(([name]) => name.toLowerCase().includes(searchLower))
        .sort((a, b) => b[1].lastUsed - a[1].lastUsed) // Sort by most recent
        .slice(0, 5); // Limit to 5 suggestions

    if (matches.length === 0) {
        container.classList.remove('active');
        container.innerHTML = '';
        return;
    }

    // Build HTML for suggestions
    container.innerHTML = matches.map(([name, data]) => `
        <div class="autocomplete-item" onclick="selectAutocompleteSuggestion('${name.replace(/'/g, "\\'")}', ${data.price}, '${data.category.replace(/'/g, "\\'")}')">
            <div>
                <div class="autocomplete-item-name">${name}</div>
                ${data.category ? `<div class="autocomplete-item-category">${data.category}</div>` : ''}
            </div>
            <div class="autocomplete-item-price">₪${data.price.toFixed(2)}</div>
        </div>
    `).join('');

    container.classList.add('active');
}

function selectAutocompleteSuggestion(name, price, category) {
    document.getElementById('itemName').value = name;
    document.getElementById('itemPrice').value = price;

    // Use provided category or auto-detect
    const finalCategory = category || detectCategory(name);
    if (finalCategory) {
        document.getElementById('itemCategory').value = finalCategory;
    }

    // Hide autocomplete
    const container = document.getElementById('autocompleteContainer');
    if (container) {
        container.classList.remove('active');
        container.innerHTML = '';
    }

    // Focus on price field for easy editing
    setTimeout(() => document.getElementById('itemPrice').focus(), 100);
}

function hideAutocompleteSuggestions() {
    const container = document.getElementById('autocompleteContainer');
    if (container) {
        setTimeout(() => {
            container.classList.remove('active');
            container.innerHTML = '';
        }, 200);
    }
}

// ========== Search Functions ==========
function searchInList() {
    const searchTerm = document.getElementById('listSearchInput').value.toLowerCase().trim();
    const list = db.lists[db.currentId];

    if (!searchTerm) {
        highlightedItemIndex = null;
        render();
        return;
    }

    const matches = list.items.map((item, idx) => ({
        item,
        idx,
        matches: item.name.toLowerCase().includes(searchTerm)
    })).filter(m => m.matches);

    if (matches.length === 0) {
        showNotification('לא נמצא מוצר', 'warning');
        return;
    }

    // Show first match highlighted
    const firstMatch = matches[0];
    highlightedItemIndex = firstMatch.idx;
    render();

    // Scroll to highlighted item
    setTimeout(() => {
        const itemCard = document.querySelector(`[data-id="${firstMatch.idx}"]`);
        if (itemCard) {
            itemCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function clearListSearch() {
    document.getElementById('listSearchInput').value = '';
    highlightedItemIndex = null;
    render();
}

// Search in summary (lists)
function searchInSummary() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    if (!searchTerm) {
        highlightedListId = null;
        render();
        return;
    }

    const matches = Object.keys(db.lists).filter(id => {
        const l = db.lists[id];
        return l.name.toLowerCase().includes(searchTerm) ||
            (l.url && l.url.toLowerCase().includes(searchTerm)) ||
            l.items.some(i => i.name.toLowerCase().includes(searchTerm));
    });

    if (matches.length > 0) {
        highlightedListId = matches[0];
        render();

        setTimeout(() => {
            const listCard = document.querySelector(`[data-id="${matches[0]}"]`);
            if (listCard) {
                listCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    } else {
        highlightedListId = null;
        render();
    }
}

function render() {
    const container = document.getElementById(activePage === 'lists' ? 'itemsContainer' : activePage === 'summary' ? 'summaryContainer' : null);
    let total = 0, paid = 0;

    document.getElementById('tabLists').className = `tab-btn ${activePage === 'lists' ? 'tab-active' : ''}`;
    document.getElementById('tabSummary').className = `tab-btn ${activePage === 'summary' ? 'tab-active' : ''}`;
    document.getElementById('tabStats').className = `tab-btn ${activePage === 'stats' ? 'tab-active' : ''}`;

    const btn = document.getElementById('mainLockBtn');
    const path = document.getElementById('lockIconPath');
    const tag = document.getElementById('statusTag');
    if (btn && path && tag) {
        btn.className = `bottom-circle-btn ${isLocked ? 'bg-blue-600' : 'bg-orange-400'}`;
        path.setAttribute('d', isLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z');
        tag.innerText = isLocked ? t('locked') : t('unlocked');
    }

    if (activePage === 'lists') {
        document.getElementById('pageLists').classList.remove('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.add('hidden');

        const list = db.lists[db.currentId] || { name: 'רשימה', items: [] };
        document.getElementById('listNameDisplay').innerText = list.name;
        document.getElementById('itemCountDisplay').innerText = `${list.items.length} ${t('items')}`;


        if (container) {
            container.innerHTML = '';

            // Update category sort button text
            const categorySortText = document.getElementById('categorySortText');
            if (categorySortText) {
                categorySortText.textContent = categorySortEnabled ? '📋 מיון ידני' : '🔤 מיון לפי קטגוריות';
            }

            if (categorySortEnabled) {
                // Category sorting mode
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
                    'אחר',
                    'כללי'
                ];

                // Group items by category
                const categorizedItems = {};
                list.items.forEach((item, idx) => {
                    const category = item.category || 'כללי';
                    if (!categorizedItems[category]) {
                        categorizedItems[category] = [];
                    }
                    categorizedItems[category].push({ item, idx });
                });

                // Render by category
                let itemNumber = 1;
                categoryOrder.forEach(category => {
                    if (categorizedItems[category] && categorizedItems[category].length > 0) {
                        // Render category header
                        const categoryHeader = document.createElement('div');
                        categoryHeader.className = 'category-separator';
                        categoryHeader.style.background = `linear-gradient(135deg, ${CATEGORIES[category] || '#6b7280'} 0%, ${CATEGORIES[category] || '#6b7280'}dd 100%)`;
                        categoryHeader.innerHTML = `
                            <div class="text-lg font-black">${category} (${categorizedItems[category].length})</div>
                        `;
                        container.appendChild(categoryHeader);

                        // Render items in this category
                        categorizedItems[category].forEach(({ item, idx }) => {
                            const sub = item.price * item.qty;
                            total += sub;
                            if (item.checked) paid += sub;

                            const categoryBadge = item.category ? `<span class="category-badge" style="background: ${CATEGORIES[item.category] || '#6b7280'}20; color: ${CATEGORIES[item.category] || '#6b7280'}">${item.category}</span>` : '';

                            const isHighlighted = highlightedItemIndex === idx;
                            const div = document.createElement('div');
                            div.className = "item-card";
                            div.setAttribute('data-id', idx);
                            if (isHighlighted) {
                                div.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                                div.style.border = '3px solid #f59e0b';
                                div.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
                            }
                            div.innerHTML = `
                                <div class="flex justify-between items-center mb-4">
                                    <div class="flex items-center gap-3 flex-1">
                                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                                        <div class="flex-1">
                                            <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                                                <span class="item-number">${itemNumber}.</span> ${item.name}
                                            </div>
                                            ${categoryBadge}
                                        </div>
                                    </div>
                                    <button onclick="removeItem(${idx})" class="trash-btn">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                                        <span class="font-bold w-6 text-center">${item.qty}</span>
                                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                                    </div>
                                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                                </div>
                            `;
                            container.appendChild(div);
                            itemNumber++;
                        });
                    }
                });
            } else {
                // Manual sorting mode (original behavior)
                list.items.forEach((item, idx) => {
                    const sub = item.price * item.qty;
                    total += sub;
                    if (item.checked) paid += sub;

                    const categoryBadge = item.category ? `<span class="category-badge" style="background: ${CATEGORIES[item.category] || '#6b7280'}20; color: ${CATEGORIES[item.category] || '#6b7280'}">${item.category}</span>` : '';

                    const isHighlighted = highlightedItemIndex === idx;
                    const div = document.createElement('div');
                    div.className = "item-card";
                    div.setAttribute('data-id', idx);
                    if (isHighlighted) {
                        div.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                        div.style.border = '3px solid #f59e0b';
                        div.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
                    }
                    div.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <div class="flex items-center gap-3 flex-1">
                                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${idx})" class="w-7 h-7 accent-indigo-600">
                                <div class="flex-1">
                                    <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}">
                                        <span class="item-number">${idx + 1}.</span> ${item.name}
                                    </div>
                                    ${categoryBadge}
                                </div>
                            </div>
                            <button onclick="removeItem(${idx})" class="trash-btn">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                                <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                                <span class="font-bold w-6 text-center">${item.qty}</span>
                                <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                            </div>
                            <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600">₪${sub.toFixed(2)}</span>
                        </div>
                    `;
                    container.appendChild(div);
                });
            }


            // Add scroll listener to remove highlight
            if (highlightedItemIndex !== null) {
                const removeHighlight = () => {
                    highlightedItemIndex = null;
                    container.removeEventListener('scroll', removeHighlight);
                    window.removeEventListener('scroll', removeHighlight);
                    render();
                };
                container.addEventListener('scroll', removeHighlight, { once: true });
                window.addEventListener('scroll', removeHighlight, { once: true });
            }
        }

        const budgetWarning = document.getElementById('budgetWarning');
        if (budgetWarning && list.budget > 0 && total > list.budget) {
            const overBudget = total - list.budget;
            budgetWarning.innerHTML = `⚠️ חריגה מתקציב: ₪${overBudget.toFixed(2)}`;
            budgetWarning.classList.remove('hidden');
        } else if (budgetWarning) {
            budgetWarning.classList.add('hidden');
        }

    } else if (activePage === 'summary') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.remove('hidden');
        document.getElementById('pageStats').classList.add('hidden');

        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        if (container) {
            container.innerHTML = '';
            Object.keys(db.lists).forEach(id => {
                const l = db.lists[id];

                const matchesName = l.name.toLowerCase().includes(searchTerm);
                const matchesURL = l.url && l.url.toLowerCase().includes(searchTerm);
                const matchesItems = l.items.some(i => i.name.toLowerCase().includes(searchTerm));

                if (searchTerm && !matchesName && !matchesURL && !matchesItems) return;

                let lT = 0, lP = 0;
                l.items.forEach(i => {
                    const s = i.price * i.qty;
                    lT += s;
                    if (i.checked) lP += s;
                });
                const isSel = db.selectedInSummary.includes(id);
                if (isSel) {
                    total += lT;
                    paid += lP;
                }

                const templateBadge = l.isTemplate ? '<span class="template-badge">תבנית</span>' : '';
                const isHighlighted = highlightedListId === id;
                const div = document.createElement('div');
                div.className = "item-card";
                div.dataset.id = id;
                div.style.background = isHighlighted ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' : '';
                div.style.border = isHighlighted ? '3px solid #0ea5e9' : '';
                div.style.boxShadow = isHighlighted ? '0 8px 20px rgba(14, 165, 233, 0.3)' : '';

                const webBtn = l.url ? `
                    <button onclick="window.location.href='${l.url.startsWith('http') ? l.url : 'https://' + l.url}'" class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm ml-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                        </svg>
                    </button>
                ` : '';

                div.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-3 flex-1">
                            <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSum('${id}')" class="w-7 h-7 accent-indigo-600">
                            <div class="flex-1 text-2xl font-bold cursor-pointer" onclick="db.currentId='${id}'; showPage('lists')">
                                ${templateBadge}${l.name}
                            </div>
                        </div>
                        <div class="flex items-center">
                            ${webBtn}
                            <button onclick="prepareDeleteList('${id}')" class="trash-btn">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">${l.items.length} ${t('items')}</div>
                        <span class="text-2xl font-black text-indigo-600">₪${lT.toFixed(2)}</span>
                    </div>
                `;
                container.appendChild(div);
            });

            // Add scroll listener to remove highlight for lists
            if (highlightedListId !== null) {
                const removeHighlight = () => {
                    highlightedListId = null;
                    container.removeEventListener('scroll', removeHighlight);
                    window.removeEventListener('scroll', removeHighlight);
                    render();
                };
                container.addEventListener('scroll', removeHighlight, { once: true });
                window.addEventListener('scroll', removeHighlight, { once: true });
            }
        }
    } else if (activePage === 'stats') {
        document.getElementById('pageLists').classList.add('hidden');
        document.getElementById('pageSummary').classList.add('hidden');
        document.getElementById('pageStats').classList.remove('hidden');
        renderStats();
    }

    document.getElementById('displayTotal').innerText = total.toFixed(2);
    document.getElementById('displayPaid').innerText = paid.toFixed(2);
    document.getElementById('displayLeft').innerText = (total - paid).toFixed(2);
    initSortable();
}

// ========== Stats Functions ==========
function renderStats() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (!db.stats.monthlyData[monthKey]) {
        db.stats.monthlyData[monthKey] = 0;
    }

    const monthlyTotal = db.stats.monthlyData[monthKey] || 0;
    document.getElementById('monthlyTotal').innerText = `₪${monthlyTotal.toFixed(2)}`;
    document.getElementById('completedLists').innerText = db.stats.listsCompleted || 0;

    const avgPerList = db.stats.listsCompleted > 0 ? db.stats.totalSpent / db.stats.listsCompleted : 0;
    document.getElementById('avgPerList').innerText = `₪${avgPerList.toFixed(0)}`;

    const monthlyProgress = Math.min((monthlyTotal / 5000) * 100, 100);
    document.getElementById('monthlyProgress').style.width = `${monthlyProgress}%`;

    renderMonthlyChart();
    renderPopularItems();
}

function showCompletedListsModal() {
    if (db.history.length === 0) {
        showNotification('אין רשימות שהושלמו', 'warning');
        return;
    }
    openModal('completedListsModal');
    renderCompletedLists();
}

function renderCompletedLists() {
    const container = document.getElementById('completedListsContent');
    if (!container) return;

    container.innerHTML = '';

    if (db.history.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין רשימות שהושלמו</p>';
        return;
    }

    db.history.slice().reverse().forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-4 bg-green-50 rounded-xl border border-green-200';
        const date = new Date(entry.completedAt);

        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-green-800">✅ ${entry.name}</span>
                <span class="text-xs text-green-600">${date.toLocaleDateString('he-IL')}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-green-700">${entry.items.length} מוצרים</span>
                <span class="text-green-600 font-black text-lg">₪${entry.total.toFixed(2)}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    const monthlyData = db.stats.monthlyData || {};
    const sortedKeys = Object.keys(monthlyData).sort();
    const last6Months = sortedKeys.slice(-6);

    const labels = last6Months.map(key => {
        const [year, month] = key.split('-');
        return `${month}/${year.slice(2)}`;
    });

    const data = last6Months.map(key => monthlyData[key] || 0);

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'הוצאות חודשיות',
                data: data,
                borderColor: '#7367f0',
                backgroundColor: 'rgba(115, 103, 240, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₪' + value;
                        }
                    }
                }
            }
        }
    });
}

function renderPopularItems() {
    const itemCounts = {};

    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            if (!itemCounts[item.name]) {
                itemCounts[item.name] = 0;
            }
            itemCounts[item.name]++;
        });
    });

    const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const container = document.getElementById('popularItems');
    if (!container) return;

    container.innerHTML = '';
    sorted.forEach(([name, count]) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center mb-3 p-3 bg-gray-50 rounded-xl';
        div.innerHTML = `
            <span class="font-bold">${name}</span>
            <span class="text-indigo-600 font-black">${count}×</span>
        `;
        container.appendChild(div);
    });

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">אין מספיק נתונים</p>';
    }
}

function renderHistory() {
    const container = document.getElementById('historyContent');
    if (!container) return;

    container.innerHTML = '';

    if (db.history.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין רשימות בהיסטוריה</p>';
        return;
    }

    db.history.slice().reverse().forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200';
        const date = new Date(entry.completedAt);

        // Product list
        let productsList = '<div class="mt-3 mb-3 space-y-1">';
        entry.items.forEach((item, i) => {
            const itemTotal = (item.price * item.qty).toFixed(2);
            productsList += `
                <div class="flex justify-between items-center text-sm py-1 border-b border-gray-200">
                    <span class="text-gray-700">${i + 1}. ${item.name} ${item.category ? '(' + item.category + ')' : ''}</span>
                    <div class="flex gap-2 items-center">
                        <span class="text-gray-500">x${item.qty}</span>
                        <span class="text-indigo-600 font-bold">₪${itemTotal}</span>
                    </div>
                </div>
            `;
        });
        productsList += '</div>';

        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-lg">${entry.name}</span>
                <span class="text-xs text-gray-500">${date.toLocaleDateString('he-IL')}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">${entry.items.length} מוצרים</span>
                <span class="text-indigo-600 font-black text-xl">₪${entry.total.toFixed(2)}</span>
            </div>
            ${productsList}
            <button onclick="restoreFromHistory(${db.history.length - 1 - idx})" class="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
                📋 שחזר רשימה זו
            </button>
        `;
        container.appendChild(div);
    });
}

function renderTemplates() {
    const container = document.getElementById('templatesContent');
    if (!container) return;

    container.innerHTML = '';

    const templates = Object.entries(db.lists).filter(([_, list]) => list.isTemplate);

    if (templates.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין תבניות שמורות</p>';
        return;
    }

    templates.forEach(([id, template]) => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200';
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-yellow-800">⭐ ${template.name}</span>
            </div>
            <div class="text-sm text-yellow-700 mb-3">${template.items.length} מוצרים</div>
            <button onclick="createFromTemplate('${id}')" class="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-bold">
                צור רשימה מתבנית
            </button>
        `;
        container.appendChild(div);
    });
}

function createFromTemplate(templateId) {
    const template = db.lists[templateId];
    if (!template) return;

    const newId = 'L' + Date.now();
    db.lists[newId] = {
        name: template.name + ' - ' + new Date().toLocaleDateString('he-IL'),
        url: template.url,
        budget: template.budget,
        isTemplate: false,
        items: JSON.parse(JSON.stringify(template.items.map(item => ({ ...item, checked: false }))))
    };

    db.currentId = newId;
    activePage = 'lists';
    closeModal('templatesModal');
    save();
    showNotification('✅ רשימה נוצרה מתבנית!');
}

function restoreFromHistory(idx) {
    const entry = db.history[idx];
    if (!entry) return;

    const newId = 'L' + Date.now();
    db.lists[newId] = {
        name: entry.name + ' (משוחזר)',
        url: entry.url || '',
        budget: 0,
        isTemplate: false,
        items: JSON.parse(JSON.stringify(entry.items.map(item => ({ ...item, checked: false }))))
    };

    db.currentId = newId;
    activePage = 'lists';
    closeModal('historyModal');
    save();
    showNotification('✅ רשימה שוחזרה!');
}

// תיקון פונקציית סיום רשימה
function completeList() {
    const list = db.lists[db.currentId];
    if (!list || list.items.length === 0) {
        showNotification('הרשימה ריקה!', 'warning');
        closeModal('confirmModal');
        return;
    }

    const total = list.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // שמירה להיסטוריה
    db.history.push({
        name: list.name,
        url: list.url,
        items: JSON.parse(JSON.stringify(list.items)),
        total: total,
        completedAt: Date.now()
    });

    // עדכון סטטיסטיקות
    db.stats.totalSpent += total;
    db.stats.listsCompleted++;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!db.stats.monthlyData[monthKey]) {
        db.stats.monthlyData[monthKey] = 0;
    }
    db.stats.monthlyData[monthKey] += total;

    // ניקוי הרשימה הנוכחית
    list.items = [];

    closeModal('confirmModal');

    // מעבר לדף סטטיסטיקות כדי לראות את השינוי
    activePage = 'stats';

    save();
    showNotification('✅ הרשימה הושלמה ונשמרה בהיסטוריה!');
}

function toggleTemplateMode() {
    const list = db.lists[db.currentId];
    list.isTemplate = !list.isTemplate;
    save();
    showNotification(list.isTemplate ? '⭐ נשמר כתבנית' : '✅ הוסר מתבניות');
}

// ========== Item Management ==========
async function shareNative(type) {
    let title = "";
    let text = "";

    if (type === 'list') {
        const list = db.lists[db.currentId];
        if (list.items.length === 0) return;
        title = `Vplus - ${list.name}`;
        text = `🛒 *${list.name}:*\n\n`;
        list.items.forEach((i, idx) => {
            const catEmoji = i.category ? i.category.split(' ')[0] : '';
            text += `${idx + 1}. ${i.checked ? '✅' : '⬜'} *${i.name}* ${catEmoji} (x${i.qty}) - ₪${(i.price * i.qty).toFixed(2)}\n`;
        });
        text += `\n💰 *סה"כ: ₪${document.getElementById('displayTotal').innerText}*`;
    } else {
        const selectedIds = db.selectedInSummary;
        if (selectedIds.length === 0) {
            alert("בחר לפחות רשימה אחת לשיתוף!");
            return;
        }
        title = "Vplus - ריכוז רשימות";
        text = `📦 *ריכוז רשימות קנייה (חסרים בלבד):*\n\n`;
        selectedIds.forEach(id => {
            const l = db.lists[id];
            const missing = l.items.filter(i => !i.checked);
            if (missing.length > 0) {
                text += `🔹 *${l.name}:*\n`;
                missing.forEach(i => text += `  - ${i.name} (x${i.qty})\n`);
                text += `\n`;
            }
        });
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text
            });
        } catch (err) {
            console.log("Sharing failed", err);
        }
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('📋 הטקסט הועתק ללוח!');
        });
    }
}

function addItem() {
    const n = document.getElementById('itemName').value.trim();
    const p = parseFloat(document.getElementById('itemPrice').value) || 0;
    const c = document.getElementById('itemCategory').value;

    if (n) {
        // Auto-detect category if not manually selected
        const finalCategory = c || detectCategory(n);

        db.lists[db.currentId].items.push({
            name: n,
            price: p,
            qty: 1,
            checked: false,
            category: finalCategory
        });
        closeModal('inputForm');
        save();
        showNotification('✅ מוצר נוסף!');
    }
}

function changeQty(idx, d) {
    if (db.lists[db.currentId].items[idx].qty + d >= 1) {
        db.lists[db.currentId].items[idx].qty += d;
        save();
    }
}

function removeItem(idx) {
    db.lists[db.currentId].items.splice(idx, 1);
    save();
    showNotification('🗑️ מוצר הוסר');
}

function toggleLock() {
    isLocked = !isLocked;
    render();
}

function saveNewList() {
    const n = document.getElementById('newListNameInput').value.trim();
    const u = document.getElementById('newListUrlInput').value.trim();
    const b = parseFloat(document.getElementById('newListBudget').value) || 0;
    const t = document.getElementById('newListTemplate').checked;
    if (n) {
        const id = 'L' + Date.now();
        db.lists[id] = {
            name: n,
            url: u,
            budget: b,
            isTemplate: t,
            items: []
        };
        db.currentId = id;
        activePage = 'lists';
        closeModal('newListModal');
        save();
        showNotification(t ? '⭐ תבנית נוצרה!' : '✅ רשימה נוצרה!');
    }
}

function deleteFullList() {
    if (listToDelete) {
        delete db.lists[listToDelete];
        const keys = Object.keys(db.lists);
        if (db.currentId === listToDelete) {
            db.currentId = keys[0] || (db.lists['L1'] = { name: 'הרשימה שלי', url: '', budget: 0, isTemplate: false, items: [] }, 'L1');
        }
        closeModal('deleteListModal');
        save();
        showNotification('🗑️ רשימה נמחקה');
    }
}

function prepareDeleteList(id) {
    listToDelete = id;
    openModal('deleteListModal');
}

function importFromText() {
    const text = document.getElementById('importText').value.trim();
    if (!text) {
        alert('אנא הדבק טקסט לייבוא');
        return;
    }

    const lines = text.split('\n').filter(line => line.trim());
    let listName = 'רשימה מיובאת';
    let startIndex = 0;

    const firstLine = lines[0];
    if (firstLine.includes('*') && firstLine.includes(':')) {
        const match = firstLine.match(/\*([^*]+)\*/);
        if (match) {
            listName = match[1].trim();
            startIndex = 1;
        }
    }

    let finalName = listName;
    let counter = 1;
    const existingNames = Object.values(db.lists).map(l => l.name);
    while (existingNames.includes(finalName)) {
        counter++;
        finalName = `${listName} ${counter}`;
    }

    const newListId = 'L' + Date.now();
    const items = [];

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.includes('🛒') || line.includes('💰') || line.includes('סה"כ') || line === '---') continue;

        let itemAdded = false;
        const fullMatch = line.match(/[⬜✅]\s*\*([^*]+)\*\s*\(x(\d+)\)\s*-\s*₪([\d.]+)/);
        if (fullMatch) {
            const name = fullMatch[1].trim();
            const qty = parseInt(fullMatch[2]);
            const totalPrice = parseFloat(fullMatch[3]);
            const price = totalPrice / qty;
            const checked = line.includes('✅');
            items.push({ name, price, qty, checked, category: detectCategory(name) });
            itemAdded = true;
        }
        if (!itemAdded) {
            const bulletQtyMatch = line.match(/^[•\-]\s*\*?([^(]+)\*?\s*\(x(\d+)\)/);
            if (bulletQtyMatch) {
                const name = bulletQtyMatch[1].trim().replace(/\*/g, '');
                const qty = parseInt(bulletQtyMatch[2]);
                if (name) {
                    items.push({ name, price: 0, qty, checked: false, category: detectCategory(name) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded) {
            const bulletMatch = line.match(/^[•\-]\s*\*?(.+?)\*?$/);
            if (bulletMatch) {
                const name = bulletMatch[1].trim().replace(/\*/g, '');
                if (name) {
                    items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded) {
            const starMatch = line.match(/^\*([^*]+)\*$/);
            if (starMatch) {
                const name = starMatch[1].trim();
                if (name) {
                    items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded && line.length > 0) {
            const name = line.replace(/^[\d\.\)\-\s]+/, '').trim();
            if (name && !/^\d+$/.test(name)) {
                items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name) });
            }
        }
    }

    if (items.length === 0) {
        alert('לא נמצאו מוצרים בטקסט');
        return;
    }

    db.lists[newListId] = { name: finalName, url: '', budget: 0, isTemplate: false, items };
    db.currentId = newListId;
    activePage = 'lists';
    closeModal('importModal');
    save();
    showNotification(`✅ יובאו ${items.length} מוצרים!`);
}

function initSortable() {
    const el = document.getElementById(activePage === 'lists' ? 'itemsContainer' : 'summaryContainer');
    if (sortableInstance) sortableInstance.destroy();
    if (el && !isLocked) {
        sortableInstance = Sortable.create(el, {
            animation: 150,
            onEnd: function () {
                if (activePage === 'lists') {
                    const newOrder = Array.from(el.children).map(c => parseInt(c.getAttribute('data-id')));
                    const items = db.lists[db.currentId].items;
                    db.lists[db.currentId].items = newOrder.map(oldIdx => items[oldIdx]);
                } else {
                    const newOrder = Array.from(el.children).map(c => c.getAttribute('data-id'));
                    const newLists = {};
                    newOrder.forEach(id => newLists[id] = db.lists[id]);
                    db.lists = newLists;
                }
                save();
            }
        });
    }
}

function preparePrint() {
    closeModal('settingsModal');
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    let grandTotal = 0;
    let htmlContent = `<h1 style="text-align:center; color:#7367f0;">דוח קניות מפורט - Vplus Pro</h1>`;
    const idsToPrint = db.selectedInSummary.length > 0 ? db.selectedInSummary : Object.keys(db.lists);

    idsToPrint.forEach(id => {
        const l = db.lists[id];
        let listTotal = 0;
        htmlContent += `
            <div style="border-bottom: 2px solid #7367f0; margin-bottom: 20px; padding-bottom: 10px;">
                <h2>${l.name}</h2>
                <table style="width:100%; border-collapse:collapse; border:1px solid #ddd; margin-bottom:10px;">
                    <thead>
                        <tr style="background:#f9fafb;">
                            <th style="padding:8px; border:1px solid #ddd; text-align:right;">מוצר</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:center;">קטגוריה</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:center;">כמות</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">סה"כ</th>
                        </tr>
                    </thead>
                    <tbody>`;
        l.items.forEach(i => {
            const s = i.price * i.qty;
            listTotal += s;
            htmlContent += `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">${i.name}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">${i.category || '-'}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">${i.qty}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:left;">₪${s.toFixed(2)}</td>
                </tr>`;
        });
        htmlContent += `</tbody></table><div style="text-align:left; font-weight:bold;">סיכום רשימה: ₪${listTotal.toFixed(2)}</div></div>`;
        grandTotal += listTotal;
    });
    htmlContent += `<div style="text-align:center; margin-top:30px; padding:15px; border:3px double #7367f0; font-size:1.5em; font-weight:900;">סה"כ כולל: ₪${grandTotal.toFixed(2)}</div>`;
    printArea.innerHTML = htmlContent;
    window.print();
}

function saveListName() {
    const n = document.getElementById('editListNameInput').value.trim();
    const u = document.getElementById('editListUrlInput').value.trim();
    const b = parseFloat(document.getElementById('editListBudget').value) || 0;
    if (n) {
        db.lists[db.currentId].name = n;
        db.lists[db.currentId].url = u;
        db.lists[db.currentId].budget = b;
        save();
    }
    closeModal('editListNameModal');
}

function openEditTotalModal(idx) {
    currentEditIdx = idx;
    document.getElementById('editTotalInput').value = '';
    openModal('editTotalModal');
}

function saveTotal() {
    const val = parseFloat(document.getElementById('editTotalInput').value);
    if (!isNaN(val)) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.price = val / item.qty;
        save();
    }
    closeModal('editTotalModal');
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
function showDetailedError(context, error) {
    const errorCode = error.code || 'UNKNOWN';
    const errorMessage = error.message || 'Unknown error';
    
    console.error(`❌ [${context}] שגיאה מפורטת:`, {
        code: errorCode,
        message: errorMessage,
        fullError: error
    });
    
    showNotification(
        `❌ שגיאה ב${context}: ${errorCode}
${errorMessage}`,
        'error'
    );
}

// Check for firebase availability immediately and poll
const checkFirebase = setInterval(async () => {
    if (window.firebaseAuth) {
        clearInterval(checkFirebase);
        initFirebaseAuth();

        try {
            console.log('🔍 בודק תוצאת redirect...');
            const result = await window.getRedirectResult(window.firebaseAuth);
            if (result && result.user) {
                console.log('✅ התחברות הושלמה:', result.user.email);
                showNotification('👋 ברוך הבא ' + (result.user.displayName || result.user.email));
            }
        } catch (error) {
            console.error("❌ שגיאה בהתחברות:", error);
            showDetailedError('Auth Redirect', error);
        }
    }
}, 100);

// Timeout check to warn user if firebase doesn't load
setTimeout(() => {
    if (!window.firebaseAuth) {
        console.warn("⚠️ Firebase לא נטען אחרי 10 שניות");
        showNotification('⚠️ שירות הענן לא זמין', 'warning');
    }
}, 10000);

function initFirebaseAuth() {
    console.log('🔄 מאתחל Firebase Auth...');
    
    window.onAuthStateChanged(window.firebaseAuth, (user) => {
        currentUser = user;
        isConnected = !!user;

        console.log('👤 מצב משתמש:', user ? `מחובר: ${user.email} (UID: ${user.uid})` : 'מנותק');
        
        updateCloudIndicator(user ? 'connected' : 'disconnected');

        const emailDisplay = document.getElementById('userEmailDisplay');
        const logoutBtn = document.getElementById('logoutBtn');
        
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

    // Override cloud button click
    const cloudBtn = document.getElementById('cloudBtn');
    if (cloudBtn) {
        cloudBtn.onclick = function() {
            if (currentUser) {
                // Already logged in, show settings
                openModal('settingsModal');
            } else {
                // Not logged in, trigger login
                loginWithGoogle();
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

    // Login Loop Fix: Check if already logged in first
    if (window.firebaseAuth.currentUser) {
        showNotification('✅ אתה כבר מחובר');
        console.log('ℹ️ משתמש כבר מחובר:', window.firebaseAuth.currentUser.email);
        return;
    }

    console.log('🔐 מתחיל תהליך התחברות Google...');
    
    try {
        window.signInWithRedirect(window.firebaseAuth, window.googleProvider);
    } catch (error) {
        console.error("❌ שגיאת התחברות:", error);
        showDetailedError('Login', error);
    }
}

function logoutFromCloud() {
    if (!window.firebaseAuth) {
        showNotification('⚠️ שירות הענן לא זמין', 'warning');
        console.warn('⚠️ Firebase Auth לא זמין להתנתקות');
        return;
    }
    
    console.log('🚪 מתנתק מהענן...');
    
    window.signOut(window.firebaseAuth).then(() => {
        currentUser = null;
        isConnected = false;
        console.log('✅ התנתקות הושלמה');
        showNotification('👋 התנתקת מהענן');
        updateCloudIndicator('disconnected');
        closeModal('settingsModal');
    }).catch((error) => {
        console.error("❌ שגיאת התנתקות:", error);
        showDetailedError('Logout', error);
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
        // Green indicator
        indicator.className = 'w-2 h-2 bg-green-500 rounded-full';
        
        // Update button style to green
        cloudBtn.className = 'cloud-btn-connected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        
        // Show email if available
        if (currentUser && currentUser.email) {
            if (text) text.textContent = currentUser.email;
        } else {
            if (text) text.textContent = "מחובר ✅";
        }
    } else if (status === 'syncing') {
        indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
        cloudBtn.className = 'cloud-btn-disconnected px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all';
        if (text) text.textContent = "מסנכרן...";
    } else {
        // Disconnected state
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

            // Sync instantly
            // Avoid loop: if the data is same as local, don't re-render
            if (JSON.stringify(cloudData) !== JSON.stringify(db)) {
                console.log('🔄 מסנכרן נתונים מהענן...');
                db = cloudData;
                // Update localStorage
                localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
                render();
                showNotification('☁️ סונכרן מהענן!');
            } else {
                console.log('✓ הנתונים זהים, אין צורך בסנכרון');
            }
        } else {
            console.log('📝 מסמך לא קיים בענן, יוצר חדש...');
            // Document doesn't exist? Create it from local
            syncToCloud();
        }
    }, (error) => {
        console.error("❌ שגיאת Firestore sync:", error);
        showDetailedError('Firestore Sync', error);
    });
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
    } catch (error) {
        console.error("❌ שגיאה בכתיבה לענן:", error);
        showDetailedError('Cloud Sync', error);
    } finally {
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

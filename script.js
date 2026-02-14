// ========== Firebase Configuration ==========
// Firebase methods are attached to window in index.html
let unsubscribeSnapshot = null;
let isSyncing = false;
let isConnected = false;
let currentUser = null;
let syncTimeout = null;

// ========== Global Variables for Notes Feature ==========
let currentNoteItemIndex = null;

// ========== Global Variables for Peace of Mind Features ==========
let currentEditItemIndex = null;
let currentEditField = null;

// ========== Global Variables for Undo Delete Feature ==========
let deletedItem = null;
let deletedItemIndex = null;
let deleteTimeout = null;
let undoNotification = null;

// ========== Global Variables for Clipboard Import ==========
let pendingImportText = null;
let detectedListType = null;

// ========== Reminder Time Conversion ==========
function getReminderMilliseconds(value, unit) {
    if (!value || !unit) return 0;
    
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue <= 0) return 0;
    
    const conversions = {
        'minutes': numValue * 60 * 1000,
        'hours': numValue * 60 * 60 * 1000,
        'days': numValue * 24 * 60 * 60 * 1000,
        'weeks': numValue * 7 * 24 * 60 * 60 * 1000
    };
    
    return conversions[unit] || 0;
}

function formatReminderText(value, unit) {
    if (!value || !unit) return '';
    
    const units = {
        'minutes': value === '1' ? 'דקה' : 'דקות',
        'hours': value === '1' ? 'שעה' : 'שעות',
        'days': value === '1' ? 'יום' : 'ימים',
        'weeks': value === '1' ? 'שבוע' : 'שבועות'
    };
    
    return `${value} ${units[unit]}`;
}

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

// ========== Category Keywords - Multilingual ==========
const CATEGORY_KEYWORDS = {
    'פירות וירקות': [
        // עברית
        'עגבניות', 'עגבנייה', 'מלפפון', 'מלפפונים', 'חסה', 'חציל', 'גזר', 'בצל', 'שום', 'תפוח', 'תפוחים',
        'בננה', 'בננות', 'תפוז', 'תפוזים', 'אבוקדו', 'לימון', 'לימונים', 'תות', 'תותים', 'ענבים',
        'אבטיח', 'מלון', 'אפרסק', 'אפרסקים', 'שזיף', 'שזיפים', 'אגס', 'אגסים', 'תרד', 'כרוב',
        'ברוקולי', 'כרובית', 'פלפל', 'פלפלים', 'קישוא', 'קישואים', 'דלעת', 'תירס', 'פטריות',
        'ירקות', 'פירות', 'ירק', 'פרי', 'סלט', 'פטרוזיליה', 'כוסברה', 'נענע', 'בזיליקום',
        // English
        'tomato', 'tomatoes', 'cucumber', 'cucumbers', 'lettuce', 'eggplant', 'carrot', 'carrots', 'onion', 'onions',
        'garlic', 'apple', 'apples', 'banana', 'bananas', 'orange', 'oranges', 'avocado', 'lemon', 'lemons',
        'strawberry', 'strawberries', 'grapes', 'watermelon', 'melon', 'peach', 'peaches', 'plum', 'plums',
        'pear', 'pears', 'spinach', 'cabbage', 'broccoli', 'cauliflower', 'pepper', 'peppers', 'zucchini',
        'pumpkin', 'corn', 'mushroom', 'mushrooms', 'vegetables', 'veggies', 'fruits', 'fruit', 'salad',
        'parsley', 'cilantro', 'coriander', 'mint', 'basil',
        // Русский
        'помидор', 'помидоры', 'огурец', 'огурцы', 'салат', 'баклажан', 'морковь', 'лук', 'чеснок',
        'яблоко', 'яблоки', 'банан', 'бананы', 'апельсин', 'апельсины', 'авокадо', 'лимон', 'лимоны',
        'клубника', 'виноград', 'арбуз', 'дыня', 'персик', 'персики', 'слива', 'сливы', 'груша', 'груши',
        'шпинат', 'капуста', 'брокколи', 'цветная капуста', 'перец', 'кабачок', 'тыква', 'кукуруза',
        'грибы', 'гриб', 'овощи', 'фрукты', 'петрушка', 'кинза', 'мята', 'базилик',
        // Română
        'roșii', 'roșie', 'castravete', 'castraveți', 'salată', 'vânătă', 'morcov', 'morcovi', 'ceapă',
        'usturoi', 'măr', 'mere', 'banană', 'banane', 'portocală', 'portocale', 'avocado', 'lămâie', 'lămâi',
        'căpșuni', 'struguri', 'pepene', 'pepene galben', 'piersică', 'piersici', 'prună', 'prune', 'pară', 'pere',
        'spanac', 'varză', 'broccoli', 'conopidă', 'ardei', 'dovlecel', 'dovleac', 'porumb', 'ciuperci',
        'legume', 'fructe', 'pătrunjel', 'coriandru', 'mentă', 'busuioc'
    ],
    'בשר ודגים': [
        // עברית
        'בשר', 'עוף', 'תרנגולת', 'הודו', 'נקניק', 'נקניקיות', 'קבב', 'המבורגר', 'שניצל',
        'סטייק', 'אנטריקוט', 'צלי', 'כבד', 'לב', 'קורנדביף', 'סלמי', 'נתחי', 'כנפיים',
        'דג', 'דגים', 'סלמון', 'טונה', 'בקלה', 'אמנון', 'דניס', 'לוקוס', 'מושט', 'בורי',
        'שרימפס', 'קלמרי', 'פירות ים', 'סרדינים', 'מקרל',
        // English
        'meat', 'beef', 'chicken', 'turkey', 'sausage', 'sausages', 'kebab', 'burger', 'hamburger',
        'schnitzel', 'steak', 'ribeye', 'roast', 'liver', 'heart', 'corned beef', 'salami', 'wings',
        'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'bass', 'trout', 'sardines', 'mackerel',
        'shrimp', 'prawns', 'squid', 'seafood', 'pork', 'lamb', 'veal', 'duck', 'ground meat',
        // Русский
        'мясо', 'говядина', 'курица', 'индейка', 'колбаса', 'сосиски', 'кебаб', 'бургер', 'гамбургер',
        'шницель', 'стейк', 'рибай', 'жаркое', 'печень', 'сердце', 'солонина', 'салями', 'крылышки',
        'рыба', 'лосось', 'тунец', 'треска', 'тилапия', 'окунь', 'форель', 'сардины', 'скумбрия',
        'креветки', 'кальмар', 'морепродукты', 'свинина', 'баранина', 'телятина', 'утка', 'фарш',
        // Română
        'carne', 'vită', 'pui', 'curcan', 'cârnat', 'cârnați', 'kebab', 'burger', 'hamburger',
        'șnițel', 'friptură', 'antricot', 'friptură', 'ficat', 'inimă', 'pastramă', 'salam', 'aripioare',
        'pește', 'somon', 'ton', 'cod', 'tilapia', 'biban', 'păstrăv', 'sardine', 'macrou',
        'creveți', 'calmar', 'fructe de mare', 'porc', 'miel', 'vițel', 'rață', 'carne tocată'
    ],
    'חלב וביצים': [
        // עברית
        'חלב', 'גבינה', 'גבינות', 'קוטג', 'קוטג׳', 'יוגורט', 'שמנת', 'חמאה', 'ביצים', 'ביצה',
        'לבן', 'לבנה', 'צפתית', 'בולגרית', 'צהובה', 'מוצרלה', 'פרמזן', 'עמק', 'גילה',
        'גד', 'תנובה', 'שטראוס', 'יופלה', 'דנונה', 'מילקי', 'פודינג', 'חלבון', 'מעדן',
        'גלידה', 'גלידות', 'חלבי', 'חלביים',
        // English
        'milk', 'cheese', 'cottage', 'cottage cheese', 'yogurt', 'yoghurt', 'cream', 'sour cream',
        'butter', 'eggs', 'egg', 'white cheese', 'feta', 'bulgarian cheese', 'yellow cheese',
        'mozzarella', 'parmesan', 'cheddar', 'swiss', 'gouda', 'brie', 'cream cheese',
        'pudding', 'protein', 'dessert', 'ice cream', 'dairy', 'milk products',
        // Русский
        'молоко', 'сыр', 'творог', 'йогурт', 'сметана', 'сливки', 'масло', 'яйца', 'яйцо',
        'белый сыр', 'фета', 'брынза', 'болгарский сыр', 'желтый сыр', 'моцарелла', 'пармезан',
        'чеддер', 'швейцарский', 'гауда', 'бри', 'сливочный сыр', 'пудинг', 'белок', 'десерт',
        'мороженое', 'молочные продукты', 'молочное',
        // Română
        'lapte', 'brânză', 'brânză de vaci', 'iaurt', 'smântână', 'unt', 'ouă', 'ou',
        'brânză albă', 'telemea', 'brânză bulgărească', 'brânză galbenă', 'mozzarella', 'parmezan',
        'cheddar', 'gouda', 'brie', 'brânză cremă', 'budincă', 'proteină', 'desert',
        'înghețată', 'lactate', 'produse lactate'
    ],
    'לחם ומאפים': [
        // עברית
        'לחם', 'לחמניה', 'לחמניות', 'פיתה', 'פיתות', 'בגט', 'חלה', 'חלות', 'טוסט', 'כריך',
        'רוגלך', 'בורקס', 'בורקסים', 'קרואסון', 'קרואסונים', 'מאפה', 'מאפים', 'עוגה', 'עוגות',
        'עוגיות', 'עוגייה', 'ביסקוויט', 'קרקר', 'קרקרים', 'פריכיות', 'לחמית', 'בייגל',
        'מצה', 'מצות', 'פיצה', 'פסטה', 'ספגטי', 'מקרוני', 'אטריות', 'קוסקוס', 'בורגול',
        'קמח', 'שמרים', 'אבקת אפייה', 'סוכר', 'אורז', 'פתיתים',
        // English
        'bread', 'roll', 'rolls', 'pita', 'baguette', 'challah', 'toast', 'sandwich',
        'croissant', 'croissants', 'pastry', 'pastries', 'cake', 'cakes', 'cookie', 'cookies',
        'biscuit', 'biscuits', 'cracker', 'crackers', 'bagel', 'bagels', 'matzah', 'matzo',
        'pizza', 'pasta', 'spaghetti', 'macaroni', 'noodles', 'couscous', 'bulgur',
        'flour', 'yeast', 'baking powder', 'sugar', 'rice', 'cereal', 'flakes',
        // Русский
        'хлеб', 'булка', 'булочка', 'пита', 'багет', 'хала', 'тост', 'сэндвич',
        'круассан', 'круассаны', 'выпечка', 'пирожное', 'торт', 'торты', 'печенье', 'бисквит',
        'крекер', 'крекеры', 'бублик', 'маца', 'пицца', 'паста', 'спагетти', 'макароны',
        'лапша', 'кускус', 'булгур', 'мука', 'дрожжи', 'разрыхлитель', 'сахар', 'рис',
        'хлопья', 'каша',
        // Română
        'pâine', 'chiflă', 'chifle', 'pita', 'baghetă', 'challah', 'toast', 'sandviș',
        'croissant', 'croissante', 'patiserie', 'prăjitură', 'prăjituri', 'tort', 'biscuit', 'biscuiți',
        'fursec', 'cracker', 'covrig', 'matzah', 'pizza', 'paste', 'spaghete', 'macaroane',
        'tăiței', 'cuscus', 'bulgur', 'făină', 'drojdie', 'praf de copt', 'zahăr', 'orez',
        'cereale', 'fulgi'
    ],
    'שימורים': [
        // עברית
        'שימורים', 'קופסא', 'קופסת', 'שימורי', 'תירס שימורי', 'פטריות שימורי', 'זיתים',
        'מלפפונים חמוצים', 'חמוצים', 'כבושים', 'רוטב עגבניות', 'עגבניות מרוסקות', 'ממרח',
        'טונה קופסא', 'סרדינים קופסא', 'הומוס', 'טחינה', 'חומוס', 'פול', 'חומוס מוכן',
        'סלט', 'פסטה מוכנה', 'רוטב', 'רטבים', 'קטשופ', 'מיונז', 'חרדל', 'ריבה', 'דבש',
        'ממרחים', 'נוטלה', 'שוקולד ממרח',
        // English
        'canned', 'can', 'cans', 'preserved', 'canned corn', 'canned mushrooms', 'olives',
        'pickles', 'pickled', 'tomato sauce', 'crushed tomatoes', 'spread', 'spreads',
        'canned tuna', 'canned sardines', 'hummus', 'tahini', 'beans', 'ready hummus',
        'salad', 'ready pasta', 'sauce', 'sauces', 'ketchup', 'mayo', 'mayonnaise', 'mustard',
        'jam', 'jams', 'honey', 'nutella', 'chocolate spread', 'peanut butter',
        // Русский
        'консервы', 'банка', 'банки', 'консервированный', 'кукуруза консервированная', 'грибы консервированные',
        'оливки', 'маслины', 'соленья', 'маринованные', 'томатный соус', 'помидоры резаные', 'паста',
        'тунец консервированный', 'сардины консервированные', 'хумус', 'тахини', 'фасоль', 'готовый хумус',
        'салат', 'готовая паста', 'соус', 'соусы', 'кетчуп', 'майонез', 'горчица', 'варенье', 'мед',
        'паста ореховая', 'нутелла', 'шоколадная паста',
        // Română
        'conserve', 'conservă', 'cutie', 'cutii', 'porumb conservat', 'ciuperci conservate', 'măsline',
        'castraveți murați', 'murături', 'sos de roșii', 'roșii tocate', 'pastă', 'paste',
        'ton conservat', 'sardine conservate', 'humus', 'tahini', 'fasole', 'humus gata',
        'salată', 'paste gata', 'sos', 'sosuri', 'ketchup', 'maioneză', 'muștar', 'gem', 'miere',
        'unt de arahide', 'nutella', 'pastă de ciocolată'
    ],
    'חטיפים': [
        // עברית
        'חטיף', 'חטיפים', 'במבה', 'ביסלי', 'דוריטוס', 'צ׳יפס', 'צ׳יטוס', 'אפרופו', 'טורטית',
        'פופקורן', 'בוטנים', 'אגוזים', 'שקדים', 'קשיו', 'פיסטוק', 'גרעינים', 'צימוקים',
        'פירות יבשים', 'תמרים', 'משמש מיובש', 'שוקולד', 'ממתק', 'ממתקים', 'סוכריות',
        'גומי', 'מנטה', 'מסטיק', 'וופל', 'וופלים', 'חטיף אנרגיה', 'חטיף חלבון', 'גרנולה',
        'בר', 'ברים', 'קליק', 'פסק זמן', 'קינדר', 'מרס', 'סניקרס', 'טוויקס', 'קיט קט',
        // English
        'snack', 'snacks', 'chips', 'crisps', 'doritos', 'cheetos', 'tortilla', 'tortilla chips',
        'popcorn', 'peanuts', 'nuts', 'almonds', 'cashews', 'pistachios', 'seeds', 'raisins',
        'dried fruit', 'dates', 'dried apricots', 'chocolate', 'candy', 'candies', 'sweets',
        'gummies', 'mint', 'gum', 'chewing gum', 'wafer', 'wafers', 'energy bar', 'protein bar',
        'granola', 'bar', 'bars', 'kinder', 'mars', 'snickers', 'twix', 'kit kat', 'pretzels',
        // Русский
        'снэк', 'чипсы', 'дорitos', 'читос', 'тортилья', 'попкорн', 'арахис', 'орехи',
        'миндаль', 'кешью', 'фисташки', 'семечки', 'изюм', 'сухофрукты', 'финики', 'курага',
        'шоколад', 'конфета', 'конфеты', 'сладости', 'мармелад', 'мятные', 'жвачка', 'вафля',
        'вафли', 'энергетический батончик', 'протеиновый батончик', 'гранола', 'батончик',
        'киндер', 'марс', 'сникерс', 'твикс', 'кит кат',
        // Română
        'gustare', 'chips', 'chipsuri', 'doritos', 'cheetos', 'tortilla', 'popcorn', 'alune',
        'nuci', 'migdale', 'caju', 'fistic', 'semințe', 'stafide', 'fructe uscate', 'curmale',
        'caise uscate', 'ciocolată', 'bomboane', 'dulciuri', 'jeleuri', 'mentă', 'gumă de mestecat',
        'napolitană', 'napolitane', 'baton energetic', 'baton proteic', 'granola', 'baton',
        'kinder', 'mars', 'snickers', 'twix', 'kit kat'
    ],
    'משקאות': [
        // עברית
        'מים', 'מי', 'מינרלים', 'נביעות', 'עדן', 'נווה', 'קולה', 'פפסי', 'ספרייט', 'פאנטה',
        'שוופס', 'סודה', 'משקה', 'משקאות', 'מיץ', 'מיצים', 'תפוזים', 'פריגת', 'פרימור',
        'בירה', 'יין', 'וודקה', 'ויסקי', 'אלכוהול', 'קפה', 'נס', 'נסקפה', 'תה', 'תיונים',
        'ויסוצקי', 'חליבה', 'שוקו', 'חלב שוקולד', 'אייס קפה', 'אנרגיה', 'רד בול', 'XL',
        'פחית', 'בקבוק', 'שתייה', 'לימונדה', 'לימונענע', 'תפוזינה',
        // English
        'water', 'mineral water', 'sparkling water', 'cola', 'coke', 'pepsi', 'sprite', 'fanta',
        'soda', 'soft drink', 'beverage', 'juice', 'orange juice', 'apple juice', 'grape juice',
        'beer', 'wine', 'vodka', 'whiskey', 'whisky', 'alcohol', 'coffee', 'nescafe', 'tea',
        'milk shake', 'chocolate milk', 'iced coffee', 'energy drink', 'red bull', 'monster',
        'can', 'bottle', 'drink', 'lemonade', 'orangeade',
        // Русский
        'вода', 'минеральная вода', 'газировка', 'кола', 'пепси', 'спрайт', 'фанта', 'швепс',
        'содовая', 'напиток', 'сок', 'соки', 'апельсиновый сок', 'яблочный сок', 'виноградный сок',
        'пиво', 'вино', 'водка', 'виски', 'алкоголь', 'кофе', 'нескафе', 'чай', 'молочный коктейль',
        'шоколадное молоко', 'холодный кофе', 'энергетик', 'ред булл', 'монстр', 'банка', 'бутылка',
        'питье', 'лимонад',
        // Română
        'apă', 'apă minerală', 'apă gazoasă', 'cola', 'pepsi', 'sprite', 'fanta', 'schweppes',
        'suc', 'băutură', 'suc de portocale', 'suc de mere', 'suc de struguri', 'bere', 'vin',
        'vodcă', 'whisky', 'alcool', 'cafea', 'nescafe', 'ceai', 'milkshake', 'lapte cu ciocolată',
        'cafea rece', 'băutură energizantă', 'red bull', 'monster', 'cutie', 'sticlă', 'băutură',
        'limonadă'
    ],
    'ניקיון': [
        // עברית
        'סבון', 'סבונים', 'ניקוי', 'ניקיון', 'דטרגנט', 'אבקת כביסה', 'מרכך', 'מרככים',
        'אקונומיקה', 'סנו', 'כלורקס', 'ווניש', 'פרסיל', 'אריאל', 'ביומט', 'סיף', 'מטליות',
        'ספוג', 'ספוגים', 'מגבונים', 'נייר מגבת', 'נייר טואלט', 'טישו', 'מברשת', 'מברשות',
        'שואב', 'שקיות אשפה', 'אשפה', 'סמרטוט', 'דלי', 'מנקה', 'מנקים', 'אקונומיקה',
        'ג׳ל כלים', 'נוזל כלים', 'פיירי', 'סודה לשתייה', 'חומץ', 'אלכוהול ניקוי', 'כפפות',
        // English
        'soap', 'soaps', 'cleaning', 'cleaner', 'detergent', 'laundry detergent', 'fabric softener',
        'bleach', 'clorox', 'vanish', 'persil', 'ariel', 'tide', 'cloths', 'cloth', 'sponge', 'sponges',
        'wipes', 'paper towel', 'toilet paper', 'tissue', 'tissues', 'brush', 'brushes', 'vacuum',
        'garbage bags', 'trash bags', 'garbage', 'mop', 'bucket', 'dish soap', 'dishwashing liquid',
        'fairy', 'baking soda', 'vinegar', 'rubbing alcohol', 'gloves', 'cleaning gloves',
        // Русский
        'мыло', 'чистка', 'моющее средство', 'стиральный порошок', 'кондиционер для белья', 'отбеливатель',
        'хлоркс', 'ваниш', 'персил', 'ариэль', 'тайд', 'тряпки', 'губка', 'губки', 'салфетки',
        'бумажные полотенца', 'туалетная бумага', 'носовые платки', 'щетка', 'щетки', 'пылесос',
        'мешки для мусора', 'мусор', 'швабра', 'ведро', 'средство для посуды', 'фейри', 'сода',
        'уксус', 'спирт', 'перчатки',
        // Română
        'săpun', 'curățenie', 'detergent', 'detergent de rufe', 'balsam de rufe', 'înălbitor',
        'clorox', 'vanish', 'persil', 'ariel', 'tide', 'cârpe', 'burete', 'bureți', 'șervețele',
        'prosop de hârtie', 'hârtie igienică', 'batiste', 'perie', 'perii', 'aspirator',
        'saci de gunoi', 'gunoi', 'mop', 'găleată', 'detergent de vase', 'fairy', 'bicarbonat',
        'oțet', 'alcool', 'mănuși'
    ],
    'היגיינה': [
        // עברית
        'שמפו', 'מרכך שיער', 'סבון גוף', 'ג׳ל רחצה', 'משחת שיניים', 'מברשת שיניים', 'חוט דנטלי',
        'דאודורנט', 'בושם', 'קרם', 'קרמים', 'תחליב', 'לוסיון', 'קצף גילוח', 'סכין גילוח',
        'מכונת גילוח', 'ג׳ילט', 'ואקס', 'תחבושות', 'פלסטרים', 'צמר גפן', 'מקלוני אוזניים',
        'טמפונים', 'תחבושות היגייניות', 'מגבונים לחים', 'חיתולים', 'האגיס', 'פמפרס',
        'קרם ידיים', 'קרם פנים', 'מסכה', 'מסכות', 'איפור', 'שפתון', 'מסקרה', 'טיפוח',
        // English
        'shampoo', 'conditioner', 'hair conditioner', 'body soap', 'shower gel', 'toothpaste',
        'toothbrush', 'dental floss', 'deodorant', 'perfume', 'cologne', 'cream', 'lotion',
        'shaving cream', 'razor', 'shaving razor', 'gillette', 'wax', 'bandages', 'band-aids',
        'cotton', 'cotton swabs', 'q-tips', 'tampons', 'pads', 'sanitary pads', 'wet wipes',
        'diapers', 'huggies', 'pampers', 'hand cream', 'face cream', 'mask', 'masks', 'makeup',
        'lipstick', 'mascara', 'skincare', 'cosmetics',
        // Русский
        'шампунь', 'кондиционер', 'кондиционер для волос', 'мыло для тела', 'гель для душа',
        'зубная паста', 'зубная щетка', 'зубная нить', 'дезодорант', 'духи', 'одеколон', 'крем',
        'лосьон', 'пена для бритья', 'бритва', 'бритвенный станок', 'жиллетт', 'воск', 'бинты',
        'пластыри', 'вата', 'ватные палочки', 'тампоны', 'прокладки', 'влажные салфетки',
        'подгузники', 'хаггис', 'памперс', 'крем для рук', 'крем для лица', 'маска', 'маски',
        'макияж', 'косметика', 'помада', 'тушь', 'уход за кожей',
        // Română
        'șampon', 'balsam', 'balsam de păr', 'săpun de corp', 'gel de duș', 'pastă de dinți',
        'periuță de dinți', 'ață dentară', 'deodorant', 'parfum', 'cremă', 'loțiune',
        'spumă de ras', 'aparat de ras', 'gillette', 'ceară', 'bandaje', 'plasturi',
        'vată', 'bețișoare', 'tampoane', 'absorbante', 'șervețele umede', 'scutece',
        'huggies', 'pampers', 'cremă de mâini', 'cremă de față', 'mască', 'măști',
        'machiaj', 'ruj', 'rimel', 'cosmetice', 'îngrijire piele'
    ]
};

// Function to detect category from product name with default "אחר"
function detectCategory(productName) {
    if (!productName) return 'אחר';

    const nameLower = productName.toLowerCase().trim();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    // ברירת מחדל - החזר "אחר" אם לא נמצאה התאמה
    return 'אחר';
}

// Function to get learned category for a product (category memory)
function getLearnedCategory(productName) {
    if (!productName || !db.categoryMemory) return null;
    const nameLower = productName.toLowerCase().trim();
    return db.categoryMemory[nameLower] || null;
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
        categoryExpenses: '💰 הוצאות לפי קטגוריה',
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
        categoryExpenses: '💰 Expenses by Category',
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
        categoryExpenses: '💰 Расходы по Категориям',
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
        categoryExpenses: '💰 Cheltuieli pe Categorii',
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
    },
    customCategories: [],
    categoryMemory: {}
};

let isLocked = true;
let activePage = db.lastActivePage || 'lists';
let currentEditIdx = null;
let listToDelete = null;
let sortableInstance = null;
let monthlyChart = null;
let categoryDoughnutChart = null;
let highlightedItemIndex = null;
let highlightedListId = null;
let categorySortEnabled = localStorage.getItem('categorySortEnabled') === 'true' || false;

// Backwards compatibility: Initialize new properties if they don't exist
if (!db.customCategories) db.customCategories = [];
if (!db.categoryMemory) db.categoryMemory = {};


// ========== Core Functions ==========
function save() {
    db.lastActivePage = activePage;
    db.lastSync = Date.now();
    localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
    render();
    
    // Update notification badge
    if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
    }

    if (isConnected && currentUser) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncToCloud();
        }, 1500);
    }
}

function toggleItem(idx) {
    const item = db.lists[db.currentId].items[idx];
    item.checked = !item.checked;

    // מיון דו-שכבתי אוטומטי
    db.lists[db.currentId].items = sortItemsByStatusAndCategory(db.lists[db.currentId].items);

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

    const categoryExpensesTitle = document.getElementById('categoryExpensesTitle');
    if (categoryExpensesTitle) categoryExpensesTitle.textContent = t('categoryExpenses');

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
                    category: category,
                    cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
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
                    category: detectCategory(name),
                    cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
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
                        category: detectCategory(line),
                        cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
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
        document.getElementById('itemQty').value = '1';
        document.getElementById('itemCategory').value = '';

        // Update category dropdown with latest custom categories
        updateCategoryDropdown();

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

    if (id === 'categoryManagerModal') {
        renderCustomCategoriesList();
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
    notif.style.maxWidth = '350px';
    notif.style.wordWrap = 'break-word';
    notif.innerHTML = `<strong>${message}</strong>`;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 4000); // Extended to 4 seconds for longer messages
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

// Helper function to generate dueDate and notes HTML
function generateItemMetadataHTML(item, idx) {
    let html = '';
    
    // Build dueDate display - NOT clickable itself, parent div handles click
    if (item.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let dateClass = 'item-duedate-display';
        let dateText = new Date(item.dueDate).toLocaleDateString('he-IL');
        
        // Add time if exists
        if (item.dueTime) {
            dateText += ` ⏰ ${item.dueTime}`;
        }
        
        if (diffDays < 0 && !item.checked && !item.isPaid) {
            dateClass += ' overdue';
            dateText += ' (עבר!)';
        } else if (diffDays >= 0 && diffDays <= 3 && !item.checked && !item.isPaid) {
            dateClass += ' soon';
        }
        
        html += `<div class="${dateClass}">📅 ${dateText}</div>`;
    }
    
    // Build payment URL link - ONLY as clickable icon with stopPropagation
    if (item.paymentUrl && item.paymentUrl.trim()) {
        html += `<div style="display: inline-flex; align-items: center; gap: 6px; margin-top: 4px;">
            <a href="${item.paymentUrl}" target="_blank" onclick="event.stopPropagation();" style="color: #6366f1; text-decoration: none; display: flex; align-items: center;" title="פתח קישור">
                <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
            </a>
        </div>`;
    }
    
    // Build notes display - ONLY if there are actual notes (not URLs from paymentUrl field)
    if (item.note && item.note.trim()) {
        html += `<div class="item-notes-display">📝 ${item.note}</div>`;
    }
    
    // Build paid badge
    if (item.isPaid) {
        html += `<div class="item-paid-badge">✓ שולם</div>`;
    }
    
    return html;
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
                // Category sorting mode with dynamic category discovery
                const defaultOrder = [
                    'פירות וירקות',
                    'בשר ודגים',
                    'חלב וביצים',
                    'לחם ומאפים',
                    'שימורים',
                    'חטיפים',
                    'משקאות',
                    'ניקיון',
                    'היגיינה'
                ];

                // Discover all unique categories in current list
                const allCategories = new Set();
                list.items.forEach(item => {
                    const category = item.category || 'כללי';
                    allCategories.add(category);
                });

                // Build dynamic category order: defaults + custom categories + אחר/כללי at end
                const customCategoriesInList = Array.from(allCategories).filter(cat => 
                    !defaultOrder.includes(cat) && cat !== 'אחר' && cat !== 'כללי'
                );
                
                const categoryOrder = [
                    ...defaultOrder,
                    ...customCategoriesInList,
                    'אחר',
                    'כללי'
                ];

                // Separate items into unchecked and checked groups
                const uncheckedItems = list.items.filter(item => !item.checked);
                const checkedItems = list.items.filter(item => item.checked);

                // Group unchecked items by category
                const categorizedUnchecked = {};
                uncheckedItems.forEach((item, originalIdx) => {
                    const category = item.category || 'כללי';
                    if (!categorizedUnchecked[category]) {
                        categorizedUnchecked[category] = [];
                    }
                    // Find original index in full list
                    const idx = list.items.findIndex(i => i === item);
                    categorizedUnchecked[category].push({ item, idx });
                });

                // Group checked items by category
                const categorizedChecked = {};
                checkedItems.forEach((item, originalIdx) => {
                    const category = item.category || 'כללי';
                    if (!categorizedChecked[category]) {
                        categorizedChecked[category] = [];
                    }
                    // Find original index in full list
                    const idx = list.items.findIndex(i => i === item);
                    categorizedChecked[category].push({ item, idx });
                });

                // Render unchecked items by category
                let itemNumber = 1;
                categoryOrder.forEach(category => {
                    if (categorizedUnchecked[category] && categorizedUnchecked[category].length > 0) {
                        // Render category header
                        const categoryHeader = document.createElement('div');
                        categoryHeader.className = 'category-separator';
                        categoryHeader.style.background = `linear-gradient(135deg, ${CATEGORIES[category] || '#6b7280'} 0%, ${CATEGORIES[category] || '#6b7280'}dd 100%)`;
                        categoryHeader.innerHTML = `
                            <div class="text-lg font-black">${category} (${categorizedUnchecked[category].length})</div>
                        `;
                        container.appendChild(categoryHeader);

                        // Render unchecked items in this category
                        categorizedUnchecked[category].forEach(({ item, idx }) => {
                            const sub = item.price * item.qty;
                            total += sub;

                            const categoryBadge = item.category ? `<span class="category-badge" onclick="event.stopPropagation(); openEditCategoryModal(${idx})" style="background: ${CATEGORIES[item.category] || '#6b7280'}20; color: ${CATEGORIES[item.category] || '#6b7280'}; cursor: pointer;">${item.category}</span>` : '';
                            const metadataHTML = generateItemMetadataHTML(item, idx);

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
                                            <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}" onclick="openEditItemNameModal(${idx})" style="cursor: pointer;">
                                                <span class="item-number">${itemNumber}.</span> ${item.name}
                                            </div>
                                            ${categoryBadge}
                                            ${metadataHTML}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="note-icon ${item.note ? 'has-note' : ''}" onclick="openItemNoteModal(${idx})" title="${item.note ? 'יש הערה' : 'הוסף הערה'}">
                                            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                        </div>
                                        <button onclick="removeItem(${idx})" class="trash-btn">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center">
                                    ${item.dueDate && item.dueTime && item.price === 0 ? '' : `
                                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                                        <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                                        <span class="font-bold w-6 text-center">${item.qty}</span>
                                        <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                                    </div>
                                    <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600" style="cursor: pointer;">₪${sub.toFixed(2)}</span>
                                    `}
                                </div>
                            `;
                            container.appendChild(div);
                            itemNumber++;
                        });
                    }
                });

                // Render checked items section if any exist
                if (checkedItems.length > 0) {
                    // Add "Completed" separator
                    const completedHeader = document.createElement('div');
                    completedHeader.className = 'category-separator';
                    completedHeader.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    completedHeader.innerHTML = `
                        <div class="text-lg font-black">✅ הושלמו (${checkedItems.length})</div>
                    `;
                    container.appendChild(completedHeader);

                    // Render checked items by category
                    categoryOrder.forEach(category => {
                        if (categorizedChecked[category] && categorizedChecked[category].length > 0) {
                            categorizedChecked[category].forEach(({ item, idx }) => {
                                const sub = item.price * item.qty;
                                total += sub;
                                paid += sub;

                                const categoryBadge = item.category ? `<span class="category-badge" onclick="event.stopPropagation(); openEditCategoryModal(${idx})" style="background: ${CATEGORIES[item.category] || '#6b7280'}20; color: ${CATEGORIES[item.category] || '#6b7280'}; cursor: pointer;">${item.category}</span>` : '';
                                const metadataHTML = generateItemMetadataHTML(item, idx);

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
                                                <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}" onclick="openEditItemNameModal(${idx})" style="cursor: pointer;">
                                                    <span class="item-number">${itemNumber}.</span> ${item.name}
                                                </div>
                                                ${categoryBadge}
                                                ${metadataHTML}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div class="note-icon ${item.note ? 'has-note' : ''}" onclick="openItemNoteModal(${idx})" title="${item.note ? 'יש הערה' : 'הוסף הערה'}">
                                                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </div>
                                            <button onclick="removeItem(${idx})" class="trash-btn">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        ${item.dueDate && item.dueTime && item.price === 0 ? '' : `
                                        <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                                            <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                                            <span class="font-bold w-6 text-center">${item.qty}</span>
                                            <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                                        </div>
                                        <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600" style="cursor: pointer;">₪${sub.toFixed(2)}</span>
                                        `}
                                    </div>
                                `;
                                container.appendChild(div);
                                itemNumber++;
                            });
                        }
                    });
                }
            } else {
                // Manual sorting mode (original behavior)
                list.items.forEach((item, idx) => {
                    const sub = item.price * item.qty;
                    total += sub;
                    if (item.checked) paid += sub;

                    const categoryBadge = item.category ? `<span class="category-badge" onclick="event.stopPropagation(); openEditCategoryModal(${idx})" style="background: ${CATEGORIES[item.category] || '#6b7280'}20; color: ${CATEGORIES[item.category] || '#6b7280'}; cursor: pointer;">${item.category}</span>` : '';
                    const metadataHTML = generateItemMetadataHTML(item, idx);

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
                                    <div class="text-2xl font-bold ${item.checked ? 'line-through text-gray-300' : ''}" onclick="openEditItemNameModal(${idx})" style="cursor: pointer;">
                                        <span class="item-number">${idx + 1}.</span> ${item.name}
                                    </div>
                                    ${categoryBadge}
                                    ${metadataHTML}
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="note-icon ${item.note ? 'has-note' : ''}" onclick="openItemNoteModal(${idx})" title="${item.note ? 'יש הערה' : 'הוסף הערה'}">
                                    <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                </div>
                                <button onclick="removeItem(${idx})" class="trash-btn">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border">
                                <button onclick="changeQty(${idx}, 1)" class="text-green-500 text-2xl font-bold">+</button>
                                <span class="font-bold w-6 text-center">${item.qty}</span>
                                <button onclick="changeQty(${idx}, -1)" class="text-red-500 text-2xl font-bold">-</button>
                            </div>
                            <span onclick="openEditTotalModal(${idx})" class="text-2xl font-black text-indigo-600" style="cursor: pointer;">₪${sub.toFixed(2)}</span>
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
                            <div class="flex-1 text-2xl font-bold cursor-pointer" onclick="selectListAndImport('${id}'); showPage('lists')">
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
    renderCategoryDoughnutChart();
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

function renderCategoryDoughnutChart() {
    const ctx = document.getElementById('categoryDoughnutChart');
    if (!ctx) return;

    // איסוף נתונים מכל הרשימות - רק פריטים שבוצעו (checked: true)
    const categoryTotals = {};

    // Initialize all categories with 0
    Object.keys(CATEGORIES).forEach(cat => {
        categoryTotals[cat] = 0;
    });

    // Sum up CHECKED items from all ACTIVE lists
    Object.values(db.lists).forEach(list => {
        list.items.forEach(item => {
            if (item.checked) { // checked means completed
                const price = (item.price || 0) * (item.qty || 1);

                // Detect category
                let category = item.category || detectCategory(item.name);
                if (!category || !CATEGORIES[category]) {
                    category = 'אחר';
                }

                categoryTotals[category] = (categoryTotals[category] || 0) + price;
            }
        });
    });

    // Sum up ALL items from COMPLETED lists (history)
    if (db.history && db.history.length > 0) {
        db.history.forEach(entry => {
            entry.items.forEach(item => {
                const price = (item.price || 0) * (item.qty || 1);

                // Detect category
                let category = item.category || detectCategory(item.name);
                if (!category || !CATEGORIES[category]) {
                    category = 'אחר';
                }

                categoryTotals[category] = (categoryTotals[category] || 0) + price;
            });
        });
    }

    // Filter out categories with 0 spending
    const labels = [];
    const data = [];
    const colors = [];

    Object.entries(categoryTotals).forEach(([category, total]) => {
        if (total > 0) {
            labels.push(category);
            data.push(total);
            colors.push(CATEGORIES[category] || '#6b7280');
        }
    });

    // If no data, show message
    if (data.length === 0) {
        const container = document.getElementById('categoryBreakdown');
        if (container) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">אין נתונים להצגה - סמן פריטים כבוצעו או השלם רשימות כדי לראות הוצאות לפי קטגוריה</p>';
        }
        return;
    }

    // Destroy previous chart if exists
    if (categoryDoughnutChart) {
        categoryDoughnutChart.destroy();
    }

    // Create doughnut chart
    categoryDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    rtl: true,
                    labels: {
                        font: {
                            size: 12,
                            family: 'system-ui, sans-serif'
                        },
                        padding: 10,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₪${value.toFixed(2)} (${percentage}%)`;
                        }
                    },
                    rtl: true
                }
            }
        }
    });

    // Render text breakdown
    renderCategoryBreakdown(categoryTotals);
}

function renderCategoryBreakdown(categoryTotals) {
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;

    container.innerHTML = '';

    // Filter and sort by total (descending)
    const sortedCategories = Object.entries(categoryTotals)
        .filter(([_, total]) => total > 0)
        .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">אין נתונים להצגה</p>';
        return;
    }

    const totalSpent = sortedCategories.reduce((sum, [_, total]) => sum + total, 0);

    sortedCategories.forEach(([category, total]) => {
        const percentage = ((total / totalSpent) * 100).toFixed(1);
        const color = CATEGORIES[category] || '#6b7280';

        const div = document.createElement('div');
        div.className = 'flex justify-between items-center mb-3 p-3 rounded-xl border-2';
        div.style.borderColor = color;
        div.style.backgroundColor = color + '15'; // 15 is alpha for light background

        div.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full" style="background-color: ${color}"></div>
                <span class="font-bold text-gray-800">${category}</span>
            </div>
            <div class="text-left">
                <div class="font-black text-gray-800">₪${total.toFixed(2)}</div>
                <div class="text-xs text-gray-600">${percentage}%</div>
            </div>
        `;

        container.appendChild(div);
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
        items: JSON.parse(JSON.stringify(template.items.map(item => ({
            ...item,
            checked: false,
            cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        }))))
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
        items: JSON.parse(JSON.stringify(entry.items.map(item => ({
            ...item,
            checked: false,
            cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        }))))
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

function addItemToList(event) {
    if (event) event.preventDefault();
    
    const n = document.getElementById('itemName') ? document.getElementById('itemName').value.trim() : '';
    const p = parseFloat(document.getElementById('itemPrice') ? document.getElementById('itemPrice').value : 0) || 0;
    const q = parseInt(document.getElementById('itemQty') ? document.getElementById('itemQty').value : 1) || 1;
    const dueDate = document.getElementById('itemDueDate') ? document.getElementById('itemDueDate').value : '';
    const paymentUrl = document.getElementById('itemPaymentUrl') ? document.getElementById('itemPaymentUrl').value.trim() : '';
    const notes = document.getElementById('itemNotes') ? document.getElementById('itemNotes').value.trim() : '';
    const reminderValue = document.getElementById('itemReminderValue') ? document.getElementById('itemReminderValue').value : '';
    const reminderUnit = document.getElementById('itemReminderUnit') ? document.getElementById('itemReminderUnit').value : '';

    if (n) {
        // Intelligent category assignment: Priority order:
        // 1. User manually selected category
        // 2. Previously learned category for this product
        // 3. Auto-detected category from keywords
        // 4. Default to "אחר"
        let finalCategory;
        const c = document.getElementById('itemCategory') ? document.getElementById('itemCategory').value : '';
        if (c) {
            // User manually selected
            finalCategory = c;
        } else {
            // Check if we have a learned category for this product
            const learnedCategory = getLearnedCategory(n);
            if (learnedCategory) {
                finalCategory = learnedCategory;
            } else {
                // Use keyword detection
                finalCategory = detectCategory(n) || 'אחר';
            }
        }

        // Save to category memory for future auto-assignment
        if (!db.categoryMemory) db.categoryMemory = {};
        db.categoryMemory[n.toLowerCase().trim()] = finalCategory;

        // עדכון מחיר בהיסטוריה אם השתנה
        if (p > 0) {
            updatePriceInHistory(n, p);
        }

        db.lists[db.currentId].items.push({
            name: n,
            price: p,
            qty: q,
            checked: false,
            category: finalCategory,
            note: notes || '',
            dueDate: dueDate || '',
            paymentUrl: paymentUrl || '',
            isPaid: false,
            reminderValue: reminderValue || '',
            reminderUnit: reminderUnit || '',
            lastUpdated: Date.now(),
            cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });

        // איפוס טופס
        if (document.getElementById('itemName')) document.getElementById('itemName').value = '';
        if (document.getElementById('itemPrice')) document.getElementById('itemPrice').value = '';
        if (document.getElementById('itemQty')) document.getElementById('itemQty').value = '1';
        if (document.getElementById('itemCategory')) document.getElementById('itemCategory').value = '';
        if (document.getElementById('itemDueDate')) document.getElementById('itemDueDate').value = '';
        if (document.getElementById('itemPaymentUrl')) document.getElementById('itemPaymentUrl').value = '';
        if (document.getElementById('itemNotes')) document.getElementById('itemNotes').value = '';
        if (document.getElementById('itemReminderValue')) document.getElementById('itemReminderValue').value = '';
        if (document.getElementById('itemReminderUnit')) document.getElementById('itemReminderUnit').value = '';

        closeModal('inputForm');
        save();
        showNotification('✅ מוצר נוסף!');
        if (typeof checkUrgentPayments === 'function') {
            checkUrgentPayments();
        }
    } else {
        showNotification('⚠️ נא להזין שם מוצר', 'warning');
    }
}

function changeQty(idx, d) {
    if (db.lists[db.currentId].items[idx].qty + d >= 1) {
        db.lists[db.currentId].items[idx].qty += d;
        save();
    }
}

function removeItem(idx) {
    // שמירת הפריט והאינדקס שלו
    deletedItem = JSON.parse(JSON.stringify(db.lists[db.currentId].items[idx]));
    deletedItemIndex = idx;
    
    // מחיקת הפריט
    db.lists[db.currentId].items.splice(idx, 1);
    save();
    render();
    
    // ביטול טיימר קודם אם קיים
    if (deleteTimeout) {
        clearTimeout(deleteTimeout);
    }
    
    // הסרת הודעת ביטול קודמת אם קיימת
    if (undoNotification) {
        undoNotification.remove();
        undoNotification = null;
    }
    
    // יצירת הודעה עם כפתור ביטול
    const notif = document.createElement('div');
    notif.className = 'notification undo-notification';
    notif.style.background = '#ef4444';
    notif.style.color = 'white';
    notif.style.display = 'flex';
    notif.style.alignItems = 'center';
    notif.style.justifyContent = 'space-between';
    notif.style.gap = '10px';
    
    const message = document.createElement('span');
    message.innerHTML = '<strong>🗑️ מוצר הוסר</strong>';
    
    const undoBtn = document.createElement('button');
    undoBtn.innerHTML = '<strong>↩️ ביטול</strong>';
    undoBtn.style.background = 'white';
    undoBtn.style.color = '#ef4444';
    undoBtn.style.border = 'none';
    undoBtn.style.padding = '8px 16px';
    undoBtn.style.borderRadius = '10px';
    undoBtn.style.fontWeight = 'bold';
    undoBtn.style.cursor = 'pointer';
    undoBtn.style.fontSize = '14px';
    undoBtn.onclick = undoDelete;
    
    notif.appendChild(message);
    notif.appendChild(undoBtn);
    document.body.appendChild(notif);
    undoNotification = notif;
    
    // הצגת ההודעה
    setTimeout(() => notif.classList.add('show'), 100);
    
    // טיימר למחיקה סופית אחרי 5 שניות
    deleteTimeout = setTimeout(() => {
        finalizeDelete();
    }, 5000);
}

function undoDelete() {
    if (deletedItem !== null && deletedItemIndex !== null) {
        // ביטול הטיימר
        if (deleteTimeout) {
            clearTimeout(deleteTimeout);
            deleteTimeout = null;
        }
        
        // החזרת הפריט למיקום המקורי שלו
        db.lists[db.currentId].items.splice(deletedItemIndex, 0, deletedItem);
        
        // איפוס המשתנים
        deletedItem = null;
        deletedItemIndex = null;
        
        // שמירה ורינדור
        save();
        render();
        
        // הסרת הודעת הביטול
        if (undoNotification) {
            undoNotification.classList.remove('show');
            setTimeout(() => {
                undoNotification.remove();
                undoNotification = null;
            }, 300);
        }
        
        // הצגת הודעת אישור
        showNotification('✅ הפעולה בוטלה');
    }
}

function finalizeDelete() {
    // מחיקה סופית - איפוס המשתנים
    deletedItem = null;
    deletedItemIndex = null;
    deleteTimeout = null;
    
    // הסרת ההודעה
    if (undoNotification) {
        undoNotification.classList.remove('show');
        setTimeout(() => {
            undoNotification.remove();
            undoNotification = null;
        }, 300);
    }
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
            items.push({ name, price, qty, checked, category: detectCategory(name), cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) });
            itemAdded = true;
        }
        if (!itemAdded) {
            const bulletQtyMatch = line.match(/^[•\-]\s*\*?([^(]+)\*?\s*\(x(\d+)\)/);
            if (bulletQtyMatch) {
                const name = bulletQtyMatch[1].trim().replace(/\*/g, '');
                const qty = parseInt(bulletQtyMatch[2]);
                if (name) {
                    items.push({ name, price: 0, qty, checked: false, category: detectCategory(name), cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded) {
            const bulletMatch = line.match(/^[•\-]\s*\*?(.+?)\*?$/);
            if (bulletMatch) {
                const name = bulletMatch[1].trim().replace(/\*/g, '');
                if (name) {
                    items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name), cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded) {
            const starMatch = line.match(/^\*([^*]+)\*$/);
            if (starMatch) {
                const name = starMatch[1].trim();
                if (name) {
                    items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name), cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) });
                    itemAdded = true;
                }
            }
        }
        if (!itemAdded && line.length > 0) {
            const name = line.replace(/^[\d\.\)\-\s]+/, '').trim();
            if (name && !/^\d+$/.test(name)) {
                items.push({ name, price: 0, qty: 1, checked: false, category: detectCategory(name), cloudId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) });
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
        const newPrice = val / item.qty;
        item.price = newPrice;
        item.lastUpdated = Date.now();

        // עדכון מחיר בהיסטוריה
        updatePriceInHistory(item.name, newPrice);

        save();
    }
    closeModal('editTotalModal');
}

function openEditItemNameModal(idx) {
    currentEditIdx = idx;
    const item = db.lists[db.currentId].items[idx];
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemDueDate').value = item.dueDate || '';
    document.getElementById('editItemPaymentUrl').value = item.paymentUrl || '';
    if (document.getElementById('editItemReminderValue')) {
        document.getElementById('editItemReminderValue').value = item.reminderValue || '';
    }
    if (document.getElementById('editItemReminderUnit')) {
        document.getElementById('editItemReminderUnit').value = item.reminderUnit || '';
    }
    openModal('editItemNameModal');

    setTimeout(() => {
        const input = document.getElementById('editItemName');
        input.focus();
        input.select();
    }, 100);
}

function saveItemEdit() {
    const newName = document.getElementById('editItemName').value.trim();
    const newDueDate = document.getElementById('editItemDueDate').value;
    const newPaymentUrl = document.getElementById('editItemPaymentUrl').value.trim();
    const newReminderValue = document.getElementById('editItemReminderValue') ? document.getElementById('editItemReminderValue').value : '';
    const newReminderUnit = document.getElementById('editItemReminderUnit') ? document.getElementById('editItemReminderUnit').value : '';
    
    if (newName && currentEditIdx !== null) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.name = newName;
        item.dueDate = newDueDate;
        item.paymentUrl = newPaymentUrl;
        item.reminderValue = newReminderValue;
        item.reminderUnit = newReminderUnit;
        item.lastUpdated = Date.now();
        
        // שמירה מקומית תחילה
        db.lastActivePage = activePage;
        db.lastSync = Date.now();
        localStorage.setItem('BUDGET_FINAL_V28', JSON.stringify(db));
        
        // רינדור מיידי
        render();
        
        // עדכון תגי התראה
        if (typeof updateNotificationBadge === 'function') {
            updateNotificationBadge();
        }
        
        // סגירת המודל מיד לאחר רינדור
        closeModal('editItemNameModal');
        showNotification('✅ הפריט עודכן!');
        
        if (typeof checkUrgentPayments === 'function') {
            checkUrgentPayments();
        }
        
        // סנכרון לענן ברקע (אסינכרוני)
        if (isConnected && currentUser) {
            if (syncTimeout) clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                syncToCloud();
            }, 1500);
        }
    }
}

function saveItemName() {
    const newName = document.getElementById('editItemNameInput') ? document.getElementById('editItemNameInput').value.trim() : '';
    if (newName && currentEditIdx !== null) {
        db.lists[db.currentId].items[currentEditIdx].name = newName;
        save();
        showNotification('✓ השם עודכן בהצלחה');
    }
    closeModal('editItemNameModal');
}

function openEditCategoryModal(idx) {
    currentEditIdx = idx;
    const item = db.lists[db.currentId].items[idx];

    // Build category options
    const categoryOptionsContainer = document.getElementById('categoryOptions');
    categoryOptionsContainer.innerHTML = '';

    // Create buttons for default categories
    for (const categoryName in CATEGORIES) {
        const color = CATEGORIES[categoryName];
        const isSelected = item.category === categoryName;

        const button = document.createElement('button');
        button.className = `w-full py-3 px-4 rounded-xl font-bold mb-2 transition-all ${isSelected
            ? 'ring-4 ring-offset-2'
            : 'hover:scale-105'
            }`;
        button.style.backgroundColor = color + '20';
        button.style.color = color;
        button.style.border = `2px solid ${color}`;
        if (isSelected) {
            button.style.ringColor = color;
        }
        button.textContent = isSelected ? `✓ ${categoryName}` : categoryName;
        button.onclick = () => selectCategory(categoryName);

        categoryOptionsContainer.appendChild(button);
    }

    // Add custom categories if they exist
    if (db.customCategories && db.customCategories.length > 0) {
        // Add separator
        const separator = document.createElement('div');
        separator.className = 'text-sm font-bold text-gray-500 mt-3 mb-2';
        separator.textContent = '✨ קטגוריות מותאמות אישית';
        categoryOptionsContainer.appendChild(separator);

        db.customCategories.forEach(categoryName => {
            const color = CATEGORIES[categoryName] || '#6b7280';
            const isSelected = item.category === categoryName;

            const button = document.createElement('button');
            button.className = `w-full py-3 px-4 rounded-xl font-bold mb-2 transition-all ${isSelected
                ? 'ring-4 ring-offset-2'
                : 'hover:scale-105'
                }`;
            button.style.backgroundColor = color + '20';
            button.style.color = color;
            button.style.border = `2px solid ${color}`;
            if (isSelected) {
                button.style.ringColor = color;
            }
            button.textContent = isSelected ? `✓ ${categoryName}` : categoryName;
            button.onclick = () => selectCategory(categoryName);

            categoryOptionsContainer.appendChild(button);
        });
    }

    // Clear custom input
    document.getElementById('customCategoryInput').value = '';

    openModal('editCategoryModal');
}

function selectCategory(categoryName) {
    if (currentEditIdx !== null) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        item.category = categoryName;
        
        // Update category memory for this product
        if (!db.categoryMemory) db.categoryMemory = {};
        db.categoryMemory[item.name.toLowerCase().trim()] = categoryName;
        
        save();
        showNotification('✓ הקטגוריה עודכנה');
    }
    closeModal('editCategoryModal');
}

function saveCustomCategory() {
    const customCategory = document.getElementById('customCategoryInput').value.trim();
    if (customCategory && currentEditIdx !== null) {
        const item = db.lists[db.currentId].items[currentEditIdx];
        
        // Update item category
        item.category = customCategory;
        
        // Add to global custom categories if not already there
        if (!db.customCategories) db.customCategories = [];
        if (!db.customCategories.includes(customCategory)) {
            db.customCategories.push(customCategory);
        }
        
        // Update category memory for this product
        if (!db.categoryMemory) db.categoryMemory = {};
        db.categoryMemory[item.name.toLowerCase().trim()] = customCategory;
        
        // Add custom category to CATEGORIES object for color assignment if not exists
        if (!CATEGORIES[customCategory]) {
            // Assign a random color from existing palette or generate new
            const colors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#6366f1'];
            CATEGORIES[customCategory] = colors[db.customCategories.length % colors.length];
        }
        
        save();
        showNotification('✓ קטגוריה מותאמת נשמרה');
    }
    closeModal('editCategoryModal');
}

// ========== Category Manager Functions ==========
function openCategoryManager() {
    renderCustomCategoriesList();
    openModal('categoryManagerModal');
}

function renderCustomCategoriesList() {
    const container = document.getElementById('customCategoriesList');
    if (!container) return;

    container.innerHTML = '';

    if (!db.customCategories || db.customCategories.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין קטגוריות מותאמות אישית</p>';
        return;
    }

    db.customCategories.forEach((category, index) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center mb-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200';
        
        const color = CATEGORIES[category] || '#6b7280';
        
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded-full" style="background-color: ${color}"></div>
                <span class="font-bold text-gray-800">${category}</span>
            </div>
            <button onclick="openDeleteCategoryModal('${category.replace(/'/g, "\\'")}', ${index})" 
                class="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition">
                🗑️ מחק
            </button>
        `;
        container.appendChild(div);
    });
}

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

    // Use signInWithPopup and handle the promise correctly
    window.signInWithPopup(window.firebaseAuth, window.googleProvider)
        .then((result) => {
            console.log('✅ התחברות הצליחה!', result.user.email);
            showNotification('✅ התחברת בהצלחה!', 'success');
            currentUser = result.user;
            isConnected = true;
            updateCloudIndicator('connected');
            
            // Setup Firestore listener
            setupFirestoreListener(result.user);
        })
        .catch((error) => {
            console.error("❌ שגיאת התחברות:", error);
            console.error("❌ קוד שגיאה:", error.code);
            console.error("❌ הודעת שגיאה:", error.message);
            
            // Handle different error types
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('ℹ️ המשתמש סגר את חלון ההתחברות');
                showNotification('ℹ️ חלון ההתחברות נסגר', 'warning');
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.log('ℹ️ בקשת popup בוטלה');
                showNotification('ℹ️ ההתחברות בוטלה', 'warning');
            } else if (error.code === 'auth/popup-blocked') {
                console.log('⚠️ הדפדפן חסם את חלון ההתחברות');
                showNotification('⚠️ הדפדפן חסם את חלון ההתחברות. אנא אפשר חלונות קופצים עבור אתר זה', 'warning');
            } else {
                showDetailedError('Login', error);
            }
            
            updateCloudIndicator('disconnected');
        });
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

function mergeCloudWithLocal(cloudData, localData) {
    console.log('🔄 מבצע מיזוג חכם בין ענן למקומי...');

    const merged = JSON.parse(JSON.stringify(cloudData)); // עותק עמוק של נתוני הענן

    // Normalize all items in cloud data - ensure all fields exist
    Object.keys(merged.lists || {}).forEach(listId => {
        if (merged.lists[listId].items) {
            merged.lists[listId].items = merged.lists[listId].items.map(item => {
                return {
                    name: item.name || '',
                    price: item.price || 0,
                    qty: item.qty || 1,
                    checked: item.checked || false,
                    category: item.category || 'אחר',
                    note: item.note || '',
                    dueDate: item.dueDate || '',
                    paymentUrl: item.paymentUrl || '', // Ensure paymentUrl always exists
                    isPaid: item.isPaid || false,
                    lastUpdated: item.lastUpdated || Date.now(),
                    cloudId: item.cloudId || 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };
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
                const normalizedItem = {
                    name: localItem.name || '',
                    price: localItem.price || 0,
                    qty: localItem.qty || 1,
                    checked: localItem.checked || false,
                    category: localItem.category || 'אחר',
                    note: localItem.note || '',
                    dueDate: localItem.dueDate || '',
                    paymentUrl: localItem.paymentUrl || '',
                    isPaid: localItem.isPaid || false,
                    lastUpdated: localItem.lastUpdated || Date.now(),
                    cloudId: localItem.cloudId
                };
                merged.lists[listId].items.push(normalizedItem);
                console.log('➕ מוסיף פריט חדש מקומי ללא cloudId:', localItem.name);
            } else if (!cloudItemsMap[localItem.cloudId]) {
                // פריט עם cloudId שלא קיים בענן - זה פריט חדש שנוסף באופליין
                const normalizedItem = {
                    name: localItem.name || '',
                    price: localItem.price || 0,
                    qty: localItem.qty || 1,
                    checked: localItem.checked || false,
                    category: localItem.category || 'אחר',
                    note: localItem.note || '',
                    dueDate: localItem.dueDate || '',
                    paymentUrl: localItem.paymentUrl || '',
                    isPaid: localItem.isPaid || false,
                    lastUpdated: localItem.lastUpdated || Date.now(),
                    cloudId: localItem.cloudId
                };
                merged.lists[listId].items.push(normalizedItem);
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
                merged.lists[listId].items = merged.lists[listId].items.map(item => ({
                    name: item.name || '',
                    price: item.price || 0,
                    qty: item.qty || 1,
                    checked: item.checked || false,
                    category: item.category || 'אחר',
                    note: item.note || '',
                    dueDate: item.dueDate || '',
                    paymentUrl: item.paymentUrl || '',
                    isPaid: item.isPaid || false,
                    lastUpdated: item.lastUpdated || Date.now(),
                    cloudId: item.cloudId || 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                }));
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
function checkUrgentPayments() {
    const list = db.lists[db.currentId];
    if (!list || !list.items) return;

    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgentItems = list.items.filter(item => {
        if (!item.dueDate || item.isPaid || item.checked) return false;
        
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // בדוק אם התאריך עבר
        const isOverdue = dueDate <= today;
        
        // בדוק אם יש להתריע לפי reminderValue ו-reminderUnit
        if (item.reminderValue && item.reminderUnit) {
            const reminderTimeMs = getReminderMilliseconds(item.reminderValue, item.reminderUnit);
            const dueDateMs = dueDate.getTime();
            const reminderDate = new Date(dueDateMs - reminderTimeMs);
            
            const isReminderTime = now >= reminderDate.getTime() && now <= dueDateMs + (24 * 60 * 60 * 1000);
            return isOverdue || isReminderTime;
        }
        
        return isOverdue;
    });

    // Update app badge
    updateAppBadge(urgentItems.length);

    // Check if modal should be shown
    if (urgentItems.length > 0) {
        const shouldShowModal = checkSnoozeStatus();
        if (shouldShowModal) {
            showUrgentAlertModal(urgentItems);
        }
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

// Check snooze status to determine if modal should show
function checkSnoozeStatus() {
    // Check session storage first (user clicked Close this session)
    if (sessionStorage.getItem('urgentAlertClosed')) {
        return false;
    }

    // Check localStorage for snooze timestamps
    const snooze4h = localStorage.getItem('urgentSnooze4h');
    const snoozeTomorrow = localStorage.getItem('urgentSnoozeTomorrow');

    const now = Date.now();

    if (snooze4h && now < parseInt(snooze4h)) {
        return false;
    }

    if (snoozeTomorrow && now < parseInt(snoozeTomorrow)) {
        return false;
    }

    return true;
}

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
            itemsHTML += `
                <div class="urgent-item" style="border-right: 3px solid #ef4444;">
                    <div class="urgent-item-name">${item.name}</div>
                    <div class="urgent-item-date">📅 תאריך יעד: ${formattedDate}</div>
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
            
            itemsHTML += `
                <div class="urgent-item" style="border-right: 3px solid #3b82f6;">
                    <div class="urgent-item-name">${item.name}</div>
                    <div class="urgent-item-date">📅 תאריך יעד: ${formattedDate} (${daysText})${reminderText}</div>
                </div>
            `;
        });
    }

    itemsList.innerHTML = itemsHTML;
    modal.classList.add('active');
}

// Snooze urgent alert for specified hours
function snoozeUrgentAlert(hours) {
    const snoozeUntil = Date.now() + (hours * 60 * 60 * 1000);
    
    if (hours === 4) {
        localStorage.setItem('urgentSnooze4h', snoozeUntil.toString());
    } else if (hours === 24) {
        localStorage.setItem('urgentSnoozeTomorrow', snoozeUntil.toString());
    }

    closeModal('urgentAlertModal');
}

// Close urgent alert (session-based)
function closeUrgentAlert() {
    sessionStorage.setItem('urgentAlertClosed', 'true');
    closeModal('urgentAlertModal');
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
    // Check urgent payments after a short delay to ensure data is loaded
    setTimeout(() => {
        checkUrgentPayments();
    }, 1000);
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
function getNotificationItems() {
    const notificationItems = [];
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    Object.keys(db.lists).forEach(listId => {
        const list = db.lists[listId];
        list.items.forEach((item, idx) => {
            if (item.dueDate && !item.checked && !item.isPaid) {
                const dueDate = new Date(item.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                
                // חישוב זמן ההתראה לפי reminderValue ו-reminderUnit
                let reminderTimeMs = 0;
                if (item.reminderValue && item.reminderUnit) {
                    reminderTimeMs = getReminderMilliseconds(item.reminderValue, item.reminderUnit);
                }
                
                const dueDateMs = dueDate.getTime();
                const reminderDate = new Date(dueDateMs - reminderTimeMs);
                
                const isOverdue = dueDate < today;
                const isReminderTime = reminderTimeMs > 0 && now >= reminderDate.getTime() && now <= dueDateMs + (24 * 60 * 60 * 1000);
                const shouldNotify = isOverdue || isReminderTime;
                
                if (shouldNotify || dueDate <= threeDaysFromNow) {
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
    
    if (notificationItems.length > 0) {
        badge.textContent = notificationItems.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function openNotificationCenter() {
    const notificationItems = getNotificationItems();
    const container = document.getElementById('notificationsList');
    
    if (notificationItems.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">אין התראות כרגע 🎉</p>';
    } else {
        container.innerHTML = '';
        notificationItems.forEach(notif => {
            const div = document.createElement('div');
            
            // קביעת סוג ההתראה וצבע
            let notifClass = 'soon';
            if (notif.isOverdue) {
                notifClass = 'overdue';
            } else if (notif.isUpcoming && !notif.isToday) {
                notifClass = 'upcoming';
            }
            
            div.className = `notification-item ${notifClass}`;
            div.onclick = () => jumpToItem(notif.listId, notif.itemIdx);
            
            let dateText = '';
            if (notif.isOverdue) {
                const daysOverdue = Math.floor((new Date().setHours(0,0,0,0) - notif.dueDate) / 86400000);
                dateText = `⚠️ איחור ${daysOverdue} ${daysOverdue === 1 ? 'יום' : 'ימים'}`;
            } else if (notif.isToday) {
                dateText = '📅 היום!';
            } else if (notif.isTomorrow) {
                dateText = '📅 מחר';
            } else {
                const daysUntil = Math.floor((notif.dueDate - new Date().setHours(0,0,0,0)) / 86400000);
                if (notif.isUpcoming && notif.reminderValue && notif.reminderUnit) {
                    const reminderText = formatReminderText(notif.reminderValue, notif.reminderUnit);
                    dateText = `🔔 תזכורת ${reminderText} לפני - תאריך יעד בעוד ${daysUntil} ${daysUntil === 1 ? 'יום' : 'ימים'}`;
                } else {
                    dateText = `📅 בעוד ${daysUntil} ${daysUntil === 1 ? 'יום' : 'ימים'}`;
                }
            }
            
            div.innerHTML = `
                <div class="notification-item-title">${notif.item.name}</div>
                <div class="notification-item-date">${dateText}</div>
                <div class="notification-item-list">רשימה: ${notif.listName}</div>
            `;
            container.appendChild(div);
        });
    }
    
    openModal('notificationCenterModal');
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
        // Check if Clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            console.log('Clipboard API not available');
            return;
        }

        // Read clipboard text
        const clipboardText = await navigator.clipboard.readText();
        
        if (!clipboardText || clipboardText.trim() === '') {
            console.log('Clipboard is empty');
            return;
        }

        console.log('Clipboard text found, length:', clipboardText.length);

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
            console.log('New clipboard text detected!');
            clipboardState.lastClipboardText = clipboardText;
            clipboardState.clipboardDismissed = false;
            clipboardState.clipboardImported = false;
            localStorage.setItem('clipboardState', JSON.stringify(clipboardState));
        }

        // Show import modal
        showClipboardImportModal(clipboardText);

    } catch (error) {
        console.log('Clipboard access error:', error);
        // Clipboard access denied or not available - silently fail
    }
}

// Show clipboard import modal
function showClipboardImportModal(text) {
    const modal = document.getElementById('clipboardImportModal');
    const textarea = document.getElementById('clipboardImportText');
    const detectedTypeDiv = document.getElementById('clipboardDetectedType');
    const detectedTypeName = document.getElementById('detectedTypeName');

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
        qty: 1,
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
            qty: 1,
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
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const items = [];
    
    lines.forEach(line => {
        if (!line) return;
        
        items.push({
            name: line,
            price: 0,
            qty: 1,
            checked: false,
            category: 'אחר',
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
        if (typeof checkUrgentPayments === 'function') {
            checkUrgentPayments();
        }
        
        // Check clipboard on startup
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





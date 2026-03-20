// ============================================================
//  constants.js  —  נתונים סטטיים בלבד (ללא לוגיקה)
//  מיובא על-ידי: store.js, services.js, importers.js, ui.js, app.js
// ============================================================

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
        'șnițel', 'friptură', 'antricot', 'ficat', 'inimă', 'pastramă', 'salam', 'aripioare',
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
        'снэк', 'чипсы', 'читос', 'тортилья', 'попкорн', 'арахис', 'орехи',
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
        'שואב', 'שקיות אשפה', 'אשפה', 'סמרטוט', 'דלי', 'מנקה', 'מנקים',
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

// ========== Translations (i18n) ==========
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
        translateBtn: '🌐 תרגם', scanReceiptTitle: 'סריקת קבלה', scanReceiptDesc: 'העלה תמונת קבלה לזיהוי אוטומטי של מוצרים',
        selectImage: 'בחר תמונה', scan: 'סרוק',
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
        translateBtn: '🌐 Translate', scanReceiptTitle: 'Scan Receipt', scanReceiptDesc: 'Upload receipt image for automatic product detection',
        selectImage: 'Select Image', scan: 'Scan',
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
        translateBtn: '🌐 Перевести', scanReceiptTitle: 'Сканирование Чека', scanReceiptDesc: 'Загрузите фото чека для автоматического распознавания товаров',
        selectImage: 'Выбрать Изображение', scan: 'Сканировать',
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
        translateBtn: '🌐 Traduce', scanReceiptTitle: 'Scanare Bon', scanReceiptDesc: 'Încărcați imaginea bonului pentru detectarea automată a produselor',
        selectImage: 'Selectează Imagine', scan: 'Scanează',
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

// ========== Demo Data ==========
const DEMO_DATA = {
    currentId: 'demo_L1',
    selectedInSummary: [],
    lastActivePage: 'lists',
    lastSync: 0,
    stats: { totalSpent: 0, listsCompleted: 0, monthlyData: {} },
    customCategories: [],
    categoryMemory: {},
    history: [],
    templates: [],
    lists: {
        'demo_L1': { name:'תורים', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'רופא משפחה — ד״ר כהן',   price:0,   qty:1, checked:true,  category:'רפואה',  note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'דנטיסט — טיפול שורש',     price:800, qty:1, checked:false, category:'רפואה',  note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'בדיקת עיניים',            price:0,   qty:1, checked:false, category:'רפואה',  note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'בדיקות דם — קופת חולים', price:0,   qty:1, checked:true,  category:'רפואה',  note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'רופא עור — מרפאה פרטית', price:350, qty:1, checked:false, category:'רפואה',  note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L2': { name:'בנק', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'העברת שכר דירה',   price:2000, qty:1, checked:true,  category:'תשלומים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'עמלת ניהול חשבון', price:25,   qty:1, checked:true,  category:'תשלומים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'תשלום הלוואה',     price:1200, qty:1, checked:false, category:'תשלומים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'פתיחת חיסכון',     price:500,  qty:1, checked:false, category:'חיסכון',  note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'ביטוח חיים',       price:180,  qty:1, checked:false, category:'ביטוח',   note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L3': { name:'כרטיס אשראי', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'חיוב Max — חודשי',     price:2340, qty:1, checked:false, category:'תשלומים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חיוב Cal — חודשי',     price:1890, qty:1, checked:false, category:'תשלומים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'ביטול מנוי Netflix',   price:60,   qty:1, checked:true,  category:'מנויים',  note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'בדיקת חיובים חריגים', price:0,    qty:1, checked:true,  category:'אחר',     note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'תשלום יתרה ישנה',      price:580,  qty:1, checked:false, category:'תשלומים', note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L4': { name:'ציוד לבית הספר', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'מחברות × 10',        price:80,  qty:1, checked:true,  category:'ציוד', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'עפרונות וצבעים',     price:45,  qty:1, checked:true,  category:'ציוד', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'תיק גב חדש',         price:280, qty:1, checked:false, category:'ציוד', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'מחשבון מדעי',        price:120, qty:1, checked:false, category:'ציוד', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'סרגל וסט מתמטיקה',  price:35,  qty:1, checked:false, category:'ציוד', note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L5': { name:'קניות', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'לחם ומאפים',         price:35,  qty:1, checked:true,  category:'מזון', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חלב וגבינות',        price:60,  qty:1, checked:true,  category:'מזון', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'ביצים × 30',         price:28,  qty:1, checked:false, category:'מזון', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חזה עוף × 2 ק״ג',   price:85,  qty:1, checked:false, category:'בשר', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'ירקות ופירות',       price:120, qty:1, checked:false, category:'מזון', note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L6': { name:'תשלומים שונים', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'ארנונה — רבעון',   price:890, qty:1, checked:false, category:'חשבונות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'מים — דו-חודשי',   price:280, qty:1, checked:false, category:'חשבונות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חשמל — חודשי',     price:420, qty:1, checked:true,  category:'חשבונות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'גז — מילוי',       price:160, qty:1, checked:true,  category:'חשבונות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'ועד בית — חודשי',  price:700, qty:1, checked:false, category:'חשבונות', note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L7': { name:'ספורט', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'נעלי ריצה Nike',     price:480, qty:1, checked:false, category:'ביגוד',      note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חולצות ספורט × 3',  price:180, qty:1, checked:true,  category:'ביגוד',      note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'מנוי חדר כושר',     price:280, qty:1, checked:false, category:'מנויים',     note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'בקבוק מים 1L',      price:60,  qty:1, checked:true,  category:'ציוד',       note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'אוזניות אלחוטיות',  price:350, qty:1, checked:false, category:'אלקטרוניקה', note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L8': { name:'תרופות', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'ויטמין D3 — 3 חודשים', price:65,  qty:1, checked:true,  category:'רפואה', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'אומגה 3',              price:90,  qty:1, checked:false, category:'רפואה', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'מרשם רופא — לאיסוף',  price:0,   qty:1, checked:false, category:'רפואה', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'קרם לעור — מרשם',     price:120, qty:1, checked:false, category:'רפואה', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'תרסיס לאלרגיה',       price:45,  qty:1, checked:true,  category:'רפואה', note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L9': { name:'תיקונים בבית', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'אינסטלטור — דליפה',  price:450, qty:1, checked:true,  category:'תיקונים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חשמלאי — שקע חדש',  price:380, qty:1, checked:false, category:'תיקונים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'צבע לסלון',          price:800, qty:1, checked:false, category:'צביעה',   note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'החלפת מנעול דלת',   price:320, qty:1, checked:false, category:'תיקונים', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'וילונות לסלון',     price:850, qty:1, checked:false, category:'ריהוט',   note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
        'demo_L10': { name:'מתנות', url:'', budget:0, isTemplate:false, isDemo:true, items:[
            {name:'יום הולדת אמא — ספא',  price:400, qty:1, checked:false, category:'מתנות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חתונה — מתנה משותפת',  price:500, qty:1, checked:true,  category:'מתנות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'בר מצווה — שי',         price:300, qty:1, checked:false, category:'מתנות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'חנוכת בית — כלי בית',  price:250, qty:1, checked:false, category:'מתנות', note:'', dueDate:'', dueTime:'', isPaid:false},
            {name:'תינוק חדש — בגדים',    price:200, qty:1, checked:false, category:'מתנות', note:'', dueDate:'', dueTime:'', isPaid:false},
        ]},
    }
};

const DEMO_NOTIFICATIONS = [
    {id:'demo_n1', itemName:'תור לרופא משפחה',        listName:'תורים',           title:'תזכורת: תור לרופא משפחה',    body:'מחר בשעה 09:30',             isDemo:true, timestamp:Date.now()-3600000},
    {id:'demo_n2', itemName:'חיוב כרטיס Max',          listName:'כרטיס אשראי',    title:'תזכורת: חיוב Max',            body:'2,340 בעוד 5 ימים',           isDemo:true, timestamp:Date.now()-7200000},
    {id:'demo_n3', itemName:'תשלום ארנונה',            listName:'תשלומים שונים',  title:'תזכורת: ארנונה',              body:'890 עד סוף החודש',            isDemo:true, timestamp:Date.now()-10800000},
    {id:'demo_n4', itemName:'ציוד לבית הספר',          listName:'ציוד לבית הספר', title:'תזכורת: ציוד לבית הספר',     body:'בעוד 12 ימים — התחלת שנה"ל', isDemo:true, timestamp:Date.now()-14400000},
    {id:'demo_n5', itemName:'תשלום הלוואה לבנק',       listName:'בנק',             title:'תזכורת: הלוואה לבנק',         body:'1,200 ב-1 לחודש',             isDemo:true, timestamp:Date.now()-18000000},
];

// ========== Bank / Credit Config ==========
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

const CREDIT_NAMES = {
    max: 'Max', visaCal: 'Cal', leumincard: 'לאומי קארד', isracard: 'ישראכרט'
};

// ========== Wizard (WIZ) — טקסטים סטטיים ==========
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

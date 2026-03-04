/**
 * Firebase Cloud Functions for VPlus Push Notifications
 * שולח התראות push לפי nextAlertTime בלבד.
 * 
 * כלל זהב: Cloud Function לא כותבת alertDismissedAt לעולם.
 * המשתמש שולט על snooze/dismiss דרך האפליקציה בלבד.
 * 
 * הלוגיקה:
 *   אם item.nextAlertTime קיים ומגיע כרגע (±60 שניות) ו-alertDismissedAt < nextAlertTime → שלח push
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// ─── sendScheduledReminders: רץ כל דקה דרך Cloud Scheduler ─────────────────
exports.sendScheduledReminders = functions.https.onRequest(async (req, res) => {
    console.log('⏰ בודק תזכורות...');

    const now = new Date();
    const nowMs = now.getTime();

    // חלון זמן: ±60 שניות מהדקה הנוכחית
    const windowStart = nowMs - 60000;
    const windowEnd   = nowMs + 60000;

    try {
        // משוך FCM tokens
        const usersSnap = await admin.firestore()
            .collection('users')
            .where('fcmToken', '!=', null)
            .get();

        if (usersSnap.empty) {
            console.log('אין משתמשים עם FCM tokens');
            return res.status(200).send('OK - no users');
        }

        const userTokens = {};
        usersSnap.forEach(doc => { userTokens[doc.id] = doc.data().fcmToken; });

        // עבור על רשימות הקניות
        const listsSnap = await admin.firestore().collection('shopping_lists').get();

        const sendPromises = [];

        listsSnap.forEach(doc => {
            const userId = doc.id;
            const token  = userTokens[userId];
            if (!token) return;

            const data = doc.data();
            if (!data.lists) return;

            Object.values(data.lists).forEach(list => {
                if (!list.items || !Array.isArray(list.items)) return;

                list.items.forEach(item => {
                    if (item.checked || item.isPaid) return;
                    if (!item.dueDate || !item.reminderValue || !item.reminderUnit) return;
                    if (!item.nextAlertTime) return;

                    const t = item.nextAlertTime;

                    // בדוק אם הגיע הזמן (חלון ±60 שניות)
                    if (t < windowStart || t > windowEnd) return;

                    // בדוק אם כבר dismissed עבור זמן זה
                    if (item.alertDismissedAt && item.alertDismissedAt >= t) {
                        console.log(`🔕 כבר dismissed: "${item.name}"`);
                        return;
                    }

                    console.log(`🔔 שולח push: "${item.name}" (nextAlertTime: ${new Date(t).toISOString()})`);

                    const dateStr = new Date(item.dueDate).toLocaleDateString('he-IL');
                    const timeStr = item.dueTime ? ` בשעה ${item.dueTime}` : '';

                    sendPromises.push(
                        sendPush(token, {
                            title: `⏰ תזכורת: ${item.name}`,
                            body:  `יעד: ${dateStr}${timeStr}`,
                            data: {
                                type:     'reminder',
                                itemName: item.name,
                                dueDate:  item.dueDate,
                                dueTime:  item.dueTime || '',
                                userId
                            }
                        })
                    );
                });
            });
        });

        if (sendPromises.length === 0) {
            console.log('אין תזכורות לשלוח');
        } else {
            await Promise.all(sendPromises);
            console.log(`נשלחו ${sendPromises.length} תזכורות`);
        }

        return res.status(200).send('OK');

    } catch (err) {
        console.error('שגיאה:', err);
        return res.status(500).send('Error: ' + err.message);
    }
});

// ─── testNotification ─────────────────────────────────────────────────────────
exports.testNotification = functions.https.onRequest(async (req, res) => {
    try {
        const snap = await admin.firestore()
            .collection('users')
            .where('fcmToken', '!=', null)
            .limit(1)
            .get();

        if (snap.empty) {
            return res.status(404).send('אין משתמשים עם FCM token');
        }

        const token = snap.docs[0].data().fcmToken;
        await sendPush(token, {
            title: '🧪 בדיקה',
            body:  'VPlus - התראת בדיקה',
            data:  { type: 'test' }
        });

        return res.status(200).send('נשלח');
    } catch (err) {
        return res.status(500).send('Error: ' + err.message);
    }
});

// ─── sendPush: שולח FCM לtoken יחיד ─────────────────────────────────────────
async function sendPush(token, { title, body, data }) {
    const message = {
        notification: { title, body },
        data: data || {},
        webpush: {
            notification: {
                icon:              '/icon-96.png',
                badge:             '/icon-96.png',
                vibrate:           [300, 100, 300, 100, 300],
                requireInteraction: true,
                renotify:          true,
                // כפתורי snooze מובנים בהתראה
                actions: [
                    { action: 'snooze-10', title: '⏰ דחה 10 דק׳' },
                    { action: 'snooze-60', title: '⏰ דחה שעה'    }
                ]
            },
            fcmOptions: { link: 'https://vplus-pro.web.app' }
        },
        token
    };

    try {
        const result = await admin.messaging().send(message);
        console.log(`✅ נשלח: ${result}`);
    } catch (err) {
        console.error(`❌ שגיאה בשליחה:`, err.code, err.message);
        if (err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token') {
            await cleanToken(token);
        }
    }
}

// ─── cleanToken: מנקה token לא תקף ──────────────────────────────────────────
async function cleanToken(token) {
    const snap = await admin.firestore()
        .collection('users')
        .where('fcmToken', '==', token)
        .limit(1)
        .get();
    if (!snap.empty) {
        await snap.docs[0].ref.update({ fcmToken: admin.firestore.FieldValue.delete() });
        console.log('🧹 Token נוקה');
    }
}
// ─── fetchBankData: סנכרון בנקאי (Gen 1 onCall + dynamic ESM import) ──────────
exports.fetchBankData = functions
    .runWith({
        memory: '2GB',
        timeoutSeconds: 300,
    })
    .region('europe-west1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'המשתמש לא מחובר');
        }

        const { companyId, username, password } = data;

        if (!companyId || !username || !password) {
            throw new functions.https.HttpsError('invalid-argument', 'חסרים שדות: companyId, username, password');
        }

        // Dynamic import — israeli-bank-scrapers is ESM-only
        let createScraper, chromium;
        try {
            ({ createScraper } = await import('israeli-bank-scrapers'));
            chromium           = await import('@sparticuz/chromium');
        } catch (importErr) {
            console.error('🔴 Failed to import scrapers:', importErr.message);
            throw new functions.https.HttpsError('internal', 'שגיאה בטעינת מודול הסריקה: ' + importErr.message);
        }

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        let executablePath;
        try {
            executablePath = await chromium.default.executablePath();
        } catch (chromiumErr) {
            console.error('🔴 Chromium error:', chromiumErr.message);
            throw new functions.https.HttpsError('internal', 'שגיאה בטעינת Chromium: ' + chromiumErr.message);
        }

        const scraper = createScraper({
            companyId,
            startDate,
            combineInstallments: false,
            executablePath,
            args:     chromium.default.args,
            headless: chromium.default.headless,
        });

        console.log('🏦 Starting scrape for:', companyId);
        let scrapeResult;
        try {
            scrapeResult = await scraper.scrape({ username, password });
        } catch (scrapeErr) {
            console.error('🔴 scraper.scrape() threw:', scrapeErr.message);
            throw new functions.https.HttpsError('internal', 'שגיאת סריקה: ' + scrapeErr.message);
        }

        console.log('🏦 Scrape result success:', scrapeResult.success);
        console.log('🏦 Scrape errorType:', scrapeResult.errorType);
        console.log('🏦 Scrape accounts count:', scrapeResult.accounts?.length);

        if (!scrapeResult.success) {
            console.error('🔴 Scrape failed with errorType:', scrapeResult.errorType);
            const errorMap = {
                'InvalidPassword':    ['permission-denied',   'שם משתמש או סיסמה שגויים'],
                'ChangePassword':     ['permission-denied',   'נדרש לשנות סיסמה באתר הבנק'],
                'AccountBlocked':     ['permission-denied',   'החשבון חסום — פנה לבנק'],
                'TwoFactorRetrieval': ['failed-precondition', 'נדרש קוד אימות דו-שלבי'],
                'Timeout':            ['deadline-exceeded',   'פסק הזמן חלף — נסה שוב'],
                'SessionExpired':     ['unauthenticated',     'הפעלה פגה — נסה שוב'],
                'Generic':            ['internal',            'שגיאה כללית בסריקה — נסה שוב מאוחר יותר'],
            };
            const [code, msg] = errorMap[scrapeResult.errorType] || ['internal', `שגיאה: ${scrapeResult.errorType}`];
            throw new functions.https.HttpsError(code, msg);
        }

        return scrapeResult.accounts;
    });
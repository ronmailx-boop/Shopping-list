/**
 * VPlus Bank Scraper — רץ דרך GitHub Actions
 * 
 * קורא credentials מ-env vars, מריץ israeli-bank-scrapers,
 * שומר תוצאות ב-Firestore תחת: bankSync/{userId}/jobs/{jobId}
 */

import { createScraper } from 'israeli-bank-scrapers';
import admin from 'firebase-admin';

// ── אתחול Firebase Admin ──────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── קריאת פרמטרים מ-env ──────────────────────────────────────────
const userId    = process.env.USER_ID;
const companyId = process.env.COMPANY_ID;
const jobId     = process.env.JOB_ID || `job_${Date.now()}`;

if (!userId || !companyId) {
    console.error('❌ חסרים USER_ID או COMPANY_ID');
    process.exit(1);
}

// בנה credentials לפי החברה
const credentials = buildCredentials(companyId);
console.log(`🏦 מתחיל סריקה: ${companyId} עבור משתמש ${userId}`);
console.log(`🔑 שדות credentials: ${Object.keys(credentials).join(', ')}`);

// ── עדכן סטטוס "מתחיל" ב-Firestore ──────────────────────────────
const jobRef = db.collection('bankSync').doc(userId).collection('jobs').doc(jobId);
await jobRef.set({
    status:    'running',
    companyId,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    jobId,
});
console.log(`📝 סטטוס "running" נשמר ב-Firestore`);

// ── הרץ את הסריקה ────────────────────────────────────────────────
try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2); // חודשיים אחורה

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    const scraperOptions = {
        companyId,
        startDate,
        combineInstallments: false,
        showBrowser: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    };
    if (executablePath) scraperOptions.executablePath = executablePath;

    const scraper = createScraper(scraperOptions);

    console.log(`⏳ מתחבר ל-${companyId}...`);
    const result = await scraper.scrape(credentials);

    if (!result.success) {
        console.error(`❌ סריקה נכשלה: ${result.errorType} — ${result.errorMessage}`);
        await jobRef.update({
            status:      'error',
            errorType:   result.errorType,
            errorMessage: result.errorMessage || 'שגיאה לא ידועה',
            finishedAt:  admin.firestore.FieldValue.serverTimestamp(),
        });
        process.exit(1);
    }

    // ── עבד תוצאות ───────────────────────────────────────────────
    const accounts = result.accounts || [];
    let totalTxns = 0;
    const processedAccounts = accounts.map(acc => {
        const txns = (acc.txns || []).map(t => ({
            date:        t.date,
            description: t.description || t.memo || '',
            amount:      t.chargedAmount ?? t.originalAmount ?? 0,
            type:        t.type || 'normal',
            status:      t.status || 'completed',
            category:    '',
        }));
        totalTxns += txns.length;
        return {
            accountNumber: acc.accountNumber || '',
            balance:       acc.balance ?? null,
            txns,
        };
    });

    console.log(`✅ סריקה הצליחה! ${accounts.length} חשבונות, ${totalTxns} עסקאות`);

    // ── שמור ב-Firestore ──────────────────────────────────────────
    await jobRef.update({
        status:     'done',
        accounts:   processedAccounts,
        totalTxns,
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // עדכן גם את lastSync
    await db.collection('bankSync').doc(userId).set({
        lastSync:   admin.firestore.FieldValue.serverTimestamp(),
        lastJobId:  jobId,
        companyId,
    }, { merge: true });

    console.log(`💾 תוצאות נשמרו ב-Firestore`);
    process.exit(0);

} catch (err) {
    console.error(`💥 שגיאה לא צפויה: ${err.message}`);
    await jobRef.update({
        status:      'error',
        errorType:   'Generic',
        errorMessage: err.message,
        finishedAt:  admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
    process.exit(1);
}

// ── בנה credentials לפי סוג החברה ───────────────────────────────
function buildCredentials(company) {
    const password = process.env.PASSWORD;
    const username = process.env.USERNAME;
    const userCode = process.env.USER_CODE;
    const id       = process.env.ID_NUMBER;
    const num      = process.env.BRANCH_NUMBER;

    switch (company) {
        case 'hapoalim':
            return { userCode: userCode || username, password };
        case 'leumi':
            return { username, password };
        case 'discount':
            return { id, password, num };
        case 'mizrahi':
        case 'otsarHahayal':
        case 'yahav':
        case 'massad':
        case 'unionBank':
        case 'beinleumi':
            return { username, password };
        // חברות אשראי
        case 'max':
        case 'visaCal':
        case 'leumincard':
        case 'isracard':
            return { username, password };
        default:
            return { username, password };
    }
}

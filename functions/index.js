/**
 * Firebase Cloud Functions for VPlus Push Notifications
 * שולח התראות push כשיש שינויים ברשימת קניות
 * + שולח תזכורות מתוזמנות לפי dueDate/dueTime
 * + תומך ב-nextAlertTime לדחיית התראות (snooze)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ─────────────────────────────────────────────
// פונקציה 2: תזכורות מתוזמנות - רצה כל דקה
// ─────────────────────────────────────────────
exports.sendScheduledReminders = functions.https.onRequest(async (req, res) => {
    console.log('⏰ בודק תזכורות מתוזמנות...');
    
    const now = new Date();
    const nowMs = now.getTime();
    
    // עיגול לדקה הנוכחית (לבדיקת זמן טבעי)
    const nowMinute = new Date(now);
    nowMinute.setSeconds(0, 0);
    
    console.log('🕐 זמן שרת (UTC):', now.toISOString());
    
    try {
      // קבל את כל המשתמשים עם FCM token
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('fcmToken', '!=', null)
        .get();
      
      if (usersSnapshot.empty) {
        console.log('⚠️ אין משתמשים עם FCM tokens');
        return res.status(200).send('אין משתמשים עם FCM tokens');
      }
      
      // בנה map של userId -> fcmToken
      const userTokens = {};
      usersSnapshot.forEach(doc => {
        userTokens[doc.id] = doc.data().fcmToken;
      });
      
      // עבור על כל המשתמשים ובדוק תזכורות
      const shoppingListsSnapshot = await admin.firestore()
        .collection('shopping_lists')
        .get();
      
      const reminderPromises = [];
      // מעקב אחר פריטים שצריך לאפס את nextAlertTime שלהם לאחר שליחה
      const firestoreUpdates = [];
      
      shoppingListsSnapshot.forEach(doc => {
        const userId = doc.id;
        const token = userTokens[userId];
        
        if (!token) return;
        
        const data = doc.data();
        if (!data.lists) return;
        
        let docNeedsUpdate = false;
        const updatedLists = JSON.parse(JSON.stringify(data.lists)); // deep copy

        Object.entries(updatedLists).forEach(([listId, list]) => {
          if (!list.items || !Array.isArray(list.items)) return;
          
          list.items.forEach((item, itemIdx) => {
            if (item.checked) return;
            if (!item.dueDate || !item.reminderValue || !item.reminderUnit) return;

            // ─── קביעת זמן ההתראה ───
            let shouldFire = false;
            let alertTimeMs = null;

            if (item.nextAlertTime) {
              // יש nextAlertTime — זה snooze או זמן מתוזמן מהאפליקציה
              alertTimeMs = item.nextAlertTime;
              const diff = Math.abs(alertTimeMs - nowMs);
              if (diff < 60000) {
                // הגיע הזמן
                shouldFire = true;
                console.log(`🔔 [nextAlertTime] תזכורת! פריט: "${item.name}" | זמן: ${new Date(alertTimeMs).toISOString()}`);
                // אפס nextAlertTime לאחר שליחה
                updatedLists[listId].items[itemIdx].nextAlertTime = null;
                updatedLists[listId].items[itemIdx].alertDismissedAt = null;
                docNeedsUpdate = true;
              }
            } else {
              // אין nextAlertTime — חשב מ-dueDate כרגיל
              const timeStr = item.dueTime || '09:00';
              const dueDateObj = new Date(item.dueDate + 'T' + timeStr + ':00+02:00');
              
              const reminderMs = getReminderMilliseconds(
                parseInt(item.reminderValue),
                item.reminderUnit
              );
              
              const reminderTime = new Date(dueDateObj.getTime() - reminderMs);
              reminderTime.setSeconds(0, 0);
              
              console.log(`📋 [natural] פריט: "${item.name}" | זמן תזכורת: ${reminderTime.toISOString()}`);
              
              const diff = Math.abs(reminderTime.getTime() - nowMinute.getTime());
              if (diff < 60000) {
                shouldFire = true;
                alertTimeMs = reminderTime.getTime();
                console.log(`🔔 [natural] תזכורת! פריט: "${item.name}"`);
                // סנכרן nextAlertTime כדי שהאפליקציה תדע שהתראה נשלחה
                updatedLists[listId].items[itemIdx].nextAlertTime = alertTimeMs;
                docNeedsUpdate = true;
              }
            }

            if (shouldFire) {
              const timeText = item.dueTime || '09:00';
              const dateText = new Date(item.dueDate).toLocaleDateString('he-IL');
              
              reminderPromises.push(
                sendFCMToTokens([token], {
                  title: `⏰ תזכורת: ${item.name}`,
                  body: `${item.reminderValue} ${formatUnit(item.reminderUnit)} לפני המועד (${dateText} ${timeText})`,
                  data: {
                    type: 'reminder',
                    itemName: item.name,
                    dueDate: item.dueDate,
                    dueTime: item.dueTime || '',
                    userId: userId
                  }
                })
              );
            }
          });
        });

        // שמור שינויים ב-Firestore אם יש
        if (docNeedsUpdate) {
          firestoreUpdates.push(
            doc.ref.update({ lists: updatedLists })
              .then(() => console.log(`✅ עודכן nextAlertTime עבור משתמש: ${userId}`))
              .catch(err => console.error(`❌ שגיאה בעדכון Firestore:`, err))
          );
        }
      });
      
      if (reminderPromises.length === 0) {
        console.log('✅ אין תזכורות לשלוח כרגע');
      } else {
        await Promise.all([...reminderPromises, ...firestoreUpdates]);
        console.log(`✅ נשלחו ${reminderPromises.length} תזכורות`);
      }

      if (firestoreUpdates.length > 0 && reminderPromises.length === 0) {
        await Promise.all(firestoreUpdates);
      }
      
    } catch (error) {
      console.error('❌ שגיאה בבדיקת תזכורות:', error);
      return res.status(500).send('שגיאה: ' + error.message);
    }
    
    return res.status(200).send('OK');
  });


// ─────────────────────────────────────────────
// פונקציה 3: בדיקה ידנית (קיימת)
// ─────────────────────────────────────────────
exports.testNotification = functions.https.onRequest(async (req, res) => {
  try {
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('fcmToken', '!=', null)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      res.status(404).send('אין משתמשים עם FCM tokens');
      return;
    }
    
    const token = usersSnapshot.docs[0].data().fcmToken;
    
    const message = {
      notification: {
        title: '🧪 התראת בדיקה',
        body: 'זוהי התראת בדיקה מ-VPlus'
      },
      token: token
    };
    
    const response = await admin.messaging().send(message);
    res.status(200).send('התראה נשלחה: ' + response);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('שגיאה: ' + error.message);
  }
});


// ─────────────────────────────────────────────
// פונקציות עזר
// ─────────────────────────────────────────────

/**
 * שולח FCM לרשימת tokens
 */
async function sendFCMToTokens(tokens, { title, body, data }) {
  const batchSize = 500;
  const promises = [];
  
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    const message = {
      notification: { title, body },
      data: data || {},
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true
        },
        fcmOptions: {
          link: 'https://vplus-pro.web.app'
        }
      },
      tokens: batch
    };
    
    promises.push(
      admin.messaging().sendEachForMulticast(message)
        .then(response => {
          console.log(`✅ נשלח: ${response.successCount}/${batch.length}`);
          if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                failedTokens.push(batch[idx]);
                console.error('❌ שגיאה:', resp.error);
              }
            });
            return cleanupInvalidTokens(failedTokens);
          }
        })
    );
  }
  
  return Promise.all(promises);
}

/**
 * ממיר reminderValue + reminderUnit למילישניות
 */
function getReminderMilliseconds(value, unit) {
  const multipliers = {
    'minutes': 60 * 1000,
    'hours':   60 * 60 * 1000,
    'days':    24 * 60 * 60 * 1000,
    'weeks':   7 * 24 * 60 * 60 * 1000
  };
  return value * (multipliers[unit] || 60 * 1000);
}

/**
 * מתרגם יחידת זמן לעברית
 */
function formatUnit(unit) {
  const map = {
    'minutes': 'דקות',
    'hours':   'שעות',
    'days':    'ימים',
    'weeks':   'שבועות'
  };
  return map[unit] || unit;
}

async function cleanupInvalidTokens(tokens) {
  const promises = tokens.map(token =>
    admin.firestore().collection('users')
      .where('fcmToken', '==', token).limit(1).get()
      .then(snap => {
        if (!snap.empty) return snap.docs[0].ref.update({ fcmToken: admin.firestore.FieldValue.delete() });
      })
      .catch(err => console.error('Error cleaning token:', err))
  );
  await Promise.all(promises);
  console.log(`🧹 נוקו ${tokens.length} tokens לא תקפים`);
}
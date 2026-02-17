/**
 * Firebase Cloud Functions for VPlus Push Notifications
 * שולח התראות push כשיש שינויים ברשימת קניות
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * שולח התראה push כשיש שינוי ברשימת קניות
 * מופעל אוטומטית כש-Firestore מתעדכן
 */
exports.sendShoppingListNotification = functions.firestore
  .document('shopping_lists/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    
    console.log('📝 שינוי זוהה ברשימה של:', userId);
    
    const before = change.before.data();
    const after = change.after.data();
    
    // בדיקה: האם יש שינוי אמיתי?
    if (JSON.stringify(before) === JSON.stringify(after)) {
      console.log('⏭️ אין שינוי אמיתי, מדלג');
      return null;
    }
    
    try {
      // שלב 1: מצא את כל המשתמשים עם FCM tokens
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('fcmToken', '!=', null)
        .get();
      
      if (usersSnapshot.empty) {
        console.log('⚠️ אין משתמשים עם FCM tokens');
        return null;
      }
      
      // שלב 2: זהה מה השתנה
      const changeDetails = detectChanges(before, after);
      
      if (!changeDetails.hasChanges) {
        console.log('⏭️ אין שינויים משמעותיים');
        return null;
      }
      
      // שלב 3: צור הודעת התראה
      const notification = {
        title: '🔔 עדכון ברשימה',
        body: changeDetails.message,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'vplus-update',
        requireInteraction: true,
        data: {
          type: 'list_update',
          userId: userId,
          timestamp: Date.now().toString(),
          changeType: changeDetails.type
        }
      };
      
      // שלב 4: שלח לכל המשתמשים (מלבד מי ששינה)
      const tokens = [];
      const promises = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        // אל תשלח למשתמש שעשה את השינוי
        if (doc.id !== userId && userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      });
      
      if (tokens.length === 0) {
        console.log('⚠️ אין tokens לשלוח אליהם');
        return null;
      }
      
      // שלח בקבוצות של 500 (מגבלת FCM)
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        
        const message = {
          notification: {
            title: notification.title,
            body: notification.body
          },
          data: notification.data,
          webpush: {
            notification: {
              icon: notification.icon,
              badge: notification.badge,
              tag: notification.tag,
              requireInteraction: notification.requireInteraction,
              vibrate: [200, 100, 200]
            },
            fcmOptions: {
              link: 'https://vplus-pro.web.app'
            }
          },
          tokens: batch
        };
        
        promises.push(
          admin.messaging().sendMulticast(message)
            .then(response => {
              console.log(`✅ נשלח בהצלחה: ${response.successCount}/${batch.length}`);
              
              // טיפול ב-tokens לא תקפים
              if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                  if (!resp.success) {
                    failedTokens.push(batch[idx]);
                    console.error('❌ שגיאה:', resp.error);
                  }
                });
                // מחק tokens לא תקפים
                return cleanupInvalidTokens(failedTokens);
              }
            })
        );
      }
      
      await Promise.all(promises);
      console.log('✅ כל ההתראות נשלחו');
      
    } catch (error) {
      console.error('❌ שגיאה בשליחת התראות:', error);
    }
    
    return null;
  });

/**
 * מזהה מה השתנה ברשימה
 */
function detectChanges(before, after) {
  const result = {
    hasChanges: false,
    type: 'unknown',
    message: 'הרשימה עודכנה'
  };
  
  // בדיקה: פריטים נוספו
  const beforeItems = getAllItems(before);
  const afterItems = getAllItems(after);
  
  if (afterItems.length > beforeItems.length) {
    const addedCount = afterItems.length - beforeItems.length;
    result.hasChanges = true;
    result.type = 'items_added';
    result.message = `${addedCount} פריט${addedCount > 1 ? 'ים' : ''} נוסף${addedCount > 1 ? 'ו' : ''} לרשימה`;
    return result;
  }
  
  // בדיקה: פריטים הוסרו
  if (afterItems.length < beforeItems.length) {
    const removedCount = beforeItems.length - afterItems.length;
    result.hasChanges = true;
    result.type = 'items_removed';
    result.message = `${removedCount} פריט${removedCount > 1 ? 'ים' : ''} הוסר${removedCount > 1 ? 'ו' : ''} מהרשימה`;
    return result;
  }
  
  // בדיקה: פריטים סומנו/בוטלו
  const beforeChecked = beforeItems.filter(item => item.checked).length;
  const afterChecked = afterItems.filter(item => item.checked).length;
  
  if (afterChecked > beforeChecked) {
    const checkedCount = afterChecked - beforeChecked;
    result.hasChanges = true;
    result.type = 'items_checked';
    result.message = `${checkedCount} פריט${checkedCount > 1 ? 'ים' : ''} סומן${checkedCount > 1 ? 'ו' : ''} כהושלם`;
    return result;
  }
  
  if (afterChecked < beforeChecked) {
    const uncheckedCount = beforeChecked - afterChecked;
    result.hasChanges = true;
    result.type = 'items_unchecked';
    result.message = `${uncheckedCount} פריט${uncheckedCount > 1 ? 'ים' : ''} בוטל${uncheckedCount > 1 ? 'ו' : ''}`;
    return result;
  }
  
  // בדיקה: פריטים עודכנו
  const itemsChanged = detectItemChanges(beforeItems, afterItems);
  if (itemsChanged.length > 0) {
    result.hasChanges = true;
    result.type = 'items_updated';
    result.message = `${itemsChanged.length} פריט${itemsChanged.length > 1 ? 'ים' : ''} עודכן${itemsChanged.length > 1 ? 'ו' : ''}`;
    return result;
  }
  
  return result;
}

/**
 * מחלץ את כל הפריטים מכל הרשימות
 */
function getAllItems(data) {
  const items = [];
  
  if (data && data.lists) {
    Object.values(data.lists).forEach(list => {
      if (list.items && Array.isArray(list.items)) {
        items.push(...list.items);
      }
    });
  }
  
  return items;
}

/**
 * מזהה פריטים שהשתנו
 */
function detectItemChanges(beforeItems, afterItems) {
  const changed = [];
  
  // השווה לפי cloudId
  for (let i = 0; i < Math.min(beforeItems.length, afterItems.length); i++) {
    const before = beforeItems[i];
    const after = afterItems[i];
    
    if (before.cloudId === after.cloudId) {
      // בדוק אם יש שינוי
      if (before.name !== after.name || 
          before.price !== after.price || 
          before.qty !== after.qty ||
          before.note !== after.note) {
        changed.push(after);
      }
    }
  }
  
  return changed;
}

/**
 * מנקה FCM tokens לא תקפים מה-database
 */
async function cleanupInvalidTokens(tokens) {
  const promises = [];
  
  for (const token of tokens) {
    const userQuery = admin.firestore()
      .collection('users')
      .where('fcmToken', '==', token)
      .limit(1);
    
    promises.push(
      userQuery.get()
        .then(snapshot => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() });
          }
        })
        .catch(err => console.error('Error cleaning token:', err))
    );
  }
  
  await Promise.all(promises);
  console.log(`🧹 נוקו ${tokens.length} tokens לא תקפים`);
}

/**
 * פונקציית עזר לבדיקת ההתראות
 * ניתן להפעיל ידנית: https://console.firebase.google.com/project/vplus-pro/functions
 */
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

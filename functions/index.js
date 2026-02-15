const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Cloud Function לשליחת התראה כשמתווסף פריט חדש לרשימת קניות
exports.sendItemAddedNotification = functions.firestore
    .document('shopping_lists/{listId}/items/{itemId}')
    .onCreate(async (snap, context) => {
        try {
            const itemData = snap.data();
            const listId = context.params.listId;
            
            // קבלת מידע על הרשימה
            const listDoc = await admin.firestore()
                .collection('shopping_lists')
                .doc(listId)
                .get();
            
            if (!listDoc.exists) {
                console.log('List not found');
                return null;
            }
            
            const listData = listDoc.data();
            const sharedWith = listData.sharedWith || [];
            const ownerId = listData.userId;
            
            // איסוף כל ה-FCM tokens של המשתמשים המשותפים
            const userIds = [ownerId, ...sharedWith];
            const tokens = [];
            
            for (const userId of userIds) {
                const userDoc = await admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .get();
                
                if (userDoc.exists && userDoc.data().fcmToken) {
                    tokens.push(userDoc.data().fcmToken);
                }
            }
            
            if (tokens.length === 0) {
                console.log('No FCM tokens found');
                return null;
            }
            
            // יצירת ההודעה
            const message = {
                notification: {
                    title: 'פריט חדש נוסף',
                    body: `${itemData.name} נוסף לרשימה`,
                },
                data: {
                    listId: listId,
                    itemId: context.params.itemId,
                    type: 'item_added',
                },
                tokens: tokens,
                android: {
                    priority: 'high',
                },
                webpush: {
                    headers: {
                        Urgency: 'high',
                    },
                },
            };
            
            // שליחת ההתראה
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log('Successfully sent notifications:', response.successCount);
            
            return response;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    });

// Cloud Function לשליחת התראה כשמתעדכן פריט
exports.sendItemUpdatedNotification = functions.firestore
    .document('shopping_lists/{listId}/items/{itemId}')
    .onUpdate(async (change, context) => {
        try {
            const before = change.before.data();
            const after = change.after.data();
            const listId = context.params.listId;
            
            // בדיקה אם השתנה סטטוס (נקנה/לא נקנה)
            if (before.purchased !== after.purchased) {
                const listDoc = await admin.firestore()
                    .collection('shopping_lists')
                    .doc(listId)
                    .get();
                
                if (!listDoc.exists) {
                    return null;
                }
                
                const listData = listDoc.data();
                const sharedWith = listData.sharedWith || [];
                const ownerId = listData.userId;
                
                const userIds = [ownerId, ...sharedWith];
                const tokens = [];
                
                for (const userId of userIds) {
                    const userDoc = await admin.firestore()
                        .collection('users')
                        .doc(userId)
                        .get();
                    
                    if (userDoc.exists && userDoc.data().fcmToken) {
                        tokens.push(userDoc.data().fcmToken);
                    }
                }
                
                if (tokens.length === 0) {
                    return null;
                }
                
                const statusText = after.purchased ? 'נקנה' : 'בוטל';
                
                const message = {
                    notification: {
                        title: 'עדכון פריט',
                        body: `${after.name} ${statusText}`,
                    },
                    data: {
                        listId: listId,
                        itemId: context.params.itemId,
                        type: 'item_updated',
                    },
                    tokens: tokens,
                    android: {
                        priority: 'high',
                    },
                    webpush: {
                        headers: {
                            Urgency: 'high',
                        },
                    },
                };
                
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log('Successfully sent update notifications:', response.successCount);
                
                return response;
            }
            
            return null;
        } catch (error) {
            console.error('Error sending update notification:', error);
            return null;
        }
    });

// Cloud Function לשליחת התראה כשנמחק פריט
exports.sendItemDeletedNotification = functions.firestore
    .document('shopping_lists/{listId}/items/{itemId}')
    .onDelete(async (snap, context) => {
        try {
            const itemData = snap.data();
            const listId = context.params.listId;
            
            const listDoc = await admin.firestore()
                .collection('shopping_lists')
                .doc(listId)
                .get();
            
            if (!listDoc.exists) {
                return null;
            }
            
            const listData = listDoc.data();
            const sharedWith = listData.sharedWith || [];
            const ownerId = listData.userId;
            
            const userIds = [ownerId, ...sharedWith];
            const tokens = [];
            
            for (const userId of userIds) {
                const userDoc = await admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .get();
                
                if (userDoc.exists && userDoc.data().fcmToken) {
                    tokens.push(userDoc.data().fcmToken);
                }
            }
            
            if (tokens.length === 0) {
                return null;
            }
            
            const message = {
                notification: {
                    title: 'פריט נמחק',
                    body: `${itemData.name} הוסר מהרשימה`,
                },
                data: {
                    listId: listId,
                    itemId: context.params.itemId,
                    type: 'item_deleted',
                },
                tokens: tokens,
                android: {
                    priority: 'high',
                },
                webpush: {
                    headers: {
                        Urgency: 'high',
                    },
                },
            };
            
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log('Successfully sent delete notifications:', response.successCount);
            
            return response;
        } catch (error) {
            console.error('Error sending delete notification:', error);
            return null;
        }
    });

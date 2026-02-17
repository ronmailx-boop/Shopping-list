/**
 * Firebase Cloud Functions for VPlus
 *
 * פונקציה 1 (קיימת): sendShoppingListNotification
 *   → שולח התראה מיידית לשאר המשתמשים כשיש שינוי ברשימה
 *
 * פונקציה 2 (חדשה): scheduleRemindersOnSave
 *   → כשנשמרת רשימה, סורק פריטים עם תזכורות ושומר תזמונים ב-Firestore
 *
 * פונקציה 3 (חדשה): sendScheduledReminders
 *   → רץ כל דקה, שולח FCM לכל תזכורת שהגיע זמנה
 *
 * פונקציה 4 (קיימת): testNotification
 *   → HTTP endpoint לבדיקה ידנית
 */

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule }        = require("firebase-functions/v2/scheduler");
const { onRequest }         = require("firebase-functions/v2/https");
const { logger }            = require("firebase-functions");
const admin                 = require("firebase-admin");

admin.initializeApp();

const db  = admin.firestore();
const fcm = admin.messaging();

// ─────────────────────────────────────────────────────────────────────────────
// עזר: חישוב מילישניות לפי יחידת זמן
// ─────────────────────────────────────────────────────────────────────────────
function getReminderMs(value, unit) {
  const v = parseFloat(value) || 0;
  switch (unit) {
    case "minutes": return v * 60 * 1000;
    case "hours":   return v * 60 * 60 * 1000;
    case "days":    return v * 24 * 60 * 60 * 1000;
    case "weeks":   return v * 7 * 24 * 60 * 60 * 1000;
    default:        return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// עזר: מחלץ את כל הפריטים מכל הרשימות
// ─────────────────────────────────────────────────────────────────────────────
function getAllItems(data) {
  const items = [];
  if (data && data.lists) {
    Object.values(data.lists).forEach((list) => {
      if (list.items && Array.isArray(list.items)) {
        items.push(...list.items);
      }
    });
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// עזר: מזהה מה השתנה ברשימה
// ─────────────────────────────────────────────────────────────────────────────
function detectChanges(before, after) {
  const result = { hasChanges: false, type: "unknown", message: "הרשימה עודכנה" };

  const beforeItems = getAllItems(before);
  const afterItems  = getAllItems(after);

  if (afterItems.length > beforeItems.length) {
    const n = afterItems.length - beforeItems.length;
    return { hasChanges: true, type: "items_added",
      message: `${n} פריט${n > 1 ? "ים" : ""} נוסף${n > 1 ? "ו" : ""} לרשימה` };
  }
  if (afterItems.length < beforeItems.length) {
    const n = beforeItems.length - afterItems.length;
    return { hasChanges: true, type: "items_removed",
      message: `${n} פריט${n > 1 ? "ים" : ""} הוסר${n > 1 ? "ו" : ""} מהרשימה` };
  }

  const beforeChecked = beforeItems.filter((i) => i.checked).length;
  const afterChecked  = afterItems.filter((i) => i.checked).length;

  if (afterChecked > beforeChecked) {
    const n = afterChecked - beforeChecked;
    return { hasChanges: true, type: "items_checked",
      message: `${n} פריט${n > 1 ? "ים" : ""} סומן${n > 1 ? "ו" : ""} כהושלם` };
  }
  if (afterChecked < beforeChecked) {
    const n = beforeChecked - afterChecked;
    return { hasChanges: true, type: "items_unchecked",
      message: `${n} פריט${n > 1 ? "ים" : ""} בוטל${n > 1 ? "ו" : ""}` };
  }

  // בדוק שינוי בשדות פריטים
  for (let i = 0; i < Math.min(beforeItems.length, afterItems.length); i++) {
    const b = beforeItems[i];
    const a = afterItems[i];
    if (b.cloudId === a.cloudId &&
        (b.name !== a.name || b.price !== a.price ||
         b.qty !== a.qty || b.note !== a.note)) {
      result.hasChanges = true;
      result.type = "items_updated";
      result.message = "פריטים עודכנו ברשימה";
      return result;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// עזר: מנקה FCM tokens לא תקפים
// ─────────────────────────────────────────────────────────────────────────────
async function cleanupInvalidTokens(tokens) {
  const promises = tokens.map((token) =>
    db.collection("users").where("fcmToken", "==", token).limit(1).get()
      .then((snap) => {
        if (!snap.empty) {
          return snap.docs[0].ref.update({
            fcmToken: admin.firestore.FieldValue.delete(),
          });
        }
      })
      .catch((err) => logger.error("Error cleaning token:", err))
  );
  await Promise.all(promises);
  logger.log(`🧹 נוקו ${tokens.length} tokens לא תקפים`);
}

// ═════════════════════════════════════════════════════════════════════════════
// פונקציה 1 (קיימת): התראה מיידית לשאר המשתמשים כשיש שינוי ברשימה
// ═════════════════════════════════════════════════════════════════════════════
exports.sendShoppingListNotification = onDocumentWritten(
  "shopping_lists/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const before = event.data?.before?.data();
    const after  = event.data?.after?.data();

    if (!before || !after) return null;

    logger.log("📝 שינוי זוהה ברשימה של:", userId);

    if (JSON.stringify(before) === JSON.stringify(after)) {
      logger.log("⏭️ אין שינוי אמיתי, מדלג");
      return null;
    }

    try {
      const usersSnapshot = await db.collection("users")
        .where("fcmToken", "!=", null).get();

      if (usersSnapshot.empty) {
        logger.log("⚠️ אין משתמשים עם FCM tokens");
        return null;
      }

      const changeDetails = detectChanges(before, after);
      if (!changeDetails.hasChanges) {
        logger.log("⏭️ אין שינויים משמעותיים");
        return null;
      }

      const tokens = [];
      usersSnapshot.forEach((doc) => {
        // אל תשלח למשתמש שעשה את השינוי
        if (doc.id !== userId && doc.data().fcmToken) {
          tokens.push(doc.data().fcmToken);
        }
      });

      if (tokens.length === 0) {
        logger.log("⚠️ אין tokens לשלוח אליהם");
        return null;
      }

      const batchSize = 500;
      const promises = [];
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const message = {
          notification: { title: "🔔 עדכון ברשימה", body: changeDetails.message },
          data: {
            type: "list_update",
            userId,
            timestamp: Date.now().toString(),
            changeType: changeDetails.type,
          },
          webpush: {
            notification: {
              icon: "/icon-192.png",
              badge: "/badge-72.png",
              tag: "vplus-update",
              requireInteraction: true,
              vibrate: [200, 100, 200],
            },
            fcmOptions: { link: "https://vplus-pro.web.app" },
          },
          tokens: batch,
        };

        promises.push(
          fcm.sendEachForMulticast(message).then((response) => {
            logger.log(`✅ נשלח: ${response.successCount}/${batch.length}`);
            if (response.failureCount > 0) {
              const failed = [];
              response.responses.forEach((r, idx) => {
                if (!r.success) failed.push(batch[idx]);
              });
              return cleanupInvalidTokens(failed);
            }
          })
        );
      }

      await Promise.all(promises);
      logger.log("✅ כל ההתראות נשלחו");
    } catch (err) {
      logger.error("❌ שגיאה בשליחת התראות:", err);
    }

    return null;
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// פונקציה 2 (חדשה): תזמון תזכורות — נכתב ל-Firestore כשנשמרת רשימה
// ═════════════════════════════════════════════════════════════════════════════
exports.scheduleRemindersOnSave = onDocumentWritten(
  "shopping_lists/{uid}",
  async (event) => {
    const uid  = event.params.uid;
    const data = event.data?.after?.data();
    if (!data || !data.lists) return null;

    // שלוף FCM token של המשתמש הזה
    const userSnap = await db.collection("users").doc(uid).get();
    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) {
      logger.log(`[scheduleReminders] אין FCM token ל-${uid}`);
      return null;
    }

    const now   = Date.now();
    const batch = db.batch();

    // מחק תזמונים ישנים של המשתמש הזה שעוד לא נשלחו
    const existingSnap = await db.collection("scheduled_notifications")
      .where("uid", "==", uid)
      .where("sent", "==", false)
      .get();
    existingSnap.docs.forEach((doc) => batch.delete(doc.ref));

    let scheduled = 0;

    for (const [listId, list] of Object.entries(data.lists)) {
      if (!list.items) continue;

      for (const item of list.items) {
        // דלג על פריטים ללא תזכורת, שהושלמו, או שאין תאריך
        if (item.checked || item.isPaid ||
            !item.dueDate || !item.reminderValue || !item.reminderUnit) {
          continue;
        }

        // בנה תאריך+שעת יעד
        const dueObj = new Date(item.dueDate);
        if (item.dueTime) {
          const [h, m] = item.dueTime.split(":");
          dueObj.setHours(parseInt(h), parseInt(m), 0, 0);
        } else {
          dueObj.setHours(9, 0, 0, 0);
        }

        const reminderMs = getReminderMs(item.reminderValue, item.reminderUnit);
        const notifyAtMs = dueObj.getTime() - reminderMs;

        // דלג על תזכורות שעברו
        if (notifyAtMs <= now) continue;

        const notifId = `${uid}_${item.cloudId || (listId + "_" + item.name)}`;
        const docRef  = db.collection("scheduled_notifications").doc(notifId);

        batch.set(docRef, {
          uid,
          fcmToken,
          listId,
          itemName:      item.name,
          dueDate:       item.dueDate,
          dueTime:       item.dueTime       || "",
          price:         item.price         || 0,
          reminderValue: item.reminderValue,
          reminderUnit:  item.reminderUnit,
          notifyAt:      notifyAtMs,
          sent:          false,
          createdAt:     admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: false });

        scheduled++;
      }
    }

    await batch.commit();
    logger.log(`[scheduleReminders] uid=${uid} → ${scheduled} תזמונים, ${existingSnap.size} ישנים נמחקו`);
    return null;
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// פונקציה 3 (חדשה): שליחת תזכורות — רץ כל דקה
// ═════════════════════════════════════════════════════════════════════════════
exports.sendScheduledReminders = onSchedule(
  { schedule: "every 1 minutes", timeZone: "Asia/Jerusalem" },
  async () => {
    const now  = Date.now();
    const snap = await db.collection("scheduled_notifications")
      .where("sent", "==", false)
      .where("notifyAt", "<=", now)
      .limit(100)
      .get();

    if (snap.empty) {
      logger.log("[sendReminders] אין תזכורות לשלוח");
      return;
    }

    logger.log(`[sendReminders] שולח ${snap.size} תזכורות...`);

    const promises = snap.docs.map(async (docSnap) => {
      const n = docSnap.data();

      let body = "";
      if (n.dueDate) {
        const d = new Date(n.dueDate);
        body = "יעד: " + d.toLocaleDateString("he-IL");
        if (n.dueTime) body += " בשעה " + n.dueTime;
      }
      if (n.price) body += `\nמחיר: ₪${parseFloat(n.price).toFixed(2)}`;

      const message = {
        token: n.fcmToken,
        notification: {
          title: `⏰ תזכורת: ${n.itemName}`,
          body:  body || "יש לך תזכורת חדשה מ-VPlus",
        },
        data: {
          type:     "reminder",
          listId:   n.listId   || "",
          itemName: n.itemName || "",
          dueDate:  n.dueDate  || "",
          dueTime:  n.dueTime  || "",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "vplus_reminders",
            priority:  "max",
            sound:     "default",
            vibrateTimingsMillis: [0, 300, 100, 300],
          },
        },
        apns: {
          payload: { aps: { sound: "default", badge: 1, "content-available": 1 } },
        },
        webpush: {
          notification: {
            icon:               "/icon-192.png",
            badge:              "/badge-72.png",
            requireInteraction: true,
            vibrate:            [300, 100, 300],
          },
          fcmOptions: { link: "https://vplus-pro.web.app" },
        },
      };

      try {
        const msgId = await fcm.send(message);
        logger.log(`[sendReminders] ✅ "${n.itemName}" ל-${n.uid} | ${msgId}`);
        await docSnap.ref.update({
          sent:         true,
          sentAt:       admin.firestore.FieldValue.serverTimestamp(),
          fcmMessageId: msgId,
        });
      } catch (err) {
        logger.error(`[sendReminders] ❌ ${n.uid}:`, err.code, err.message);

        // טוקן לא תקין — נקה אוטומטית
        if (err.code === "messaging/registration-token-not-registered" ||
            err.code === "messaging/invalid-registration-token") {
          await db.collection("users").doc(n.uid).update({
            fcmToken: admin.firestore.FieldValue.delete(),
          });
        }

        await docSnap.ref.update({
          sent:      true,
          sentAt:    admin.firestore.FieldValue.serverTimestamp(),
          sendError: err.message,
        });
      }
    });

    await Promise.allSettled(promises);
    logger.log("[sendReminders] סיים סבב שליחה");
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// פונקציה 4: ניקוי תזמונים ישנים — פעם ביום
// ═════════════════════════════════════════════════════════════════════════════
exports.cleanupOldNotifications = onSchedule(
  { schedule: "every 24 hours", timeZone: "Asia/Jerusalem" },
  async () => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const snap = await db.collection("scheduled_notifications")
      .where("sent", "==", true)
      .where("notifyAt", "<=", cutoff)
      .limit(500)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    logger.log(`[cleanup] נמחקו ${snap.size} תזמונים ישנים`);
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// פונקציה 5 (קיימת): HTTP endpoint לבדיקה ידנית
// ═════════════════════════════════════════════════════════════════════════════
exports.testNotification = onRequest(async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users")
      .where("fcmToken", "!=", null).limit(1).get();

    if (usersSnapshot.empty) {
      res.status(404).send("אין משתמשים עם FCM tokens");
      return;
    }

    const token = usersSnapshot.docs[0].data().fcmToken;
    const response = await fcm.send({
      notification: { title: "🧪 התראת בדיקה", body: "זוהי התראת בדיקה מ-VPlus" },
      token,
    });

    res.status(200).send("התראה נשלחה: " + response);
  } catch (err) {
    logger.error("Error:", err);
    res.status(500).send("שגיאה: " + err.message);
  }
});

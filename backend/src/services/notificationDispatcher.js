import { adminDb } from "../config/firebaseAdmin.js";
import { sendOrderEmail } from "./emailService.js";
import { sendWhatsAppMessage } from "./whatsappService.js";

const getDb = () => adminDb();

/**
 * Central notification dispatcher.
 * Looks up user preferences, then sends via the enabled channels.
 *
 * @param {string} userId - Firestore user id
 * @param {string} eventType - e.g. "orderConfirmation", "statusUpdate"
 * @param {object} data - Template data (orderId, service, customerName, etc.)
 */
export const dispatchNotification = async (userId, eventType, data) => {
  try {
    const db = getDb();
    const userSnap = await db.collection("users").doc(userId).get();
    const user = userSnap.exists ? userSnap.data() : null;

    if (!user) {
      console.warn(`dispatchNotification: user ${userId} not found.`);
      return;
    }

    const prefs = user.notificationPreferences || {
      email: true,
      whatsapp: true,
      inApp: true,
    };

    const results = await Promise.allSettled([
      // Email
      prefs.email && user.email
        ? sendOrderEmail(user.email, eventType, {
            ...data,
            customerName: data.customerName || user.name || "Customer",
          })
        : Promise.resolve(null),

      // WhatsApp
      prefs.whatsapp && user.phone
        ? sendWhatsAppMessage(user.phone, eventType, {
            ...data,
            customerName: data.customerName || user.name || "Customer",
          })
        : Promise.resolve(null),

      // In-App (write to Firestore notifications collection)
      prefs.inApp
        ? getDb().collection("notifications").add({
            userId,
            type: "order",
            title: `Order ${eventType.replace(/([A-Z])/g, " $1").trim()}`,
            message: data.message || `Update for order ${data.orderId || ""}`,
            read: false,
            createdAt: new Date(),
            metadata: {
              orderId: data.orderId || null,
              eventType,
            },
          })
        : Promise.resolve(null),
    ]);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const channels = ["email", "whatsapp", "inApp"];
        console.error(
          `Notification ${channels[index]} failed for ${userId}:`,
          result.reason?.message
        );
      }
    });
  } catch (error) {
    console.error("dispatchNotification error:", error.message);
  }
};

export default { dispatchNotification };

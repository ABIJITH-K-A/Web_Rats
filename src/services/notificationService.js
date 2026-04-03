import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  NOTIFICATION_DEFAULT_CHANNELS,
  getNotificationPriority,
  normalizeRole,
} from "../utils/systemRules";
import { apiRequest, isBackendConfigured } from "./apiClient";

const NOTIFICATION_RETRY_LIMIT = 2;
const NOTIFICATION_RETRY_DELAY_MS = 250;

const sanitizeText = (value, maxLength = 240) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createNotification = async ({
  recipientId,
  recipientRole = null,
  title,
  message,
  category = "system",
  type = null,
  channels = NOTIFICATION_DEFAULT_CHANNELS,
  orderId = null,
  paymentId = null,
  disputeId = null,
  supportId = null,
  metadata = {},
}) => {
  const safeTitle = sanitizeText(title, 120);
  const safeMessage = sanitizeText(message, 320);

  if (!safeTitle || !safeMessage) return null;

  const payload = {
    recipientId: recipientId || recipientRole || "all",
    recipientRole: recipientRole ? normalizeRole(recipientRole) : null,
    title: safeTitle,
    message: safeMessage,
    category,
    type: type || category,
    priority: getNotificationPriority(category),
    channels,
    orderId,
    paymentId,
    disputeId,
    supportId,
    metadata,
    read: false,
    createdAt: serverTimestamp(),
  };

  // Prefer API for security, logging, and business logic (email triggers, etc.)
  if (isBackendConfigured()) {
    try {
      const response = await apiRequest('/notifications', {
        method: 'POST',
        authMode: 'required',
        body: payload,
      });
      return response?.id ? { id: response.id } : null;
    } catch (error) {
      console.warn('Backend notification create failed, falling back to direct Firestore:', error.message);
    }
  }

  // Fallback to direct Firestore write
  for (let attempt = 1; attempt <= NOTIFICATION_RETRY_LIMIT; attempt += 1) {
    try {
      return await addDoc(collection(db, "notifications"), payload);
    } catch (error) {
      if (attempt === NOTIFICATION_RETRY_LIMIT) {
        console.error("Notification create error:", error);
        return null;
      }
      await delay(NOTIFICATION_RETRY_DELAY_MS * attempt);
    }
  }
};

export const notifyOrderStatusChanged = async ({
  recipientId,
  order,
  statusLabel,
}) =>
  createNotification({
    recipientId,
    title: "Order Status Updated",
    message: `${order?.service || "Your order"} is now ${statusLabel}.`,
    category: "order",
    orderId: order?.id || null,
  });

export const notifyWorkersAssigned = async ({ workerIds = [], order }) =>
  Promise.all(
    workerIds.filter(Boolean).map((workerId) =>
      createNotification({
        recipientId: workerId,
        title: "New Order Assigned",
        message: `You have been assigned to ${order?.service || "a new order"}.`,
        category: "assignment",
        orderId: order?.id || null,
      })
    )
  );

export const notifyAdmin = async ({
  title,
  message,
  category,
  orderId = null,
  paymentId = null,
  disputeId = null,
  supportId = null,
  metadata = {},
}) =>
  createNotification({
    recipientId: "admin",
    recipientRole: "admin",
    title,
    message,
    category,
    orderId,
    paymentId,
    disputeId,
    supportId,
    metadata,
  });

export const notifySupportRequest = async ({
  supportId = null,
  senderId = null,
  senderName = "A client",
  subject = "Support Request",
}) =>
  notifyAdmin({
    title: "New support request",
    message: `${senderName} sent a support request: ${subject}.`,
    category: "support",
    supportId,
    metadata: {
      senderId,
      subject,
    },
  });

export const notifyRoleUpdated = async ({
  recipientId,
  nextRole,
  actorName = "Admin",
}) =>
  createNotification({
    recipientId,
    title: "Promotion System Update",
    message: `${actorName} updated your account protocol to ${String(
      nextRole || "client"
    ).toUpperCase()}.`,
    category: "system",
    metadata: {
      nextRole,
      actorName,
    },
  });

export const notifyDisputeRaised = async ({
  disputeId,
  orderId = null,
  orderDisplayId = "UNKNOWN",
  raisedByName = "A client",
  disputeType = "general",
  workerIds = [],
}) =>
  Promise.all([
    notifyAdmin({
      title: "New Dispute Raised",
      message: `${raisedByName} raised a ${disputeType} dispute for order #${orderDisplayId}.`,
      category: "dispute",
      disputeId,
      orderId,
      metadata: {
        disputeType,
        raisedByName,
      },
    }),
    ...Array.from(new Set(workerIds.filter(Boolean))).map((workerId) =>
      createNotification({
        recipientId: workerId,
        title: "Dispute Needs Review",
        message: `${raisedByName} opened a dispute for order #${orderDisplayId}.`,
        category: "dispute",
        disputeId,
        orderId,
        metadata: {
          disputeType,
          raisedByName,
        },
      })
    ),
  ]);

export const notifyDisputeResolved = async ({
  disputeId,
  orderId = null,
  orderDisplayId = "UNKNOWN",
  resolution = "resolved",
  raisedBy = null,
  workerIds = [],
}) =>
  Promise.all(
    Array.from(new Set([raisedBy, ...workerIds].filter(Boolean))).map((recipientId) =>
      createNotification({
        recipientId,
        title: "Dispute Resolved",
        message: `Dispute for order #${orderDisplayId} was resolved as ${String(
          resolution || "resolved"
        ).replace(/_/g, " ")}.`,
        category: "dispute",
        disputeId,
        orderId,
        metadata: {
          resolution,
        },
      })
    )
  );

export const notifyDisputeReply = async ({
  disputeId,
  orderId = null,
  orderDisplayId = "UNKNOWN",
  senderId = null,
  senderName = "A team member",
  recipientIds = [],
}) =>
  Promise.all(
    Array.from(new Set(recipientIds.filter(Boolean)))
      .filter((recipientId) => recipientId !== senderId)
      .map((recipientId) =>
        createNotification({
          recipientId,
          title: "New Dispute Reply",
          message: `${senderName} replied on dispute thread for order #${orderDisplayId}.`,
          category: "dispute",
          disputeId,
          orderId,
          metadata: {
            senderId,
            senderName,
          },
        })
      )
  );

export default {
  createNotification,
  notifyOrderStatusChanged,
  notifyWorkersAssigned,
  notifyAdmin,
  notifySupportRequest,
  notifyRoleUpdated,
  notifyDisputeRaised,
  notifyDisputeResolved,
  notifyDisputeReply,
};

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  limit,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { apiRequest, getApiBaseUrl, isBackendConfigured } from "./apiClient";

const normalizeMessage = (docSnapshot) => ({
  id: docSnapshot.id,
  ...docSnapshot.data(),
});

const sortMessages = (messages = []) =>
  [...messages].sort((left, right) => {
    const leftTime =
      left.createdAt?.toMillis?.() || new Date(left.createdAt || 0).getTime() || 0;
    const rightTime =
      right.createdAt?.toMillis?.() || new Date(right.createdAt || 0).getTime() || 0;
    return leftTime - rightTime;
  });

const getAuthHeaders = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please sign in to continue.");
  }

  const token = await currentUser.getIdToken(true);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const sendMessage = async (orderId, messageData) => {
  if (isBackendConfigured()) {
    const response = await apiRequest("/chat/send", {
      method: "POST",
      authMode: "required",
      body: {
        orderId,
        message: messageData.text || messageData.message || "",
        fileUrl: messageData.fileUrl || undefined,
        fileName: messageData.fileName || undefined,
        type: messageData.type || (messageData.fileUrl ? "file" : "text"),
        previewOnly: messageData.previewOnly,
        downloadable: messageData.downloadable,
      },
    });

    return response?.id || null;
  }

  const messageRef = await addDoc(collection(db, "messages"), {
    orderId,
    senderId: messageData.userId,
    senderRole: messageData.userRole === "client" ? "client" : "worker",
    senderName: messageData.userName,
    message: messageData.text || "",
    fileUrl: messageData.fileUrl || "",
    fileName: messageData.fileName || "",
    type: messageData.type || "text",
    previewOnly: Boolean(messageData.previewOnly),
    downloadable: Boolean(messageData.downloadable),
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "chatThreads", orderId),
    {
      orderId,
      updatedAt: serverTimestamp(),
      lastMessage: {
        text: messageData.text || "New message",
        senderId: messageData.userId,
        senderRole: messageData.userRole,
        createdAt: serverTimestamp(),
      },
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return messageRef.id;
};

export const subscribeToThread = (orderId, callback) => {
  const threadQuery = query(
    collection(db, "messages"),
    where("orderId", "==", orderId),
    limit(200)
  );

  return onSnapshot(
    threadQuery,
    (snapshot) => {
      callback(sortMessages(snapshot.docs.map(normalizeMessage)));
    },
    (error) => {
      console.error("Chat subscription error:", error);
      callback([]);
    }
  );
};

export const uploadOrderFile = async ({ orderId, file, uploadType, message = "" }) => {
  if (!isBackendConfigured()) {
    throw new Error("Backend upload endpoint is required for order files.");
  }

  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("uploadType", uploadType);
  formData.append("message", message);
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "File upload failed.");
  }

  return response.json();
};

export const requestRevision = async (orderId, message) => {
  if (!isBackendConfigured()) {
    throw new Error("Backend revision endpoint is required.");
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${getApiBaseUrl()}/revision/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ orderId, message }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.message || "Could not request a revision.");
    error.statusCode = response.status;
    error.requiresPayment = payload?.requiresPayment || false;
    error.amount = payload?.amount || null;
    throw error;
  }

  return payload;
};

export const markMessagesAsRead = async () => true;

export const getUnreadMessageCount = async () => 0;

export const getThreads = (userId, role, callback) => {
  let ordersQuery;

  if (role === "client") {
    ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
  } else if (role === "worker") {
    ordersQuery = query(collection(db, "orders"), where("assignedWorkers", "array-contains", userId));
  } else {
    ordersQuery = query(collection(db, "orders"), limit(30));
  }

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const runAsync = async () => {
        try {
          const orders = snapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          }));

          const threads = await Promise.all(
            orders.map(async (order) => {
              const threadSnapshot = await getDoc(doc(db, "chatThreads", order.id));
              const threadData = threadSnapshot.exists() ? threadSnapshot.data() : null;

              return {
                id: order.id,
                orderId: order.id,
                serviceTitle:
                  order.serviceTitle?.label ||
                  order.serviceTitle ||
                  order.service ||
                  `Order #${order.displayId || order.id.slice(-6).toUpperCase()}`,
                lastMessage: threadData?.lastMessage || { text: "No messages yet" },
                unreadCount: 0,
                updatedAt: threadData?.updatedAt || order.updatedAt || order.createdAt,
                status: order.status,
                displayId: order.displayId,
              };
            })
          );

          threads.sort((left, right) => {
            const leftTime =
              left.updatedAt?.toMillis?.() ||
              new Date(left.updatedAt || 0).getTime() ||
              0;
            const rightTime =
              right.updatedAt?.toMillis?.() ||
              new Date(right.updatedAt || 0).getTime() ||
              0;
            return rightTime - leftTime;
          });

          callback(threads);
        } catch (error) {
          console.error("getThreads error:", error);
          callback([]);
        }
      };

      runAsync();
    },
    (error) => {
      console.error("getThreads snapshot error:", error);
      callback([]);
    }
  );
};

export const initializeChatThread = async (orderId, participants) => {
  const threadRef = doc(db, "chatThreads", orderId);
  const threadSnapshot = await getDoc(threadRef);

  if (!threadSnapshot.exists()) {
    await setDoc(threadRef, {
      orderId,
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    });
  }
};

export const getConversationById = async (conversationId) => {
  const threadSnapshot = await getDoc(doc(db, "chatThreads", conversationId));
  const orderSnapshot = await getDoc(doc(db, "orders", conversationId));

  if (!orderSnapshot.exists()) {
    return threadSnapshot.exists() ? { id: threadSnapshot.id, ...threadSnapshot.data() } : null;
  }

  const order = { id: orderSnapshot.id, ...orderSnapshot.data() };
  const thread = threadSnapshot.exists() ? threadSnapshot.data() : null;

  return {
    id: order.id,
    orderId: order.id,
    subject:
      order.serviceTitle?.label ||
      order.serviceTitle ||
      order.service ||
      `Order #${order.displayId || order.id.slice(-6).toUpperCase()}`,
    serviceTitle:
      order.serviceTitle?.label ||
      order.serviceTitle ||
      order.service,
    status: order.status,
    revisionLimit: Number(order.revisionLimit ?? 1),
    revisionsUsed: Number(order.revisionsUsed ?? 0),
    paidRevisionCredits: Number(order.paidRevisionCredits ?? 0),
    ...thread,
  };
};

export default {
  sendMessage,
  subscribeToThread,
  uploadOrderFile,
  requestRevision,
  getThreads,
  markMessagesAsRead,
  getUnreadMessageCount,
  initializeChatThread,
  getConversationById,
};

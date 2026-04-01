import { db } from "../config/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  limit,
  writeBatch,
  startAfter
} from "firebase/firestore";
import { sanitizeData } from "../utils/sanitize";

/**
 * Send a message to an order's chat thread
 */
export const sendMessage = async (orderId, messageData) => {
  try {
    const safeMessageData = sanitizeData(messageData);

    // 1. Add message
    const messagesRef = collection(db, "chatMessages");
    const messageRef = await addDoc(messagesRef, {
      ...safeMessageData,
      orderId,
      readBy: [safeMessageData.userId],
      createdAt: serverTimestamp(),
    });

    // 2. Update thread metadata (lastMessage, unreadCount)
    const threadRef = doc(db, "chatThreads", orderId);
    
    await updateDoc(threadRef, {
      lastMessage: {
        text: safeMessageData.text,
        createdAt: serverTimestamp(),
        userId: safeMessageData.userId,
        userName: safeMessageData.userName,
      },
      updatedAt: serverTimestamp()
    }).catch(async () => {
       // If thread doc doesn't exist, create it
       await setDoc(threadRef, {
          orderId,
          participants: safeMessageData.participants || [],
          lastMessage: {
            text: safeMessageData.text,
            createdAt: serverTimestamp(),
            userId: safeMessageData.userId,
            userName: safeMessageData.userName,
          },
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
       });
    });

    return messageRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Mark messages as read for a user
 */
export const markMessagesAsRead = async (orderId, userId) => {
  try {
    const messagesQuery = query(
      collection(db, "chatMessages"),
      where("orderId", "==", orderId),
      where("readBy", "not-in", [[userId]])
    );

    const snapshot = await getDocs(messagesQuery);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.readBy?.includes(userId)) {
        batch.update(docSnap.ref, {
          readBy: [...(data.readBy || []), userId]
        });
      }
    });

    await batch.commit();
    
    // Update unread count in thread
    const threadRef = doc(db, "chatThreads", orderId);
    await updateDoc(threadRef, {
      [`unreadCount.${userId}`]: 0
    });

    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
};

/**
 * Get unread message count for a user
 */
export const getUnreadMessageCount = async (userId, role) => {
  try {
    // Get all orders this user is involved in
    let ordersQuery;
    if (role === "client") {
      ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
    } else if (["worker", "manager"].includes(role)) {
      ordersQuery = query(collection(db, "orders"), where("workers", "array-contains", userId));
    } else {
      ordersQuery = query(collection(db, "orders"), limit(20));
    }

    const ordersSnap = await getDocs(ordersQuery);
    const orderIds = ordersSnap.docs.map(doc => doc.id);

    // Get unread counts from chatThreads
    let totalUnread = 0;
    
    for (const orderId of orderIds) {
      const threadSnap = await getDoc(doc(db, "chatThreads", orderId));
      if (threadSnap.exists()) {
        const unreadCount = threadSnap.data()?.unreadCount?.[userId] || 0;
        totalUnread += unreadCount;
      }
    }

    return totalUnread;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

/**
 * Listen for new messages in a single thread with pagination support
 * @param {string} orderId - The order ID
 * @param {Function} callback - Called with messages array
 * @param {Object} options - Pagination options
 * @param {number} options.limit - Number of messages to fetch (default: 50)
 * @param {DocumentSnapshot} options.startAfter - Document to start after for pagination
 */
export const subscribeToThread = (orderId, callback, options = {}) => {
  const { limit: msgLimit = 50, startAfter } = options;
  
  let q = query(
    collection(db, "chatMessages"),
    where("orderId", "==", orderId),
    orderBy("createdAt", "desc"),
    limit(msgLimit)
  );

  if (startAfter) {
    q = query(q, startAfter(startAfter));
  }

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .reverse(); // Reverse to show oldest first
    callback(messages, snapshot.docs[snapshot.docs.length - 1]);
  });
};

/**
 * Get a conversation by ID
 */
export const getConversationById = async (conversationId) => {
  try {
    const threadRef = doc(db, "chatThreads", conversationId);
    const threadSnap = await getDoc(threadRef);
    
    if (threadSnap.exists()) {
      return { id: threadSnap.id, ...threadSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting conversation:", error);
    return null;
  }
};

/**
 * Get active threads for a specific user based on their role
 */
export const getThreads = (userId, role, callback) => {
  let ordersQuery;

  if (role === "client") {
    ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
  } else if (["worker", "manager"].includes(role)) {
    ordersQuery = query(collection(db, "orders"), where("workers", "array-contains", userId)); 
  } else {
    ordersQuery = query(collection(db, "orders"), orderBy("updatedAt", "desc"), limit(20));
  }

  return onSnapshot(ordersQuery, async (snapshot) => {
    const orders = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
    
    const threads = await Promise.all(orders.map(async (order) => {
      const threadSnap = await getDoc(doc(db, "chatThreads", order.id));
      const threadData = threadSnap.exists() ? threadSnap.data() : null;
      
      return {
        id: order.id,
        orderId: order.id,
        serviceTitle: order.serviceTitle?.label || order.serviceTitle || `Order #${order.displayId}`,
        lastMessage: threadData?.lastMessage || { text: "No messages yet" },
        unreadCount: threadData?.unreadCount?.[userId] || 0,
        updatedAt: threadData?.updatedAt || order.updatedAt,
        status: order.status,
        displayId: order.displayId
      };
    }));
    
    // Sort by last message time
    threads.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    callback(threads);
  });
};

/**
 * Initialize chat thread for an order
 */
export const initializeChatThread = async (orderId, participants) => {
  try {
    const threadRef = doc(db, "chatThreads", orderId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      await setDoc(threadRef, {
        orderId,
        participants,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
        unreadCount: {}
      });
    }
  } catch (error) {
    console.error("Error initializing chat thread:", error);
  }
};

export default {
  sendMessage,
  subscribeToThread,
  getThreads,
  markMessagesAsRead,
  getUnreadMessageCount,
  initializeChatThread
};

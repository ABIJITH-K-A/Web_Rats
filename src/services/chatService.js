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
  limit
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
    await addDoc(messagesRef, {
      ...safeMessageData,
      orderId,
      createdAt: serverTimestamp(),
    });

    // 2. Update thread metadata (lastMessage, unreadCount)
    // We treat 'chatThreads' as a parallel collection to 'orders' or just use 'orders' directly.
    // Let's create a dedicated 'chatThreads' collection to track thread-level 
    // metadata like unread counts without bloating 'orders'.
    
    const threadRef = doc(db, "chatThreads", orderId);
    
    // Typically, you'd increment unread counts here via a cloud function.
    // On the frontend, we'll just set the last message for now.
    await updateDoc(threadRef, {
      lastMessage: {
        text: safeMessageData.text,
        createdAt: serverTimestamp(),
        userId: safeMessageData.userId,
      },
      updatedAt: serverTimestamp()
    }).catch(async (err) => {
       // If thread doc doesn't exist, this fails. We could set it instead.
       import("firebase/firestore").then(({ setDoc }) => {
         setDoc(threadRef, {
            orderId,
            lastMessage: {
              text: safeMessageData.text,
              createdAt: serverTimestamp(),
              userId: safeMessageData.userId,
            },
            updatedAt: serverTimestamp()
         }, { merge: true });
       });
    });

    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Listen for new messages in a single thread
 */
export const subscribeToThread = (orderId, callback) => {
  const q = query(
    collection(db, "chatMessages"),
    where("orderId", "==", orderId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

/**
 * Get active threads for a specific user based on their role
 */
export const getThreads = (userId, role, callback) => {
  // To keep this lightweight, we query the 'orders' collection to find 
  // which orders this user is involved in, then watch the corresponding 'chatThreads'.
  
  let ordersQuery;

  if (role === "client") {
    ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
  } else if (["worker", "manager"].includes(role)) {
    // Workers see orders assigned to them
    ordersQuery = query(collection(db, "orders"), where("workers", "array-contains", userId)); 
    // Note: If you don't use a 'workers' array, you might query by assignedTeam or similar.
  } else {
    // Admin/Owner sees recent active orders (limit for perf) 
    ordersQuery = query(collection(db, "orders"), orderBy("updatedAt", "desc"), limit(20));
  }

  // To do a real-time join on client-side is complex. 
  // Let's watch the orders they are involved in, and format them as threads.
  return onSnapshot(ordersQuery, async (snapshot) => {
    const orders = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
    
    // Fetch thread metadata for these orders
    const threads = await Promise.all(orders.map(async (order) => {
      // In a real production app, we would use a single query with 'in' 
      // array, or denormalize. We will just use 'getDocs' for thread metadata here.
      // But for real-time unread counts, we might just assume unreadCount=0 for now.
      
      return {
        id: order.id,
        serviceTitle: order.serviceTitle?.label || order.serviceTitle || `Order #${order.displayId}`,
        lastMessage: { text: "Open to view messages" }, // placeholder
        unreadCount: {} 
      };
    }));
    
    // Then fetch actual thread data if needed, but returning structured ones first
    callback(threads);
  });
};

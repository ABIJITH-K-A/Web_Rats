import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { apiRequest, isBackendConfigured } from "./apiClient";
import {
  isOrderAssignedToWorker,
  sortRecordsByCreatedAtDesc,
} from "../utils/orderHelpers";
import { getErrorMessage } from "../utils/errorHandler";

/**
 * Formats a Firestore snapshot into a clean UI order record
 * @param {import("firebase/firestore").DocumentSnapshot} docSnapshot 
 * @returns {Object} Cleaned order record
 */
const toOrderRecord = (docSnapshot) => ({
  id: docSnapshot.id,
  ...docSnapshot.data(),
});

/**
 * Merges multiple separate query snapshots, removes duplicates by ID, and sorts them
 * @param {Array<import("firebase/firestore").QuerySnapshot|null>} snapshots 
 * @returns {Array<Object>} Unified sorted order array 
 */
const mergeOrderSnapshots = (snapshots = []) => {
  const merged = new Map();

  snapshots.forEach((snapshot) => {
    snapshot?.docs.forEach((docSnapshot) => {
      merged.set(docSnapshot.id, toOrderRecord(docSnapshot));
    });
  });

  return sortRecordsByCreatedAtDesc(Array.from(merged.values()));
};

/**
 * Fetches the most recently created raw orders (used by admin and owner dashboards)
 * @param {number} maxRecords Maximum docs to pull
 * @returns {Promise<Array<Object>>} Latest orders list
 */
export const fetchLatestOrders = async (maxRecords = 120) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(maxRecords))
    );

    return snapshot.docs.map(toOrderRecord);
  } catch (error) {
    console.error("fetchLatestOrders error:", getErrorMessage(error));
    return [];
  }
};

/**
 * Intelligently creates a new order via Backend API or fallbacks to pure Firebase
 * @param {Object} payload The order properties to save
 * @returns {Promise<Object>} The fully created order with ID
 */
export const createOrder = async (payload = {}) => {
  if (isBackendConfigured()) {
    try {
      const response = await apiRequest('/orders/create', {
        method: 'POST',
        authMode: 'optional',
        body: payload,
      });

      return response?.order || null;
    } catch (error) {
      // Backend unavailable - fall back to Firebase safely
      console.warn('Backend order creation failed, falling back to pure Firebase route:', error.message);
    }
  }

  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: orderRef.id,
      ...payload,
    };
  } catch (error) {
    console.error("createOrder fallback error:", getErrorMessage(error));
    throw new Error("Unable to create order. " + getErrorMessage(error));
  }
};

/**
 * Gathers all orders assigned to a specific worker across various legacy assignment strings
 * @param {string} userId Remote worker ID
 * @returns {Promise<Array<Object>>} Worker's valid assignments
 */
export const fetchOrdersAssignedToUser = async (userId) => {
  if (!userId) return [];

  try {
    const snapshots = await Promise.all(
      [
      query(
        collection(db, "orders"),
        where("assignedWorkers", "array-contains", userId),
        orderBy("createdAt", "desc")
      ),
      query(
        collection(db, "orders"),
        where("workerAssigned", "==", userId),
        orderBy("createdAt", "desc")
      ),
      query(
        collection(db, "orders"),
        where("assignedTo", "==", userId),
        orderBy("createdAt", "desc")
      ),
    ].map((orderQuery) => getDocs(orderQuery).catch(() => null))
  );

  const mergedOrders = mergeOrderSnapshots(snapshots);
  if (mergedOrders.length > 0) {
    return mergedOrders;
  }

    const fallbackSnapshot = await getDocs(
      query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(200))
    ).catch(() => null);

    if (!fallbackSnapshot) {
      return [];
    }

    return sortRecordsByCreatedAtDesc(
      fallbackSnapshot.docs
        .map(toOrderRecord)
        .filter((order) => isOrderAssignedToWorker(order, userId))
    );
  } catch (error) {
    console.error("fetchOrdersAssignedToUser error:", getErrorMessage(error));
    return [];
  }
};

export default {
  createOrder,
  fetchLatestOrders,
  fetchOrdersAssignedToUser,
};

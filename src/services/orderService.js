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

const toOrderRecord = (docSnapshot) => ({
  id: docSnapshot.id,
  ...docSnapshot.data(),
});

const mergeOrderSnapshots = (snapshots = []) => {
  const merged = new Map();

  snapshots.forEach((snapshot) => {
    snapshot?.docs.forEach((docSnapshot) => {
      merged.set(docSnapshot.id, toOrderRecord(docSnapshot));
    });
  });

  return sortRecordsByCreatedAtDesc(Array.from(merged.values()));
};

export const fetchLatestOrders = async (maxRecords = 120) => {
  const snapshot = await getDocs(
    query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(maxRecords))
  );

  return snapshot.docs.map(toOrderRecord);
};

export const createOrder = async (payload = {}) => {
  if (isBackendConfigured()) {
    const response = await apiRequest('/orders/create', {
      method: 'POST',
      authMode: 'optional',
      body: payload,
    });

    return response?.order || null;
  }

  const orderRef = await addDoc(collection(db, 'orders'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: orderRef.id,
    ...payload,
  };
};

export const fetchOrdersAssignedToUser = async (userId) => {
  if (!userId) return [];

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
};

export default {
  createOrder,
  fetchLatestOrders,
  fetchOrdersAssignedToUser,
};

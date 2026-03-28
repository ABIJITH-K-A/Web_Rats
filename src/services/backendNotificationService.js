import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  getNotificationRecipientsForUser,
  normalizeRole,
} from '../utils/systemRules';
import { apiRequest, isBackendConfigured } from './apiClient';

const sortByCreatedAtDesc = (records = []) =>
  [...records].sort((left, right) => {
    const leftValue =
      (typeof left?.createdAt?.toDate === 'function'
        ? left.createdAt.toDate()
        : new Date(left?.createdAt || 0)
      )?.getTime?.() || 0;
    const rightValue =
      (typeof right?.createdAt?.toDate === 'function'
        ? right.createdAt.toDate()
        : new Date(right?.createdAt || 0)
      )?.getTime?.() || 0;

    return rightValue - leftValue;
  });

export const fetchNotificationsForUser = async (user, role) => {
  if (!user?.uid) return [];

  if (isBackendConfigured()) {
    const response = await apiRequest(`/notifications/${user.uid}`, {
      authMode: 'required',
    });

    return response?.notifications || [];
  }

  const normalizedRole = normalizeRole(role);

  if (['admin', 'owner', 'superadmin'].includes(normalizedRole)) {
    const snapshot = await getDocs(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(30))
    );

    return snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    }));
  }

  const recipientIds = getNotificationRecipientsForUser(user, normalizedRole);
  const snapshot = await getDocs(
    query(
      collection(db, 'notifications'),
      where('recipientId', 'in', recipientIds),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
  );

  return sortByCreatedAtDesc(
    snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    }))
  );
};

export const markNotificationRead = async (notificationId) => {
  if (!notificationId) return null;

  if (isBackendConfigured()) {
    const response = await apiRequest('/notifications/read', {
      method: 'PATCH',
      authMode: 'required',
      body: {
        notificationId,
        read: true,
      },
    });

    return response?.notification || null;
  }

  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });

  return null;
};

export default {
  fetchNotificationsForUser,
  markNotificationRead,
};

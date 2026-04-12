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

let notificationBackendEnabled = true;

const sortNotificationsByCreatedAtDesc = (records = []) =>
  [...records].sort((left, right) => {
    const leftTime = left?.createdAt?.toDate?.()?.getTime?.() || new Date(left?.createdAt || 0).getTime() || 0;
    const rightTime = right?.createdAt?.toDate?.()?.getTime?.() || new Date(right?.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });

const shouldUseFirestoreFallback = (error) =>
  error?.statusCode === 401 ||
  error?.statusCode === 403 ||
  error?.code === 'auth_network_failed' ||
  error?.code === 'connection_refused' ||
  String(error?.message || '').toLowerCase().includes('log in') ||
  String(error?.message || '').toLowerCase().includes('sign in');

const fetchNotificationsFromFirestore = async (user, role) => {
  const normalizedRole = normalizeRole(role);

  if (['admin', 'owner'].includes(normalizedRole)) {
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
      limit(50)
    )
  );

  return sortNotificationsByCreatedAtDesc(
    snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    }))
  ).slice(0, 30);
};

export const fetchNotificationsForUser = async (user, role) => {
  if (!user?.uid) return [];

  if (isBackendConfigured() && notificationBackendEnabled) {
    try {
      const response = await apiRequest(`/notifications/${user.uid}`, {
        authMode: 'required',
      });

      return response?.notifications || [];
    } catch (error) {
      if (!shouldUseFirestoreFallback(error)) {
        throw error;
      }

      notificationBackendEnabled = false;
    }
  }

  return fetchNotificationsFromFirestore(user, role);
};

export const markNotificationRead = async (notificationId) => {
  if (!notificationId) return null;

  if (isBackendConfigured() && notificationBackendEnabled) {
    try {
      const response = await apiRequest('/notifications/read', {
        method: 'PATCH',
        authMode: 'required',
        body: {
          notificationId,
          read: true,
        },
      });

      return response?.notification || null;
    } catch (error) {
      if (!shouldUseFirestoreFallback(error)) {
        throw error;
      }

      notificationBackendEnabled = false;
    }
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

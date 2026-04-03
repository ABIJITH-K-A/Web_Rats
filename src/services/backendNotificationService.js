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

  // Already sorted by Firestore orderBy, no need for client-side sort
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
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

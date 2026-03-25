import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { 
  collection, query, where, onSnapshot, 
  orderBy, limit, updateDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen for notifications relevant to the user or their role
    // Admins see all, others see their own or role-specific ones
    let q;
    if (['admin', 'owner', 'superadmin'].includes(userProfile?.role)) {
      q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else {
      const recipientIds = [user.uid, 'all'];
      if (userProfile?.role) {
        recipientIds.push(userProfile.role);
      }
      q = query(
        collection(db, 'notifications'),
        where('recipientId', 'in', recipientIds),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => markAsRead(n.id));
    await Promise.all(promises);
  };

  return (
    <DashboardContext.Provider value={{
      searchQuery,
      setSearchQuery,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

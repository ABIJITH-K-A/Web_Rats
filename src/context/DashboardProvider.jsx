import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { DashboardContext } from "./DashboardContext";
import { db } from "../config/firebase";
import { useAuth } from "./AuthContext";

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return undefined;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const nextNotifications = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((left, right) => {
            const leftTime = left.createdAt?.toDate?.()?.getTime?.() || 0;
            const rightTime = right.createdAt?.toDate?.()?.getTime?.() || 0;
            return rightTime - leftTime;
          });

        setNotifications(nextNotifications);
      },
      (error) => {
        console.error("Notification listener failed:", error);
        setNotifications([]);
      }
    );
  }, [user?.uid]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAsRead = async (notificationId) => {
    if (!notificationId) return;

    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
      readAt: serverTimestamp(),
    });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((notification) => !notification.read);
    if (!unread.length) return;

    const batch = writeBatch(db);
    unread.forEach((notification) => {
      batch.update(doc(db, "notifications", notification.id), {
        read: true,
        readAt: serverTimestamp(),
      });
    });
    await batch.commit();
  };

  return (
    <DashboardContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

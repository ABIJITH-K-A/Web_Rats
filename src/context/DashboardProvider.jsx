import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { normalizeRole } from "../utils/systemRules";
import {
  fetchNotificationsForUser,
  markNotificationRead,
} from "../services/backendNotificationService";
import { DashboardContext } from "./DashboardContext";

const NOTIFICATION_REFRESH_MS = 30000;

export const DashboardProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const nextNotifications = await fetchNotificationsForUser(
          user,
          normalizeRole(userProfile?.role)
        );

        if (!isMounted) return;

        setNotifications(nextNotifications);
        setUnreadCount(nextNotifications.filter((item) => !item.read).length);
      } catch (error) {
        // Silently ignore auth errors - user session may have expired
        if (error.code === 'missing_auth' || error.message?.includes('sign in')) {
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        console.error("Notification fetch error:", error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, NOTIFICATION_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [user, userProfile]);

  const markAsRead = async (notificationId) => {
    try {
      const target = notifications.find((item) => item.id === notificationId);
      if (target?.read) return;

      await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.read);
    await Promise.all(unread.map((item) => markAsRead(item.id)));
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

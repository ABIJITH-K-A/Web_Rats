import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { normalizeRole } from "../utils/systemRules";
import {
  fetchNotificationsForUser,
  markNotificationRead,
} from "../services/backendNotificationService";
import { DashboardContext } from "./DashboardContext";

const NOTIFICATION_REFRESH_MS = 30000;

const getErrorText = (value) => String(value || '').toLowerCase();

const isNotificationAuthError = (error) => {
  const message = getErrorText(error?.message);
  const originalMessage = getErrorText(error?.originalMessage);

  return (
    error?.code === 'missing_auth' ||
    error?.statusCode === 401 ||
    error?.statusCode === 403 ||
    message.includes('sign in') ||
    message.includes('log in') ||
    originalMessage.includes('missing bearer token') ||
    originalMessage.includes('invalid or expired auth token') ||
    originalMessage.includes('session expired')
  );
};

const isNotificationNetworkError = (error) => {
  const message = getErrorText(error?.message);
  const originalErrorMessage = getErrorText(error?.originalError?.message);

  return (
    error?.code === 'auth_network_failed' ||
    error?.code === 'connection_refused' ||
    message.includes('internet connection') ||
    message.includes('network error') ||
    originalErrorMessage.includes('network-request-failed')
  );
};

export const DashboardProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

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
        if (!isMounted) return;

        if (isNotificationAuthError(error)) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setNotifications([]);
          setUnreadCount(0);
          return;
        }

        if (isNotificationNetworkError(error)) {
          return;
        }

        console.error("Notification fetch error:", error);
      }
    };

    loadNotifications();
    intervalRef.current = window.setInterval(loadNotifications, NOTIFICATION_REFRESH_MS);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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

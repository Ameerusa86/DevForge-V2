"use client";

import { useEffect, useState, useCallback } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearOldNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(
  pollingInterval = 30000
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=20");

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage =
          error.details || error.error || `HTTP ${response.status}`;
        throw new Error(`Failed to fetch notifications: ${errorMessage}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  const clearOldNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/clear", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to clear notifications");

      await fetchNotifications();
    } catch (err) {
      console.error("Failed to clear old notifications:", err);
    }
  }, [fetchNotifications]);

  const refreshNotifications = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchNotifications, pollingInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearOldNotifications,
    refreshNotifications,
  };
}

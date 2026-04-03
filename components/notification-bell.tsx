"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  Info,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearOldNotifications,
  } = useNotifications();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "USER_REGISTERED":
      case "COURSE_ENROLLED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "COURSE_COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return "opacity-60 hover:opacity-100";

    switch (type) {
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return "bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50";
      case "USER_REGISTERED":
      case "COURSE_ENROLLED":
        return "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50";
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50";
      case "COURSE_COMPLETED":
        return "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50";
      default:
        return "hover:bg-accent";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[420px] max-w-[90vw] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-auto p-1.5 hover:bg-primary/10"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-auto p-1.5 hover:bg-destructive/10"
                title="Clear old notifications"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm text-center">
                You&apos;ll see updates here as they happen
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-2 py-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  getIcon={getNotificationIcon}
                  getColor={getNotificationColor}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />

        {/* Footer Actions */}
        <div className="flex flex-col gap-2 p-3">
          {notifications.length > 0 && (
            <a href="/notifications" className="w-full">
              <Button variant="outline" className="w-full justify-center gap-2">
                <Eye className="h-4 w-4" />
                View All Notifications
              </Button>
            </a>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="space-y-2 p-2 border border-destructive/20 rounded-md bg-destructive/5">
              <p className="text-sm font-medium">Clear old notifications?</p>
              <p className="text-xs text-muted-foreground">
                This will delete read notifications older than 30 days.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    clearOldNotifications();
                    setShowDeleteConfirm(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => Promise<void>;
  getIcon: (type: string) => React.ReactNode;
  getColor: (type: string, read: boolean) => string;
  formatTime: (date: string) => string;
}

function NotificationItem({
  notification,
  onRead,
  getIcon,
  getColor,
  formatTime,
}: NotificationItemProps) {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      setIsMarking(true);
      try {
        await onRead(notification.id);
      } finally {
        setIsMarking(false);
      }
    }
  };

  const handleNavigate = (e: React.MouseEvent) => {
    if (!notification.read) {
      onRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div
      className={cn(
        "group relative px-3 py-2 rounded-md transition-all",
        getColor(notification.type, notification.read)
      )}
    >
      <button
        onClick={handleNavigate}
        className="w-full text-left"
        title={notification.actionUrl ? "Click to open" : ""}
      >
        <div className="flex items-start gap-3 pr-8">
          <div className="mt-0.5 flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="font-medium text-sm line-clamp-1">
                {notification.title}
              </p>
              {!notification.read && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </button>

      {/* Action Buttons (visible on hover or if unread) */}
      {!notification.read && (
        <button
          onClick={handleMarkRead}
          disabled={isMarking}
          className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Mark as read"
        >
          <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
}

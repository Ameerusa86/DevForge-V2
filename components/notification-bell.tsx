"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Info,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
      case "COURSE_COMPLETED":
        return (
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-3.5" />
          </div>
        );
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return (
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" />
          </div>
        );
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return (
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff6636]/10 text-[#ff6636]">
            <Info className="size-3.5" />
          </div>
        );
      default:
        return (
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Info className="size-3.5" />
          </div>
        );
    }
  };

  const getNotificationColor = (read: boolean) => {
    if (read) {
      return "opacity-70 hover:opacity-100 hover:bg-muted/50";
    }
    return "bg-[#ff6636]/5 border border-[#ff6636]/20 hover:bg-[#ff6636]/10";
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
        <Button
          variant="outline"
          size="icon"
          aria-label="Notifications"
          className="relative size-10 rounded-xl border-border bg-background text-foreground hover:border-[#ff6636]/40 hover:bg-muted hover:text-[#ff6636] transition-all duration-200"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ff6636] px-1 text-[10px] font-extrabold text-white shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[400px] max-w-[92vw] rounded-2xl border-border bg-popover p-0 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <p className="text-[11px] font-semibold text-[#ff6636]">
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
                className="h-auto rounded-lg p-1.5 text-muted-foreground hover:bg-[#ff6636]/10 hover:text-[#ff6636]"
                title="Mark all as read"
              >
                <CheckCheck className="size-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm((prev) => !prev)}
                className="h-auto rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Clear old notifications"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-[360px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-muted-foreground">
              <Bell className="size-8 mb-2 opacity-40" />
              <p className="text-sm font-bold text-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-center mt-1">
                You&apos;ll see updates here as they happen
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 p-2">
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
          <Link href="/notifications" className="w-full">
            <Button
              variant="outline"
              className="w-full justify-center gap-2 rounded-xl border-border text-xs font-bold hover:border-[#ff6636]/40 hover:text-[#ff6636]"
            >
              <Eye className="size-3.5" />
              View All Notifications
            </Button>
          </Link>

          {showDeleteConfirm && (
            <div className="space-y-2 p-2.5 border border-destructive/20 rounded-xl bg-destructive/5">
              <p className="text-xs font-bold text-foreground">
                Clear old notifications?
              </p>
              <p className="text-[11px] text-muted-foreground">
                Deletes read notifications older than 30 days.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 rounded-lg text-xs font-bold"
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
                  className="flex-1 rounded-lg text-xs font-bold"
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
  getColor: (read: boolean) => string;
  formatTime: (date: string) => string;
}

function NotificationItem({
  notification,
  onRead,
  getIcon,
  getColor,
  formatTime,
}: NotificationItemProps) {
  const router = useRouter();
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

  const handleNavigate = () => {
    if (!notification.read) {
      void onRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      className={cn(
        "group relative px-3 py-2.5 rounded-xl transition-all",
        getColor(notification.read),
      )}
    >
      <button
        type="button"
        onClick={handleNavigate}
        className="w-full text-left"
        title={notification.actionUrl ? "Click to open" : undefined}
      >
        <div className="flex items-start gap-3 pr-7">
          <div className="mt-0.5 shrink-0">{getIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-xs text-foreground line-clamp-1">
                {notification.title}
              </p>
              {!notification.read && (
                <span className="size-1.5 rounded-full bg-[#ff6636] shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground/80 mt-1">
              {formatTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </button>

      {!notification.read && (
        <button
          type="button"
          onClick={handleMarkRead}
          disabled={isMarking}
          className="absolute right-2.5 top-2.5 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          title="Mark as read"
        >
          <Eye className="size-3.5 text-muted-foreground hover:text-[#ff6636]" />
        </button>
      )}
    </div>
  );
}

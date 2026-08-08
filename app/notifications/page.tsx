"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Filter,
  Bell,
  Clock,
  ChevronRight,
} from "lucide-react";
import { LearnerShell } from "@/components/lms/learner-shell";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
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

export default function NotificationsPage() {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearOldNotifications,
    refreshNotifications,
  } = useNotifications(10000);

  const filteredNotifications =
    filterTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "USER_REGISTERED":
      case "COURSE_ENROLLED":
      case "COURSE_COMPLETED":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="size-4.5" />
          </div>
        );
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="size-4.5" />
          </div>
        );
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Info className="size-4.5" />
          </div>
        );
      default:
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0">
            <AlertCircle className="size-4.5" />
          </div>
        );
    }
  };

  const formatTime = (createdAt: string) => {
    const now = new Date();
    const date = new Date(createdAt);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) {
      void markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  if (loading) {
    return (
      <LearnerShell pageTitle="Notifications" pageDescription="Loading updates...">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <LoadingState />
        </div>
      </LearnerShell>
    );
  }

  if (error) {
    return (
      <LearnerShell pageTitle="Notifications">
        <div className="mx-auto max-w-md px-4 py-16 flex items-center justify-center">
          <ErrorState
            type="generic"
            title="Failed to Load Notifications"
            message={error}
            onRetry={refreshNotifications}
          />
        </div>
      </LearnerShell>
    );
  }

  return (
    <LearnerShell
      pageTitle="Notifications"
      pageDescription="Stay updated with course announcements, replies, and system alerts"
    >
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        
        {/* Top Filter and Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
                filterTab === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Filter className="size-3.5" /> All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unread")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
                filterTab === "unread"
                  ? "bg-card text-[#ff6636] shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlertCircle className="size-3.5" /> Unread ({unreadCount})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <CheckCheck className="size-3.5 text-[#ff6636]" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearOldNotifications}
                className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Clear Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
            <Bell className="size-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">
              {filterTab === "unread" ? "You're all caught up!" : "No notifications yet"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
              {filterTab === "unread"
                ? "No unread alerts at this time."
                : "Course updates and system announcements will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "group flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-2xs",
                  notif.read
                    ? "border-border/60 bg-card/60 hover:bg-muted/40 hover:border-border"
                    : "border-[#ff6636]/30 bg-[#ff6636]/5 hover:bg-[#ff6636]/10"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {getNotificationIcon(notif.type)}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-xs leading-snug", notif.read ? "font-bold text-foreground" : "font-extrabold text-foreground")}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="size-2 rounded-full bg-[#ff6636] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium pt-0.5">
                      <Clock className="size-3" />
                      <span>{formatTime(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {notif.actionUrl && (
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#ff6636] transition-transform group-hover:translate-x-0.5 shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </LearnerShell>
  );
}

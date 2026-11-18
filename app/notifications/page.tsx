"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Info,
  Trash2,
} from "lucide-react";

import {
  LearnerPageShell,
  LearnerWorkspaceNav,
} from "@/components/lms/learner-workspace-nav";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
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

  return (
    <LearnerPageShell activePath="/notifications">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
        <div className="pointer-events-none absolute -top-40 right-0 size-[460px] rounded-full bg-[#ff6636]/5 blur-3xl" />
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative space-y-6">
          <LearnerWorkspaceNav activePath="/notifications" />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                <Bell className="size-3.5" /> Activity Feed
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Notifications{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  Center
                </span>
              </h1>
              <p className="text-sm font-semibold text-muted-foreground max-w-xl">
                Stay updated with course announcements, enrollment confirmations,
                and system alerts.
              </p>
            </div>

            {!loading && !error && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="rounded-xl text-xs font-bold gap-1.5 bg-card"
                  >
                    <CheckCheck className="size-3.5 text-[#ff6636]" />
                    Mark All Read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearOldNotifications}
                    className="rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive gap-1.5 bg-card"
                  >
                    <Trash2 className="size-3.5" />
                    Clear Read
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-12">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md py-12 flex items-center justify-center">
            <ErrorState
              type="generic"
              title="Failed to Load Notifications"
              message={error}
              onRetry={refreshNotifications}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
                  filterTab === "all"
                    ? "bg-[#ff6636] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
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
                    ? "bg-[#ff6636] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <AlertCircle className="size-3.5" /> Unread ({unreadCount})
              </button>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center space-y-3">
                <Bell className="size-10 text-muted-foreground/40 mx-auto" />
                <h2 className="text-base font-extrabold text-foreground">
                  {filterTab === "unread"
                    ? "You're all caught up!"
                    : "No notifications yet"}
                </h2>
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
                      "group flex items-start justify-between gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-2xs",
                      notif.read
                        ? "border-border/70 bg-card hover:bg-muted/40 hover:border-border"
                        : "border-[#ff6636]/35 bg-[#ff6636]/5 hover:bg-[#ff6636]/10",
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {getNotificationIcon(notif.type)}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-xs sm:text-sm leading-snug",
                              notif.read
                                ? "font-bold text-foreground"
                                : "font-extrabold text-foreground",
                            )}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="size-2 rounded-full bg-[#ff6636] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium pt-0.5">
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
        )}
      </section>
    </LearnerPageShell>
  );
}

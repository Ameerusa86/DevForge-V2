"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Filter,
  X,
  Bell,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";

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
  } = useNotifications(10000); // Poll every 10 seconds

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
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
        );
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return (
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
            <AlertTriangle className="size-5" />
          </div>
        );
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return (
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Info className="size-5" />
          </div>
        );
      default:
        return (
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <AlertCircle className="size-5" />
          </div>
        );
    }
  };

  const getNotificationBadge = (type: string) => {
    const formatted = type.replace("_", " ");
    switch (type) {
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600">{formatted}</span>;
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">{formatted}</span>;
      case "USER_REGISTERED":
      case "COURSE_ENROLLED":
        return <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600">{formatted}</span>;
      case "COURSE_COMPLETED":
        return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">{formatted}</span>;
      default:
        return <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{formatted}</span>;
    }
  };

  const formatDate = (dateString: string) => {
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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        <MarketingPublicHeader activePath="/notifications" showSearch={false} />
        <div className="flex-1 mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-8 w-full">
          <LoadingState />
        </div>
        <MarketingPublicFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        <MarketingPublicHeader activePath="/notifications" showSearch={false} />
        <div className="flex-1 mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center">
          <ErrorState
            type="generic"
            title="Failed to Load Notifications"
            message={error}
            onRetry={refreshNotifications}
          />
        </div>
        <MarketingPublicFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/notifications" showSearch={false} />

      <main className="flex-1">
        {/* ── Hero section ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <Bell className="size-3.5" /> Updates Center
                </span>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Your Notifications
                </h1>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-md">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}. Stay updated with your learning paths.`
                    : "You are all caught up! No unread notifications."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] hover:bg-[#ff6636]/5 transition-all duration-200"
                  >
                    <CheckCheck className="size-4 text-[#ff6636]" />
                    Mark All Read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearOldNotifications}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-red-400/60 hover:text-red-500 hover:bg-red-500/5 transition-all duration-200"
                  >
                    <Trash2 className="size-4 text-red-500" />
                    Clear Old
                  </button>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ── Main content ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="space-y-6">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 bg-muted/30 p-1.5 rounded-2xl border border-border/40 w-fit">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={cn(
                  "px-4.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
                  filterTab === "all"
                    ? "bg-[#ff6636] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Filter className="size-3.5" /> All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("unread")}
                className={cn(
                  "px-4.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
                  filterTab === "unread"
                    ? "bg-[#ff6636] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <AlertCircle className="size-3.5" /> Unread ({unreadCount})
              </button>
            </div>

            {/* List */}
            {filteredNotifications.length === 0 ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
                {filterTab === "unread" ? (
                  <>
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-5">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h3 className="text-lg font-extrabold text-foreground">All caught up!</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground font-semibold leading-relaxed">
                      You have read all current notifications.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636] mb-5">
                      <Bell className="size-8" />
                    </div>
                    <h3 className="text-lg font-extrabold text-foreground">No notifications yet</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground font-semibold leading-relaxed">
                      You will receive activity updates, alerts, and course notices here as they happen.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onNavigate={(url) => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (url) {
                        router.push(url);
                      }
                    }}
                    getIcon={getNotificationIcon}
                    getBadge={getNotificationBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => Promise<void>;
  onNavigate: (url?: string) => void;
  getIcon: (type: string) => React.ReactNode;
  getBadge: (type: string) => React.ReactNode;
  formatDate: (date: string) => string;
}

function NotificationCard({
  notification,
  onRead,
  onNavigate,
  getIcon,
  getBadge,
  formatDate,
}: NotificationCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border transition-all duration-300",
        !notification.read
          ? "border-[#ff6636]/40 bg-[#ff6636]/5 dark:bg-[#ff6636]/5 shadow-sm shadow-[#ff6636]/5"
          : "border-border bg-card hover:border-border/80"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 shrink-0">{getIcon(notification.type)}</div>

          <div className="flex-1 min-w-0 space-y-1.5">
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground truncate leading-snug">
                  {notification.title}
                </h3>
                {!notification.read && (
                  <span className="size-2 rounded-full bg-[#ff6636] shrink-0" />
                )}
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground leading-relaxed break-words">
              {notification.message}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-4 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                {getBadge(notification.type)}
                <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <Clock className="size-3 text-[#ff6636]" />
                  {formatDate(notification.createdAt)}
                </span>
              </div>

              <div className="flex gap-2 shrink-0">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRead(notification.id);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all"
                  >
                    <CheckCheck className="size-3.5 text-[#ff6636]" />
                    <span className="hidden sm:inline">Mark Read</span>
                  </button>
                )}
                {notification.actionUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(notification.actionUrl);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-[#ff6636] hover:bg-[#e95a2b] text-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
                  >
                    Open <ChevronRight className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}

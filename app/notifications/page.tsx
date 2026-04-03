"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Filter,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "SYSTEM_ALERT":
      case "ADMIN_ALERT":
        return <Badge variant="destructive">{type.replace("_", " ")}</Badge>;
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return <Badge variant="default">{type.replace("_", " ")}</Badge>;
      case "USER_REGISTERED":
      case "COURSE_ENROLLED":
        return <Badge variant="secondary">{type.replace("_", " ")}</Badge>;
      case "COURSE_COMPLETED":
        return <Badge className="bg-green-600">{type.replace("_", " ")}</Badge>;
      default:
        return <Badge variant="outline">{type.replace("_", " ")}</Badge>;
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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container mx-auto py-8">
          <LoadingState />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container mx-auto py-8">
          <ErrorState
            type="generic"
            title="Failed to Load Notifications"
            message={error}
            onRetry={refreshNotifications}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "All caught up!"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark All Read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    clearOldNotifications();
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Old
                </Button>
              )}
            </div>
          </div>

          {/* Tabs for filtering */}
          <Tabs
            defaultValue="all"
            onValueChange={(value) => setFilterTab(value as "all" | "unread")}
          >
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="all" className="gap-2">
                <Filter className="h-4 w-4" />
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filterTab} className="space-y-4">
              {/* Notifications List */}
              {filteredNotifications.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    {filterTab === "unread" ? (
                      <>
                        <CheckCircle className="h-12 w-12 mb-4 opacity-50 text-green-500" />
                        <p className="text-lg font-medium">All caught up!</p>
                        <p className="text-sm">No unread notifications</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No notifications</p>
                        <p className="text-sm">
                          You&apos;ll see updates here as they happen
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Navbar() {
  const router = useRouter();
  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            Home
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin")}
          >
            Admin
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const router = useRouter();
  return (
    <footer className="border-t bg-muted/50 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => router.push("/")}
                >
                  Home
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => router.push("/admin")}
                >
                  Admin Dashboard
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => router.push("/courses")}
                >
                  View Courses
                </Button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">My Account</h4>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => router.push("/messages")}
                >
                  Messages
                </Button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              Stay updated with your course enrollments, publications, and
              system alerts.
            </p>
          </div>
        </div>
        <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 LMS Platform. All rights reserved.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to Top ↑
          </Button>
        </div>
      </div>
    </footer>
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
      className={`transition-all hover:shadow-md ${
        !notification.read
          ? "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900"
          : "hover:bg-accent"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">{getIcon(notification.type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  {notification.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 gap-2">
              <div className="flex gap-2 items-center flex-wrap">
                {getBadge(notification.type)}
                <span className="text-xs text-muted-foreground">
                  {formatDate(notification.createdAt)}
                </span>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRead(notification.id);
                    }}
                    className="h-8"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Mark Read</span>
                  </Button>
                )}
                {notification.actionUrl && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(notification.actionUrl);
                    }}
                    className="h-8"
                  >
                    Open →
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

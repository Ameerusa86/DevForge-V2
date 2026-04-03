"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useNotifications } from "@/hooks/use-notifications";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function NotificationTestPage() {
  const [creating, setCreating] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications(5000); // Poll every 5 seconds for testing

  const { data: session } = authClient.useSession();

  const createTestNotification = async () => {
    if (!session?.user?.id) {
      toast.error("Not authenticated");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Notification",
          message: `Created at ${new Date().toLocaleTimeString()}`,
          type: "INFO",
          actionUrl: "/notifications",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to create");
      }

      toast.success("Notification created!");
      await refreshNotifications();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create notification: ${message}`);
      console.error("Error:", error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification System Test</h1>
          <p className="text-muted-foreground mt-2">
            Test and debug the notification system
          </p>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>Authenticated:</strong> {session?.user ? "Yes" : "No"}
            </p>
            <p>
              <strong>User ID:</strong> {session?.user?.id || "N/A"}
            </p>
            <p>
              <strong>User Email:</strong> {session?.user?.email || "N/A"}
            </p>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <ErrorState
            type="generic"
            title="Error"
            message={error}
            onRetry={refreshNotifications}
          />
        )}

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-600">
                  {unreadCount}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={createTestNotification}
                disabled={creating || !session?.user?.id}
                className="w-full"
              >
                {creating ? "Creating..." : "Create Test Notification"}
              </Button>
              <Button
                onClick={() => refreshNotifications()}
                variant="outline"
                className="w-full"
              >
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="secondary"
                  className="w-full"
                >
                  Mark All as Read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-muted-foreground">
                No notifications yet. Create one to test!
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded border ${
                      notification.read
                        ? "bg-muted"
                        : "bg-blue-50 dark:bg-blue-950 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(
                {
                  sessionExists: !!session,
                  userAuthenticated: !!session?.user,
                  userId: session?.user?.id,
                  notificationCount: notifications.length,
                  unreadCount,
                  loading,
                  error,
                  pollingInterval: "5 seconds",
                  apiEndpoint: "/api/notifications",
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

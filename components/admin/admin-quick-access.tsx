"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminQuickAccess() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const session = await response.json();
          setIsAdmin(session?.user?.role === "Admin");
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
      }
    };

    checkAdminStatus();
  }, []);

  const handleActivateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/suspended-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), action: "activate" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate user");
      }

      toast.success(data.message || "User activated successfully");
      setEmail("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to activate user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Admin Quick Access</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Quickly activate a suspended user account by entering their email
          address below.
        </p>
        <form onSubmit={handleActivateUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-email" className="text-sm">
              User Email Address
            </Label>
            <Input
              id="user-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Activate Account
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild className="gap-2">
              <a href="/admin/users" target="_blank">
                Manage All Users
              </a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

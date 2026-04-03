"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data?.user?.mustChangePassword) {
          router.push("/");
          return;
        }
      } catch {
        router.push("/login");
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast.success("Password updated successfully");
      router.push("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-border/60 bg-card/90">
        <CardContent className="pt-10 pb-8 px-6 sm:px-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Shield className="h-3.5 w-3.5" /> Security Required
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Set a new password
            </h1>
            <p className="text-sm text-muted-foreground">
              You&apos;re using a temporary password. Please set a permanent
              one.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Temporary Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-11"
                placeholder="Enter temporary password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="h-11"
                placeholder="Create a strong password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="h-11"
                placeholder="Confirm your new password"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-2 text-foreground">
                <LockKeyhole className="h-4 w-4" />
                Password tips
              </div>
              <ul className="space-y-1">
                <li>• At least 8 characters</li>
                <li>• Use a mix of letters and numbers</li>
                <li>• Avoid common words</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 gap-2"
            >
              {isLoading ? (
                "Updating..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

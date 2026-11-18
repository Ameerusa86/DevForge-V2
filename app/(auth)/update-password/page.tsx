"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, LockKeyhole, Shield } from "lucide-react";
import { toast } from "sonner";

import {
  MarketingMiniFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DevForgeSpinner } from "@/components/ui/loading-state";

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

    void checkStatus();
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
      router.push("/dashboard");
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
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <MarketingPublicHeader activePath="/login" compact showSearch={false} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <DevForgeSpinner size="md" className="mx-auto" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Verifying account…
            </p>
          </div>
        </main>
        <MarketingMiniFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingPublicHeader activePath="/login" compact showSearch={false} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ff6636]">
              <Shield className="size-3.5" /> Security Required
            </span>
            <h1 className="text-2xl font-extrabold text-foreground">
              Set a new password
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              You&apos;re using a temporary password. Please set a permanent one
              to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-bold">
                Temporary Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-border"
                placeholder="Enter temporary password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-bold">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 rounded-xl border-border"
                placeholder="Create a strong password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-bold">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 rounded-xl border-border"
                placeholder="Confirm your new password"
              />
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <LockKeyhole className="size-3.5 text-[#ff6636]" />
                Password guidelines
              </div>
              <ul className="space-y-1">
                <li>• At least 8 characters</li>
                <li>• Mix of letters, numbers, or symbols</li>
                <li>• Avoid previously used passwords</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs uppercase tracking-wider gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </div>
      </main>

      <MarketingMiniFooter />
    </div>
  );
}

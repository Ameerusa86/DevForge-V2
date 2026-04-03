"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Chrome, Github, Shield, AlertTriangle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MarketingAuthShell } from "@/components/marketing/auth-shell";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        console.log("Login error object:", error); // Debug log
        console.log("Error message:", error.message); // Debug log
        console.log("Error code:", error.code); // Debug log

        // Provide descriptive error messages based on the error
        let errorMessage = "";
        const errorMsg = error.message?.toLowerCase() || "";
        const errorCode = error.code?.toLowerCase() || "";

        // Check by error code first
        if (
          errorCode.includes("user_not_found") ||
          errorCode.includes("user-not-found") ||
          errorCode.includes("invalid_email")
        ) {
          errorMessage = "No account found with this email address";
        } else if (
          errorCode.includes("invalid_password") ||
          errorCode.includes("invalid-password")
        ) {
          errorMessage = "Incorrect password. Please try again";
        }
        // Check by message content
        else if (
          errorMsg.includes("user") ||
          errorMsg.includes("not found") ||
          errorMsg.includes("does not exist") ||
          errorMsg.includes("no user") ||
          errorMsg.includes("account not found") ||
          (errorMsg.includes("email") && !errorMsg.includes("verify"))
        ) {
          errorMessage = "No account found with this email address";
        } else if (
          errorMsg.includes("password") ||
          errorMsg.includes("invalid") ||
          errorMsg.includes("incorrect") ||
          errorMsg.includes("unauthorized") ||
          errorMsg.includes("credentials")
        ) {
          errorMessage = "Incorrect password. Please try again";
        } else if (errorMsg.includes("email") && errorMsg.includes("verify")) {
          errorMessage = "Please verify your email address first";
        } else if (
          errorMsg.includes("suspended") ||
          errorCode.includes("forbidden")
        ) {
          toast.error("Your account has been suspended", {
            description: "Redirecting to account status page...",
            duration: 3000,
          });
          setTimeout(() => {
            router.push("/suspended");
          }, 1500);
          return;
        } else if (errorMsg.includes("failed to login")) {
          // Check if email is empty or password is empty
          if (!email.trim()) {
            errorMessage = "Please enter your email address";
          } else if (!password.trim()) {
            errorMessage = "Please enter your password";
          } else {
            errorMessage =
              "No account found with this email address or password is incorrect";
          }
        } else {
          errorMessage =
            error.message ||
            "Failed to login. Please check your email and password";
        }

        toast.error(errorMessage);
        return;
      }

      if (data) {
        toast.success("Login successful!");
        try {
          const res = await fetch("/api/profile", { cache: "no-store" });
          if (res.ok) {
            const profile = await res.json();
            if (profile?.user?.mustChangePassword) {
              router.push("/update-password");
              return;
            }
          }
        } catch {
          // ignore profile check failures
        }
        router.push("/");
      }
    } catch (error: unknown) {
      console.log("Catch error:", error); // Debug log

      // Handle catch errors
      let errorMessage = "An unexpected error occurred";
      const errorMsg =
        (error as unknown as { message?: string })?.message?.toLowerCase() ||
        "";

      if (errorMsg.includes("suspended") || errorMsg.includes("forbidden")) {
        toast.error("Your account has been suspended", {
          description: "Redirecting to account status page...",
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/suspended");
        }, 1500);
        return;
      } else if (
        errorMsg.includes("user") ||
        errorMsg.includes("not found") ||
        errorMsg.includes("no user")
      ) {
        errorMessage = "No account found with this email address";
      } else if (
        errorMsg.includes("password") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("incorrect")
      ) {
        errorMessage = "Incorrect password. Please try again";
      } else if (errorMsg) {
        errorMessage =
          (error as unknown as { message?: string })?.message || "";
      }

      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      const errorMsg =
        (error as unknown as { message?: string })?.message?.toLowerCase() ||
        "";
      if (errorMsg.includes("suspended") || errorMsg.includes("forbidden")) {
        toast.error("Your account has been suspended", {
          description: "Redirecting to account status page...",
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/suspended");
        }, 1500);
      } else {
        toast.error("Failed to login with Google");
      }
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error) {
      const errorMsg =
        (error as unknown as { message?: string })?.message?.toLowerCase() ||
        "";
      if (errorMsg.includes("suspended") || errorMsg.includes("forbidden")) {
        toast.error("Your account has been suspended", {
          description: "Redirecting to account status page...",
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/suspended");
        }, 1500);
      } else {
        toast.error("Failed to login with GitHub");
      }
      console.error(error);
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MarketingAuthShell
        mode="login"
        eyebrow="Sign in"
        title="Sign in to your account"
        subtitle="Pick up where you left off, continue your learning path, and get back into your courses without friction."
        switchHref="/register"
        switchPrefix="New here?"
        switchLabel="Create account"
        sideTitle="Welcome back to focused learning"
        sideDescription="Keep your momentum with saved progress, instructor-led paths, and a cleaner route back to your next lesson."
        bullets={[
          "Continue active courses instantly",
          "Track progress and saved lessons",
          "Stay connected to your learning community",
        ]}
      >
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-[#1d2026]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-12 rounded-none border-[#e9eaf0]"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-[#1d2026]">
                Password
              </Label>
              <span className="text-xs font-medium text-[#ff6636]">
                Forgot password?
              </span>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-12 rounded-none border-[#e9eaf0]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-none bg-[#ff6636] text-sm font-semibold text-white hover:bg-[#e95a2b]"
          >
            {isLoading ? "Logging in..." : "Sign In"}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-[#e9eaf0]" />
          <span className="px-3 text-xs font-medium uppercase tracking-[0.12em] text-[#8c94a3]">
            Or continue with
          </span>
          <div className="flex-1 border-t border-[#e9eaf0]" />
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="h-12 w-full rounded-none border-[#e9eaf0] text-sm font-medium"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleGithubLogin}
            className="h-12 w-full rounded-none border-[#e9eaf0] text-sm font-medium"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-[#6e7485]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[#ff6636]">
            Sign up for free
          </Link>
        </p>
      </MarketingAuthShell>

      <Dialog open={showSuspendedModal} onOpenChange={setShowSuspendedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl">
              Account Suspended
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your account has been suspended and you cannot access the platform
              at this time.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              What does this mean?
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account has been temporarily restricted due to a policy
              violation or administrative action. You will not be able to log in
              or access any course materials until this restriction is lifted.
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Need help?</h4>
            <p className="text-sm text-muted-foreground">
              If you believe this is a mistake or would like to appeal this
              decision, please contact our support team:
            </p>
            <div className="flex flex-col gap-1 text-sm">
              <a
                href="mailto:support@devforge.com"
                className="text-primary hover:underline"
              >
                📧 support@devforge.com
              </a>
              <p className="text-muted-foreground">
                Include your account email for faster resolution.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => {
                setShowSuspendedModal(false);
                setEmail("");
                setPassword("");
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginPage;

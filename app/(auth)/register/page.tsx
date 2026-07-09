"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Github, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MarketingAuthShell } from "@/components/marketing/auth-shell";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email(
        {
          name,
          email,
          password,
          callbackURL: "/",
        },
        {
          onSuccess: () => {
            toast.success("Account created successfully!");
            router.push("/");
          },
          onError: (ctx) => {
            console.log("Sign up error:", ctx.error);

            let errorMessage = "";
            const errorMsg = ctx.error.message?.toLowerCase() || "";
            const errorCode = ctx.error.code?.toLowerCase() || "";

            if (
              errorCode.includes("email_already_exists") ||
              errorCode.includes("email-already-exists") ||
              errorCode.includes("user_already_exists")
            ) {
              errorMessage =
                "This email is already registered. Please sign in instead";
            } else if (
              errorMsg.includes("already exists") ||
              errorMsg.includes("already registered") ||
              errorMsg.includes("already in use")
            ) {
              errorMessage =
                "This email is already registered. Please sign in instead";
            } else if (
              errorMsg.includes("password") ||
              errorMsg.includes("invalid")
            ) {
              errorMessage = "Password must be at least 8 characters";
            } else if (errorMsg.includes("email")) {
              errorMessage = "Please enter a valid email address";
            } else {
              errorMessage = ctx.error.message || "Failed to create account";
            }

            toast.error(errorMessage);
          },
        },
      );

      if (error) {
        console.log("Sign up error (if block):", error);

        let errorMessage = "";
        const errorMsg = error.message?.toLowerCase() || "";
        const errorCode = error.code?.toLowerCase() || "";

        if (
          errorCode.includes("email_already_exists") ||
          errorCode.includes("email-already-exists") ||
          errorCode.includes("user_already_exists")
        ) {
          errorMessage =
            "This email is already registered. Please sign in instead";
        } else if (
          errorMsg.includes("already exists") ||
          errorMsg.includes("already registered") ||
          errorMsg.includes("already in use")
        ) {
          errorMessage =
            "This email is already registered. Please sign in instead";
        } else if (
          errorMsg.includes("password") ||
          errorMsg.includes("invalid")
        ) {
          errorMessage = "Password must be at least 8 characters";
        } else if (errorMsg.includes("email")) {
          errorMessage = "Please enter a valid email address";
        } else {
          errorMessage = error.message || "Failed to create account";
        }

        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      console.log("Catch error (sign up):", error);

      let errorMessage = "An unexpected error occurred";
      const errorMsg = (error as Error)?.message?.toLowerCase() || "";

      if (
        errorMsg.includes("already exists") ||
        errorMsg.includes("already registered")
      ) {
        errorMessage =
          "This email is already registered. Please sign in instead";
      } else if (errorMsg.includes("password")) {
        errorMessage = "Password must be at least 8 characters";
      } else if (errorMsg.includes("email")) {
        errorMessage = "Please enter a valid email address";
      } else if (errorMsg) {
        errorMessage = (error as Error).message;
      }

      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      toast.error("Failed to sign up with Google");
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error) {
      toast.error("Failed to sign up with GitHub");
      console.error(error);
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-10 w-10 text-[#ff6636] mx-auto mb-4" />
          <p className="text-xs font-semibold text-muted-foreground">Checking authentication…</p>
        </div>
      </div>
    );
  }

  return (
    <MarketingAuthShell
      mode="register"
      eyebrow="Create account"
      title="Create your account"
      subtitle="Start with a clean path into your next course, save progress across devices, and join the DevForge learning community."
      switchHref="/login"
      switchPrefix="Already a member?"
      switchLabel="Sign in"
      sideTitle="Build skills with structure from day one"
      sideDescription="Join a platform designed around practical paths, guided progress, and the momentum to keep shipping."
      bullets={[
        "Free to start learning",
        "Progress synced across your courses",
        "Certificates and community support built in",
      ]}
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Full Name
          </Label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10 transition-all"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Email Address
          </Label>
          <input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10 transition-all"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Password
            </Label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 chars"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10 transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Confirm Password
            </Label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10 transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-xs font-black uppercase tracking-widest text-white shadow-md hover:shadow-lg shadow-[#ff6636]/10 transition-all duration-200"
        >
          {isLoading ? <><Loader2 className="size-3.5 animate-spin" /> Creating Account…</> : "Create Account"}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-border/80" />
        <span className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/75">
          Or continue with
        </span>
        <div className="flex-1 border-t border-border/80" />
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignUp}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:bg-[#ff6636]/5 transition-all"
        >
          <Chrome className="h-4 w-4" />
          Continue with Google
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGithubSignUp}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:bg-[#ff6636]/5 transition-all"
        >
          <Github className="h-4 w-4" />
          Continue with GitHub
        </button>
      </div>

      <p className="mt-8 text-center text-xs font-semibold text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#ff6636] hover:text-[#e95a2b] transition-colors">
          Sign in
        </Link>
      </p>
    </MarketingAuthShell>
  );
};

export default RegisterPage;

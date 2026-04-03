"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Github } from "lucide-react";
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

            // Check by error code first
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

        // Check by error code first
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
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
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
      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-[#1d2026]">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-12 rounded-none border-[#e9eaf0]"
            required
          />
        </div>

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

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-[#1d2026]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-12 rounded-none border-[#e9eaf0]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-[#1d2026]"
            >
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="h-12 rounded-none border-[#e9eaf0]"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-none bg-[#ff6636] text-sm font-semibold text-white hover:bg-[#e95a2b]"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
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
          onClick={handleGoogleSignUp}
          className="h-12 w-full rounded-none border-[#e9eaf0] text-sm font-medium"
        >
          <Chrome className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={handleGithubSignUp}
          className="h-12 w-full rounded-none border-[#e9eaf0] text-sm font-medium"
        >
          <Github className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-[#6e7485]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#ff6636]">
          Sign in
        </Link>
      </p>
    </MarketingAuthShell>
  );
};

export default RegisterPage;

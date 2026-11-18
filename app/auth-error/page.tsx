"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Home, Mail } from "lucide-react";

import {
  MarketingMiniFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Button } from "@/components/ui/button";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "UNKNOWN";
  const message =
    searchParams.get("message") ||
    "An unexpected error occurred during authentication";

  const [errorType] = useState<string>(error);
  const [errorMessage] = useState<string>(message);

  useEffect(() => {
    if (
      error === "FORBIDDEN" ||
      error === "YOUR_ACCOUNT_IS_SUSPENDED_PLEASE_CONTACT_AN_ADMINISTRATOR" ||
      message?.toLowerCase().includes("suspended")
    ) {
      const timer = setTimeout(() => {
        window.location.href = "/suspended";
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  const isSuspended =
    errorType === "FORBIDDEN" ||
    errorType === "YOUR_ACCOUNT_IS_SUSPENDED_PLEASE_CONTACT_AN_ADMINISTRATOR" ||
    errorMessage?.toLowerCase().includes("suspended");

  if (isSuspended) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <MarketingPublicHeader activePath="/login" compact showSearch={false} />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg rounded-3xl border border-destructive/25 bg-card p-8 sm:p-10 text-center shadow-xl space-y-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive animate-pulse">
              <AlertTriangle className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                Account Suspended
              </h1>
              <p className="text-sm font-semibold text-muted-foreground">
                Your account has been temporarily restricted.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-left space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Redirecting you to suspension details…
              </p>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[#ff6636] animate-[loading_2s_ease-in-out] rounded-full" />
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="rounded-xl border-border font-bold text-xs"
            >
              <Link href="/suspended">View Details</Link>
            </Button>
          </div>
          <style jsx>{`
            @keyframes loading {
              from {
                width: 0%;
              }
              to {
                width: 100%;
              }
            }
          `}</style>
        </main>
        <MarketingMiniFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingPublicHeader activePath="/login" compact showSearch={false} />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-8" />
            </div>
            <span className="inline-flex rounded-full bg-destructive/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
              Auth Diagnostic
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Authentication Error
            </h1>
            <p className="text-sm font-semibold text-muted-foreground">
              We encountered an issue signing you in.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Error Code
              </p>
              <code className="mt-1 block rounded-xl border border-border bg-background p-3 text-xs text-destructive font-mono">
                {errorType}
              </code>
            </div>
            {errorMessage && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Details
                </p>
                <p className="mt-1 text-xs font-medium text-foreground leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2.5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              What you can try
            </h2>
            <ul className="space-y-1.5 text-xs font-medium text-muted-foreground">
              <li>• Try signing in again with a different provider</li>
              <li>• Clear your browser cookies for this site</li>
              <li>• Verify your email and password credentials</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              asChild
              className="flex-1 rounded-xl border-border font-bold text-xs gap-2"
            >
              <Link href="/login">
                <ArrowLeft className="size-4" />
                Back to Login
              </Link>
            </Button>
            <Button
              asChild
              className="flex-1 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs gap-2"
            >
              <Link href="/contact">
                <Mail className="size-4" />
                Contact Support
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-border text-center">
            <Link
              href="/"
              className="text-xs font-bold text-muted-foreground hover:text-[#ff6636] inline-flex items-center gap-1.5 transition-colors"
            >
              <Home className="size-3.5" />
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
      <MarketingMiniFooter />
    </div>
  );
}

function AuthErrorFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingPublicHeader activePath="/login" compact showSearch={false} />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-10 text-center shadow-xl space-y-4">
          <div className="size-12 rounded-2xl bg-muted mx-auto animate-pulse" />
          <div className="h-6 bg-muted rounded-lg w-1/2 mx-auto animate-pulse" />
          <div className="h-4 bg-muted rounded-lg w-2/3 mx-auto animate-pulse" />
        </div>
      </main>
      <MarketingMiniFooter />
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}

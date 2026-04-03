"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Mail, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "UNKNOWN";
  const message =
    searchParams.get("message") ||
    "An unexpected error occurred during authentication";

  const [errorType] = useState<string>(error);
  const [errorMessage] = useState<string>(message);

  useEffect(() => {
    // Auto-redirect suspended users to the suspended page
    if (
      error === "FORBIDDEN" ||
      error === "YOUR_ACCOUNT_IS_SUSPENDED_PLEASE_CONTACT_AN_ADMINISTRATOR" ||
      message?.toLowerCase().includes("suspended")
    ) {
      setTimeout(() => {
        window.location.href = "/suspended";
      }, 2400);
    }
  }, [error, message]);

  const isSuspended =
    errorType === "FORBIDDEN" ||
    errorType === "YOUR_ACCOUNT_IS_SUSPENDED_PLEASE_CONTACT_AN_ADMINISTRATOR" ||
    errorMessage?.toLowerCase().includes("suspended");

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/40 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-destructive/20">
          <CardContent className="pt-12 pb-10 px-6 sm:px-12 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-6 animate-pulse">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-3">
              Account Suspended
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your account has been temporarily restricted
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground">
                Redirecting you to more information...
              </p>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[loading_2s_ease-in-out]" />
              </div>
            </div>

            <Button asChild variant="outline" className="gap-2">
              <Link href="/suspended">View Details</Link>
            </Button>
          </CardContent>
        </Card>

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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardContent className="pt-12 pb-10 px-6 sm:px-12">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Authentication Error
            </h1>
            <p className="text-lg text-muted-foreground">
              We encountered an issue signing you in
            </p>
          </div>

          <Card className="bg-muted/50 border-0 mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Error Code:
                </p>
                <code className="block text-xs bg-background p-3 rounded border text-destructive font-mono">
                  {errorType}
                </code>
                {errorMessage && (
                  <>
                    <p className="text-sm font-semibold text-foreground pt-3">
                      Details:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {errorMessage}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-card border rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-sm mb-3">What can you do?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Try logging in again with a different method</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Clear your browser cache and cookies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Make sure your account credentials are correct</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Contact support if the issue persists</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <a href="mailto:support@devforge.com">
                <Mail className="h-4 w-4" />
                Contact Support
              </a>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthErrorFallback() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardContent className="pt-12 pb-10 px-6 sm:px-12 text-center">
          <div className="h-8 w-8 rounded-full bg-muted mx-auto mb-6 animate-pulse" />
          <div className="h-6 bg-muted rounded mb-4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 mx-auto animate-pulse" />
        </CardContent>
      </Card>
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

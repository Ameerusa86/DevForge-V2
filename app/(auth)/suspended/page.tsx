"use client";

import Link from "next/link";
import { AlertTriangle, Home, Mail, MessageSquare } from "lucide-react";

import { AdminQuickAccess } from "@/components/admin/admin-quick-access";
import {
  MarketingMiniFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Button } from "@/components/ui/button";

export default function SuspendedAccountPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingPublicHeader activePath="/login" compact showSearch={false} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl space-y-7">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-8" />
            </div>
            <span className="inline-flex rounded-full bg-destructive/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
              Access Restricted
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Account Suspended
            </h1>
            <p className="text-sm font-semibold text-muted-foreground">
              Your account has been temporarily restricted from signing in.
            </p>
          </div>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#ff6636]/25 bg-[#ff6636]/5 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <MessageSquare className="size-4.5 text-[#ff6636]" />
              <span>Need to resolve this?</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
              If you believe your account was suspended in error or want to
              submit an appeal, reach out to our support team. We review appeals
              and typically respond within 24–48 hours.
            </p>

            <div className="space-y-2.5">
              <a
                href="mailto:support@devforge.com?subject=Account%20Suspension%20Appeal"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-[#ff6636]/40 transition-colors"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                  <Mail className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-foreground">
                    Email Support
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    support@devforge.com
                  </p>
                </div>
              </a>
              <p className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> Include the
                email address associated with your account to speed up review.
              </p>
            </div>
          </div>

          {/* Admin Quick Access */}
          <AdminQuickAccess />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              asChild
              className="rounded-xl border-border font-bold text-xs gap-2"
            >
              <Link href="/">
                <Home className="size-4" />
                Return to Homepage
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs gap-2"
            >
              <Link href="/contact">
                <Mail className="size-4" />
                Contact Support
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs font-medium text-muted-foreground pt-2 border-t border-border/60">
            Learn more about{" "}
            <Link href="/about" className="text-[#ff6636] font-bold hover:underline">
              DevForge
            </Link>{" "}
            or visit{" "}
            <Link href="/contact" className="text-[#ff6636] font-bold hover:underline">
              Help &amp; Support
            </Link>
            .
          </p>
        </div>
      </main>

      <MarketingMiniFooter />
    </div>
  );
}

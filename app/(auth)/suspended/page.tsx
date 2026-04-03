"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Mail, MessageSquare, Home } from "lucide-react";
import Link from "next/link";
import { AdminQuickAccess } from "@/components/admin/admin-quick-access";

export default function SuspendedAccountPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="pt-12 pb-10 px-6 sm:px-12">
          {/* Icon */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Account Suspended
            </h1>
            <p className="text-lg text-muted-foreground">
              Your account has been temporarily restricted
            </p>
          </div>

          {/* Explanation Card */}
          {/* <Card className="bg-muted/50 border-0 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="h-5 w-5 text-foreground mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    What does this mean?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your account has been suspended due to a violation of our
                    Terms of Service or Community Guidelines. During this
                    suspension period, you will not be able to:
                  </p>
                </div>
              </div>
              <ul className="space-y-2 ml-8 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✕</span> Access your
                  courses and learning materials
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✕</span> Participate in
                  discussions or forums
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✕</span> Submit assignments
                  or complete assessments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">✕</span> Interact with
                  instructors or other students
                </li>
              </ul>
            </CardContent>
          </Card> */}

          {/* Common Reasons */}
          {/* <Card className="bg-card border mb-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-3">
                Common reasons for suspension:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>
                    Violation of academic integrity (plagiarism, cheating)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>
                    Harassment or inappropriate behavior toward others
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Sharing account credentials or course materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Payment or billing irregularities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Multiple policy violations or warnings</span>
                </li>
              </ul>
            </CardContent>
          </Card> */}

          {/* Contact Support */}
          <Card className="bg-primary/5 border-primary/20 mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Need to resolve this?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you believe your account was suspended in error or you&apos;d
                like to appeal this decision, please contact our support team.
                We review all appeals carefully and aim to respond within 24-48
                hours.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:support@devforge.com?subject=Account Suspension Appeal"
                  className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors border"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Email Support
                    </p>
                    <p className="text-xs text-muted-foreground">
                      support@devforge.com
                    </p>
                  </div>
                </a>
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <strong>Pro tip:</strong> Include your account email address
                  and any relevant details about your situation to help us
                  process your appeal faster.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Quick Access */}
          <div className="mb-8">
            <AdminQuickAccess />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Return to Homepage
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <a href="mailto:support@devforge.com?subject=Account Suspension Appeal">
                <Mail className="h-4 w-4" />
                Contact Support
              </a>
            </Button>
          </div>

          {/* Additional Info */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            For more information, review our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/community-guidelines"
              className="text-primary hover:underline"
            >
              Community Guidelines
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

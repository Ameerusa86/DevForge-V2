"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "Pricing", href: "/pricing" },
      { label: "Community", href: "/community" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Courses", href: "/my-courses" },
      { label: "Notifications", href: "/notifications" },
      { label: "Profile", href: "/profile" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/register" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-muted/10">
      <div className="page-shell-full py-10 sm:py-12">
        <div className="surface-panel-muted mb-8 flex flex-col gap-6 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="eyebrow">Build with consistency</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Learn faster with a cleaner, more focused product shell.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Browse structured courses, continue where you left off, and move
              through lessons without fighting the interface.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-full px-5">
              <Link href="/courses">
                Explore courses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <Image
                src="/images/DevForge.png"
                alt="DevForge Logo"
                width={112}
                height={112}
                className="h-24 w-24 object-contain sm:h-28 sm:w-28"
              />
              <div>
                <div className="text-lg font-semibold tracking-tight">
                  DevForge
                </div>
                <div className="text-sm text-muted-foreground">
                  Learn faster. Build better.
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Practical learning paths, expert courses, and a community that
              helps you ship. Built for people who want clean course structure,
              clear progress, and less friction between lessons.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/80">
                {col.title}
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DevForge. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link href="/status" className="hover:text-foreground">
              System Status
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <span>•</span>
            <Link href="/courses" className="hover:text-foreground">
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

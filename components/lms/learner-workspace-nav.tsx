"use client";

import Link from "next/link";
import {
  Award,
  Bell,
  BookOpen,
  Compass,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { cn } from "@/lib/utils";

export const LEARNER_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Courses",
    href: "/my-courses",
    icon: BookOpen,
  },
  {
    label: "Certificates",
    href: "/certificates",
    icon: Award,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
] as const;

export function LearnerWorkspaceNav({ activePath }: { activePath: string }) {
  const isItemActive = (href: string) =>
    href === "/dashboard"
      ? activePath === "/dashboard"
      : activePath === href || activePath.startsWith(`${href}/`);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav
        aria-label="Learner workspace navigation"
        className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-card/90 p-1.5 shadow-2xs backdrop-blur-sm"
      >
        {LEARNER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200",
                active
                  ? "bg-[#ff6636] text-white shadow-sm shadow-[#ff6636]/20"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/courses"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-all duration-200 hover:border-[#ff6636]/50 hover:text-[#ff6636]"
      >
        <Compass className="size-3.5 text-[#ff6636]" />
        <span>Browse Catalog</span>
      </Link>
    </div>
  );
}

export function LearnerPageShell({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath={activePath} />
      <main className="flex-1">{children}</main>
      <MarketingPublicFooter />
    </div>
  );
}

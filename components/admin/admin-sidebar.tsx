"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  MessageSquare,
  Mail,
  Activity,
  DollarSign,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Layers3,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "devforge:admin-sidebar-collapsed";

const sidebarGroups = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Courses",
        href: "/admin/courses",
        icon: BookOpen,
      },
      {
        title: "Enrollments",
        href: "/admin/enrollments",
        icon: Users,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Content",
        href: "/admin/content",
        icon: FileText,
      },
      {
        title: "Schedule",
        href: "/admin/schedule",
        icon: Calendar,
      },
      {
        title: "Messages",
        href: "/admin/messages",
        icon: MessageSquare,
      },
      {
        title: "Contact Page",
        href: "/admin/contact",
        icon: Mail,
      },
      {
        title: "Status Page",
        href: "/admin/status",
        icon: Activity,
      },
      {
        title: "Pricing",
        href: "/admin/pricing",
        icon: DollarSign,
      },
      {
        title: "Reviews",
        href: "/admin/reviews",
        icon: Star,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      isCollapsed ? "true" : "false",
    );
  }, [isCollapsed]);

  return (
    <div
      className={cn(
        "admin-sidebar relative border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-72",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo and Toggle */}
        <div className="flex min-h-24 items-start justify-between border-b border-white/10 px-4 py-5">
          {!isCollapsed ? (
            <div className="space-y-4">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15 backdrop-blur">
                  <Image
                    src="/images/DevForge.png"
                    alt="DevForge Logo"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">DevForge</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                    Admin studio
                  </p>
                </div>
              </Link>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  <Sparkles className="h-3.5 w-3.5" />
                  Operations
                </div>
                <p className="mt-2 text-sm font-medium text-white">
                  Manage learning, content, and platform reliability from one
                  workspace.
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/admin"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15"
            >
              <ShieldCheck className="h-5 w-5 text-white" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "h-9 w-9 rounded-2xl border border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white",
              isCollapsed && "mx-auto",
            )}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180",
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-5">
          <nav className="flex flex-col gap-5">
            {sidebarGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                {!isCollapsed ? (
                  <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    {group.title}
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/admin"
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          data-active={isActive}
                          className={cn(
                            "admin-sidebar-item h-12 w-full justify-start gap-3 rounded-2xl px-3 text-white/72 hover:bg-white/10 hover:text-white",
                            isActive &&
                              "bg-white/12 text-white shadow-[0_18px_48px_-28px_rgba(245,158,11,0.75)]",
                            isCollapsed && "justify-center px-0",
                          )}
                          title={isCollapsed ? item.title : undefined}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {!isCollapsed ? (
                            <span className="flex-1 text-left text-sm font-medium">
                              {item.title}
                            </span>
                          ) : null}
                          {!isCollapsed && isActive ? (
                            <Layers3 className="h-4 w-4 text-primary-foreground/80" />
                          ) : null}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          <Separator className="mb-3 bg-white/10" />
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 rounded-2xl text-white/68 hover:bg-white/10 hover:text-white",
                isCollapsed && "justify-center px-0",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Exit Admin</span>}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

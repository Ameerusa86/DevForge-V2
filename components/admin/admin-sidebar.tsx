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
  MessageCircleQuestion,
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
        title: "Q&A",
        href: "/admin/questions",
        icon: MessageCircleQuestion,
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
        "relative h-screen border-r border-border/50 bg-card text-foreground transition-all duration-300 flex flex-col shrink-0 select-none z-40",
        isCollapsed ? "w-16" : "w-72",
        className,
      )}
    >
      {/* Header Logobox */}
      <div className="flex flex-col border-b border-border/50 p-4 shrink-0 min-h-[5.5rem] justify-center relative">
        <div className="flex items-center justify-between gap-3">
          {!isCollapsed ? (
            <Link href="/admin" className="flex items-center gap-3 group min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted transition-transform group-hover:scale-105">
                <Image
                  src="/images/DevForge.png"
                  alt="DevForge Logo"
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-foreground uppercase tracking-wider truncate">DevForge</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff6636] mt-0.5">
                  Admin Studio
                </p>
              </div>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="mx-auto flex size-10 items-center justify-center rounded-xl border border-border/60 bg-muted hover:border-[#ff6636]/40 transition-colors"
            >
              <ShieldCheck className="size-5 text-[#ff6636]" />
            </Link>
          )}

          {/* Toggle Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "flex size-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80 transition-all",
              isCollapsed && "mx-auto"
            )}
          >
            <ChevronLeft
              className={cn(
                "size-4 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Navigation Group Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              {!isCollapsed ? (
                <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                  {group.title}
                </div>
              ) : (
                <div className="h-px bg-border/40 mx-2" />
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href} className="block">
                      <button
                        type="button"
                        className={cn(
                          "flex h-11 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200 group text-left",
                          isActive
                            ? "bg-[#ff6636] text-white shadow-sm shadow-[#ff6636]/10"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          isCollapsed && "justify-center px-0"
                        )}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <Icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                        {!isCollapsed && (
                          <span className="flex-1 text-xs font-bold uppercase tracking-wider truncate">
                            {item.title}
                          </span>
                        )}
                        {!isCollapsed && isActive && (
                          <Layers3 className="size-3.5 text-white/80 shrink-0" />
                        )}
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer Exit Options */}
      <div className="border-t border-border/50 p-3 shrink-0">
        <Link href="/" className="block">
          <button
            type="button"
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors group text-left",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            {!isCollapsed && (
              <span className="text-xs font-bold uppercase tracking-wider">
                Exit Admin
              </span>
            )}
          </button>
        </Link>
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "devforge:admin-sidebar-collapsed";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
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
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
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
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
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
        "relative border-r border-border bg-muted/30 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo and Toggle */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src="/images/DevForge.png"
                alt="DevForge Logo"
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
                priority
              />
              <div>
                <p className="text-sm font-bold text-foreground">DevForge</p>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("h-8 w-8", isCollapsed && "mx-auto")}
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
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 rounded-xl",
                      isActive &&
                        "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                      isCollapsed && "justify-center px-2",
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <Separator className="mb-3" />
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
                isCollapsed && "justify-center px-2",
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

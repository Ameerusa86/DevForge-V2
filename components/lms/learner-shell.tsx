"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Award,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Zap,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/themeToggle";
import { NotificationBell } from "@/components/notification-bell";
import { UserDropdown } from "@/components/user-dropdown";
import { CommandPalette } from "@/components/command-palette";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "devforge:learner-sidebar-collapsed";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Courses",
    href: "/my-courses",
    icon: BookOpen,
  },
  {
    title: "Explore Catalog",
    href: "/courses",
    icon: Compass,
  },
  {
    title: "Certificates",
    href: "/certificates",
    icon: Award,
  },
  {
    title: "Community",
    href: "/community",
    icon: Users,
  },
  {
    title: "Profile & Settings",
    href: "/profile",
    icon: Settings,
  },
];

// External store for sidebar collapsed state to avoid cascading effect renders
function subscribeSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSidebarSnapshot() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot() {
  return false;
}

export function LearnerShell({
  children,
  pageTitle,
  pageDescription,
}: {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isCollapsedFromStore = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );
  const [localCollapsed, setLocalCollapsed] = useState<boolean | null>(null);
  const collapsed = localCollapsed !== null ? localCollapsed : isCollapsedFromStore;

  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setLocalCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore
    }
  };

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || "Learner",
        email: session.user.email || "",
        image: session.user.image || undefined,
      }
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 select-none z-30 sticky top-0 h-screen",
            collapsed ? "w-20" : "w-64"
          )}
        >
          {/* Brand / Logo Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 transition-opacity duration-200",
                collapsed ? "justify-center w-full" : "px-1"
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7a45] to-[#ff6636] text-white shadow-md shadow-[#ff6636]/20 ring-1 ring-white/20">
                <Image
                  src="/icon.png"
                  alt="DevForge"
                  width={24}
                  height={24}
                  className="size-6 object-contain brightness-0 invert"
                />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
                    DevForge
                    <span className="inline-flex items-center rounded-md bg-[#ff6636]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#ff6636] uppercase tracking-wider">
                      PRO
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate font-medium">
                    Learner Workspace
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group relative",
                    isActive
                      ? "bg-[#ff6636]/10 text-[#ff6636] shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-0 py-3"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-[#ff6636]" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.title}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="rounded-full bg-[#ff6636]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff6636]">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#ff6636]" />
                  )}
                </Link>
              );
            })}

            {/* Quick Explore Divider */}
            <div className="pt-4 pb-1">
              <div className="h-px bg-border/60 mx-2" />
            </div>

            {/* Admin Switch Link (if relevant) */}
            <Link
              href="/admin"
              title={collapsed ? "Admin Studio" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200",
                collapsed && "justify-center px-0 py-3"
              )}
            >
              <ShieldCheck className="size-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
              {!collapsed && <span className="truncate flex-1">Admin Studio</span>}
            </Link>
          </div>

          {/* Gamified Streak & Collapse Toggle Footer */}
          <div className="p-3 border-t border-border/80 space-y-3">
            {!collapsed && (
              <div className="rounded-xl border border-[#ff6636]/20 bg-gradient-to-br from-[#ff6636]/10 via-[#ff6636]/5 to-transparent p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#ff6636] text-white shadow-xs">
                      <Flame className="size-4 animate-bounce" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">5-Day Streak!</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Keep the momentum going</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#ff6636]">🔥</span>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className={cn(
                "w-full flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-9",
                collapsed && "px-0"
              )}
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  <span>Collapse Sidebar</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Workspace Bar */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-xl transition-colors">
            {/* Left: Mobile Drawer Trigger & Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Drawer Trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-xl size-9 text-muted-foreground hover:text-foreground"
                  >
                    <Menu className="size-5" />
                    <span className="sr-only">Open navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-card border-border">
                  <SheetHeader className="p-4 border-b border-border flex flex-row items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff6636] text-white">
                      <Image
                        src="/icon.png"
                        alt="DevForge"
                        width={20}
                        height={20}
                        className="size-5 brightness-0 invert"
                      />
                    </div>
                    <SheetTitle className="text-base font-extrabold text-foreground">
                      DevForge Workspace
                    </SheetTitle>
                  </SheetHeader>
                  <div className="p-3 space-y-1.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors",
                            isActive
                              ? "bg-[#ff6636]/10 text-[#ff6636]"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="size-5" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Breadcrumb / Title */}
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground truncate tracking-tight">
                  {pageTitle || "DevForge Learner"}
                </h1>
                {pageDescription && (
                  <p className="hidden sm:block text-xs text-muted-foreground truncate">
                    {pageDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Command Bar, Streak, Notifications, Theme, Profile */}
            <div className="flex items-center gap-2.5">
              {/* Command Palette Trigger */}
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-[#ff6636]/40 hover:bg-muted transition-all duration-200 shadow-2xs"
              >
                <Search className="size-3.5 text-muted-foreground" />
                <span>Quick search...</span>
                <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.2 text-[10px] font-mono font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </button>

              {/* Streak Badge */}
              <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-[#ff6636]/20 bg-[#ff6636]/10 px-3 py-1 text-xs font-bold text-[#ff6636]">
                <Zap className="size-3.5 fill-[#ff6636]" />
                <span>Level 3 · 450 XP</span>
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Theme Toggle */}
              <ThemeToggle className="size-9 rounded-xl" />

              {/* User Dropdown */}
              {user ? (
                <UserDropdown user={user} />
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-[#ff6636] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#e95a2b] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 pb-16 md:pb-8">{children}</main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/95 backdrop-blur-xl px-2">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-bold transition-colors",
                isActive ? "text-[#ff6636]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

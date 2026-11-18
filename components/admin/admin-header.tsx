"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Cpu,
  DollarSign,
  FileText,
  FolderTree,
  LayoutDashboard,
  Mail,
  MessageCircleQuestion,
  MessageSquare,
  Search,
  Settings,
  ShieldAlert,
  Star,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserDropdown } from "@/components/user-dropdown";
import { NotificationBell } from "@/components/notification-bell";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  title?: string;
}

const titleMap: Array<[RegExp, string]> = [
  [/^\/admin$/, "Dashboard"],
  [/^\/admin\/analytics/, "Analytics"],
  [/^\/admin\/users/, "Users"],
  [/^\/admin\/courses/, "Courses"],
  [/^\/admin\/categories/, "Categories"],
  [/^\/admin\/enrollments/, "Enrollments"],
  [/^\/admin\/content/, "Content"],
  [/^\/admin\/schedule/, "Schedule"],
  [/^\/admin\/messages/, "Messages"],
  [/^\/admin\/questions/, "Q&A"],
  [/^\/admin\/contact/, "Contact"],
  [/^\/admin\/status/, "Status"],
  [/^\/admin\/pricing/, "Pricing"],
  [/^\/admin\/reviews/, "Reviews"],
  [/^\/admin\/settings/, "Settings"],
];

const adminQuickJumpItems = [
  { title: "Admin Dashboard", description: "Platform KPIs and recent activity", href: "/admin", icon: LayoutDashboard, keywords: "overview stats kpi" },
  { title: "Analytics", description: "Enrollment and growth metrics", href: "/admin/analytics", icon: BarChart3, keywords: "charts metrics reports" },
  { title: "Users", description: "Manage learners, instructors, and roles", href: "/admin/users", icon: Users, keywords: "students accounts suspend" },
  { title: "Courses", description: "Create, edit, and publish courses", href: "/admin/courses", icon: BookOpen, keywords: "curriculum lessons modules" },
  { title: "Create Course", description: "Start authoring a new course", href: "/admin/courses/create", icon: BookOpen, keywords: "new add course" },
  { title: "Categories", description: "Manage course categories and icons", href: "/admin/categories", icon: FolderTree, keywords: "topics tags taxonomy" },
  { title: "Enrollments", description: "Review student enrollments & progress", href: "/admin/enrollments", icon: Users, keywords: "students progress" },
  { title: "Content", description: "Platform content management", href: "/admin/content", icon: FileText, keywords: "copy cms pages" },
  { title: "Schedule", description: "Manage live sessions & workshops", href: "/admin/schedule", icon: Calendar, keywords: "events live stream" },
  { title: "Messages", description: "Direct support conversations", href: "/admin/messages", icon: MessageSquare, keywords: "inbox chat support" },
  { title: "Lesson Q&A", description: "Moderate student lesson questions", href: "/admin/questions", icon: MessageCircleQuestion, keywords: "qa answers questions" },
  { title: "Contact & FAQs", description: "Update contact info and FAQs", href: "/admin/contact", icon: Mail, keywords: "support help faq" },
  { title: "System Status", description: "Services, incidents, and maintenance", href: "/admin/status", icon: Activity, keywords: "uptime outages incidents" },
  { title: "Pricing Plans", description: "Configure plans and features", href: "/admin/pricing", icon: DollarSign, keywords: "billing tiers subscriptions" },
  { title: "Reviews", description: "Moderate student course reviews", href: "/admin/reviews", icon: Star, keywords: "ratings feedback" },
  { title: "Platform Settings", description: "Features, SMTP, and global config", href: "/admin/settings", icon: Settings, keywords: "email smtp certificates config" },
  { title: "Learner Workspace", description: "Switch back to student dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "student view exit" },
];

export function AdminHeader({ title }: AdminHeaderProps) {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const routeTitle = useMemo(() => {
    if (title) return title;
    const matched = titleMap.find(([pattern]) => pattern.test(pathname));
    return matched?.[1] ?? "Admin";
  }, [pathname, title]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return adminQuickJumpItems.slice(0, 7);
    return adminQuickJumpItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateTo = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setSelectedIndex((prev) =>
        (prev + 1) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredItems.length - 1) : prev - 1,
      );
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      navigateTo(filteredItems[selectedIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md transition-all duration-200">
      <div className="page-shell-full flex flex-col gap-4 py-4 xl:flex-row xl:items-center justify-between">
        {/* Left Side Info */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#ff6636]/20 bg-[#ff6636]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">
              <Cpu className="size-2.5" /> control center
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
              {formattedDate}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              {routeTitle}
            </h1>
            <span className="hidden text-xs font-semibold text-muted-foreground sm:inline border-l border-border/60 pl-2 ml-1">
              Admin Studio Workspace
            </span>
          </div>
        </div>

        {/* Center: Interactive Admin Quick-Jump Search */}
        <div
          ref={searchWrapperRef}
          className="relative hidden max-w-md flex-1 xl:block mx-8"
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
                setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Jump to users, courses, settings... (⌘K)"
              className="h-10 w-full rounded-xl border-border bg-muted/40 pl-10 pr-14 text-xs font-semibold placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:border-[#ff6636]/50"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedIndex(0);
                }}
                aria-label="Clear quick jump"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
                ⌘K
              </kbd>
            )}
          </div>

          {open && (
            <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
              {filteredItems.length === 0 ? (
                <p className="py-6 text-center text-xs font-semibold text-muted-foreground">
                  No admin section matches &quot;{query}&quot;
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-0.5">
                  {filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => navigateTo(item.href)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                          isSelected
                            ? "bg-[#ff6636]/10 text-foreground"
                            : "hover:bg-muted/50 text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-lg",
                              isSelected
                                ? "bg-[#ff6636] text-white"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <Icon className="size-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
          >
            Learner View
          </Link>

          <Badge
            variant="outline"
            className="hidden items-center gap-1.5 rounded-xl border-border/80 bg-muted/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground lg:flex"
          >
            <ShieldAlert className="size-3 text-[#ff6636]" />
            Live admin mode
          </Badge>

          <NotificationBell />

          {/* User Menu */}
          {session?.user && (
            <div className="border-l border-border/60 pl-3">
              <UserDropdown
                user={{
                  id: session.user.id,
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image || undefined,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

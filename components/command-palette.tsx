"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  BookOpen,
  LayoutDashboard,
  Compass,
  User,
  Bell,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  Zap,
  Code2,
  Layers3,
  X,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: "Navigation" | "Learning" | "Preferences" | "Categories";
  icon: React.ElementType;
  action: () => void;
  badge?: string;
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled && controlledOnOpenChange) {
        controlledOnOpenChange(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, controlledOnOpenChange]
  );

  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { setTheme } = useTheme();

  // Listen for keyboard shortcuts (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  const items: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-dashboard",
        title: "Student Dashboard",
        description: "View progress, goals, and enrolled courses",
        category: "Navigation",
        icon: LayoutDashboard,
        action: () => router.push("/dashboard"),
        badge: "G D",
      },
      {
        id: "nav-my-courses",
        title: "My Courses",
        description: "Continue in-progress courses and certificates",
        category: "Navigation",
        icon: BookOpen,
        action: () => router.push("/my-courses"),
        badge: "G C",
      },
      {
        id: "nav-catalog",
        title: "Explore Course Catalog",
        description: "Browse all programming & architecture courses",
        category: "Navigation",
        icon: Compass,
        action: () => router.push("/courses"),
      },
      {
        id: "nav-profile",
        title: "Profile & Settings",
        description: "Manage your account, password, and preferences",
        category: "Navigation",
        icon: User,
        action: () => router.push("/profile"),
      },
      {
        id: "nav-notifications",
        title: "Notifications",
        description: "Check recent activity, reminders, and alerts",
        category: "Navigation",
        icon: Bell,
        action: () => router.push("/notifications"),
      },
      {
        id: "nav-admin",
        title: "Admin Management Studio",
        description: "Manage courses, curriculum, users, and analytics",
        category: "Navigation",
        icon: ShieldCheck,
        action: () => router.push("/admin"),
      },

      // Categories
      {
        id: "cat-frontend",
        title: "Frontend Development",
        description: "React, Next.js, TypeScript, Tailwind CSS",
        category: "Categories",
        icon: Code2,
        action: () => router.push("/courses?category=Frontend"),
      },
      {
        id: "cat-backend",
        title: "Backend & Systems",
        description: "Node.js, PostgreSQL, Prisma, Cloud Architecture",
        category: "Categories",
        icon: Layers3,
        action: () => router.push("/courses?category=Backend"),
      },
      {
        id: "cat-fullstack",
        title: "Fullstack Engineering",
        description: "End-to-end web development paths",
        category: "Categories",
        icon: Zap,
        action: () => router.push("/courses?category=Fullstack"),
      },

      // Preferences
      {
        id: "pref-theme-dark",
        title: "Switch to Dark Theme",
        description: "Enable high-contrast dark mode",
        category: "Preferences",
        icon: Moon,
        action: () => setTheme("dark"),
      },
      {
        id: "pref-theme-light",
        title: "Switch to Light Theme",
        description: "Enable clean bright mode",
        category: "Preferences",
        icon: Sun,
        action: () => setTheme("light"),
      },
      {
        id: "pref-theme-system",
        title: "Use System Theme",
        description: "Sync with OS theme appearance",
        category: "Preferences",
        icon: Laptop,
        action: () => setTheme("system"),
      },
    ],
    [router, setTheme]
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [items, search]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setOpen(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl overflow-hidden p-0 border-border bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl"
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <DialogDescription className="sr-only">
          Quick search and navigation across DevForge
        </DialogDescription>

        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search (e.g. 'courses', 'theme', 'frontend')..."
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto size-8 mb-2 text-muted-foreground/50" />
              <p className="font-semibold text-foreground">No matching commands found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for &apos;courses&apos;, &apos;dashboard&apos;, or &apos;theme&apos;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    setOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-150",
                    isSelected
                      ? "bg-[#ff6636]/10 text-foreground"
                      : "text-foreground/80 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isSelected
                          ? "bg-[#ff6636] text-white shadow-sm shadow-[#ff6636]/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-none truncate">
                        {item.title}
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge ? (
                      <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                    {isSelected && (
                      <ArrowRight className="size-4 text-[#ff6636] animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground font-medium">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-muted border border-border rounded px-1.5 py-0.5 mr-1">↑↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-muted border border-border rounded px-1.5 py-0.5 mr-1">↵</kbd>
              Select
            </span>
          </div>
          <span>DevForge Quick Jump</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

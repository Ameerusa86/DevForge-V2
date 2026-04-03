"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserDropdown } from "@/components/user-dropdown";
import { NotificationBell } from "@/components/notification-bell";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
  title?: string;
}

const titleMap: Array<[RegExp, string]> = [
  [/^\/admin$/, "Dashboard"],
  [/^\/admin\/analytics/, "Analytics"],
  [/^\/admin\/users/, "Users"],
  [/^\/admin\/courses/, "Courses"],
  [/^\/admin\/enrollments/, "Enrollments"],
  [/^\/admin\/content/, "Content"],
  [/^\/admin\/schedule/, "Schedule"],
  [/^\/admin\/messages/, "Messages"],
  [/^\/admin\/contact/, "Contact"],
  [/^\/admin\/status/, "Status"],
  [/^\/admin\/pricing/, "Pricing"],
  [/^\/admin\/settings/, "Settings"],
];

export function AdminHeader({ title }: AdminHeaderProps) {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
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

  return (
    <header className="admin-topbar sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="page-shell-full flex flex-col gap-4 py-4 xl:flex-row xl:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="admin-header-badge">
              Platform control center
            </Badge>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {formattedDate}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              {routeTitle}
            </p>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Monitor operations, users, content, and revenue in one view.
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="ml-auto hidden max-w-xl flex-1 xl:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users, courses, enrollments..."
              className="h-11 w-full rounded-full border-white/70 bg-white/80 pl-11"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm lg:flex">
            Live admin mode
          </div>
          <NotificationBell />

          {/* User Menu */}
          {session?.user && (
            <UserDropdown
              user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image || undefined,
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}

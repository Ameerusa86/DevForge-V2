"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Search, ShieldAlert, Cpu } from "lucide-react";
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
  [/^\/admin\/questions/, "Q&A"],
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

        {/* Center: Search (Light/Dark mode fully compatible) */}
        <div className="hidden max-w-md flex-1 xl:block mx-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search catalog, students, settings..."
              className="h-10 w-full rounded-xl border-border bg-muted/40 pl-10 text-xs font-semibold placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:border-[#ff6636]/50"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <Badge variant="outline" className="hidden items-center gap-1.5 rounded-xl border-border/80 bg-muted/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground lg:flex">
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

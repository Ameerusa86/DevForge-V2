"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserDropdown } from "@/components/user-dropdown";
import { NotificationBell } from "@/components/notification-bell";
import { authClient } from "@/lib/auth-client";

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="page-shell-full flex h-16 items-center gap-4">
        {/* Title */}
        {title && (
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        )}

        {/* Search */}
        <div className="ml-auto hidden max-w-xl flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users, courses, enrollments..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Notifications */}
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
    </header>
  );
}

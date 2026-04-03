"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, LayoutDashboard, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/themeToggle";
import { UserDropdown } from "@/components/user-dropdown";
import { NotificationBell } from "@/components/notification-bell";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isSignedIn = Boolean(session?.user);

  const links = useMemo(
    () => [
      ...(isSignedIn
        ? [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/my-courses", label: "My Learning", icon: BookOpen },
          ]
        : []),
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/pricing", label: "Pricing", icon: ArrowRight },
      { href: "/community", label: "Community", icon: ArrowRight },
      { href: "/about", label: "About", icon: ArrowRight },
    ],
    [isSignedIn],
  );

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="page-shell-full flex h-[4.5rem] items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/images/DevForge.png"
            alt="DevForge Logo"
            width={80}
            height={80}
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
            priority
          />
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-base font-semibold tracking-tight sm:text-lg">
              DevForge
            </span>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Learn faster. Build better.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden flex-1 justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur-sm">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {session?.user && <NotificationBell />}
          {session?.user ? (
            <UserDropdown
              user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image || undefined,
              }}
            />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button
                size="sm"
                variant="outline"
                className="h-10 rounded-full px-4"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="h-10 rounded-full bg-linear-to-r from-primary to-primary/80 px-4 hover:opacity-95"
                onClick={() => router.push("/register")}
              >
                Get started
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full lg:hidden"
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(24rem,100vw)] border-l border-border/70 bg-background/95"
            >
              <SheetHeader className="pr-12">
                <SheetTitle>Navigate DevForge</SheetTitle>
                <SheetDescription>
                  Jump between courses, learning progress, and account actions.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
                {session?.user ? (
                  <div className="surface-panel-muted p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {session.user.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                ) : (
                  <div className="surface-panel-muted flex flex-col gap-3 p-4">
                    <p className="text-sm text-muted-foreground">
                      Sign in to track progress, save courses, and manage your
                      learning from one place.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <SheetClose asChild>
                        <Button asChild variant="outline" className="flex-1">
                          <Link href="/login">Sign In</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild className="flex-1">
                          <Link href="/register">Create account</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {links.map((item) => {
                    const Icon = item.icon;

                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "surface-panel-muted flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors",
                            isActive(item.href) &&
                              "border-primary/30 bg-primary/10 text-foreground",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

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
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md shadow-xs">
      <div className="page-shell-full flex h-[4.5rem] items-center gap-3">
        {/* Brand Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-3 group">
          <div className="relative">
            <Image
              src="/images/DevForge.png"
              alt="DevForge Logo"
              width={80}
              height={80}
              className="h-14 w-14 object-contain sm:h-16 sm:w-16 transition-transform duration-300 ease-out group-hover:scale-105"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-base font-extrabold tracking-tight sm:text-lg bg-gradient-to-r from-[#ff6636] to-[#ff8f6a] bg-clip-text text-transparent">
              DevForge
            </span>
            <p className="hidden text-[9px] font-bold text-muted-foreground uppercase tracking-[0.1em] sm:block">
              Learn faster. Build better.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Capsule */}
        <div className="hidden flex-1 justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-full border border-border/30 bg-muted/40 p-1 backdrop-blur-sm shadow-xs">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                  isActive(item.href)
                    ? "bg-[#ff6636] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Action Items */}
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
                className="h-9 rounded-xl px-4 font-bold border-border bg-card text-foreground hover:bg-muted transition-all duration-200"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-xl bg-[#ff6636] text-white px-4 font-bold hover:bg-[#e95a2b] shadow-sm shadow-[#ff6636]/10 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => router.push("/register")}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Navigation Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl lg:hidden border-border hover:bg-muted"
              >
                <Menu className="h-4.5 w-4.5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(24rem,100vw)] border-l border-border/40 bg-background/95"
            >
              <SheetHeader className="pr-12 text-left">
                <SheetTitle className="text-xl font-bold">Navigate DevForge</SheetTitle>
                <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
                  Jump between courses, learning progress, and account actions.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-6 px-4 pb-6 mt-6">
                {session?.user ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm font-bold text-foreground">
                      {session.user.name}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 flex flex-col gap-3.5 p-4">
                    <p className="text-xs leading-relaxed text-muted-foreground font-semibold">
                      Sign in to track progress, save courses, and manage your
                      learning from one place.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <SheetClose asChild>
                        <Button asChild variant="outline" className="flex-1 rounded-lg font-bold">
                          <Link href="/login">Sign In</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild className="flex-1 rounded-lg bg-[#ff6636] text-white hover:bg-[#e95a2b] font-bold">
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
                            "flex items-center justify-between rounded-xl border border-border/40 bg-card/50 px-4 py-3 text-sm font-semibold transition-all duration-200 hover:border-[#ff6636] hover:bg-[#ff6636]/5",
                            isActive(item.href) &&
                              "border-[#ff6636]/30 bg-[#ff6636]/10 text-foreground",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4.5 w-4.5 text-[#ff6636]" />
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

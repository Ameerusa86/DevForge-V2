"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Menu,
  Search,
  ShoppingCart,
} from "lucide-react";
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";

import {
  footerColumns,
  footerStats,
  socialLinks,
  topNavLinks,
} from "@/components/marketing/home-data";
import { ThemeToggle } from "@/components/themeToggle";
import { NotificationBell } from "@/components/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDropdown } from "@/components/user-dropdown";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const socialIconMap = {
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  LinkedIn: FaLinkedinIn,
  GitHub: FaGithub,
  Twitter: FaTwitter,
  YouTube: FaYoutube,
};

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#e95a2b] hover:shadow-md hover:shadow-[#ff6636]/15 hover:scale-[1.01] active:scale-[0.99]";
const softButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6636]/10 px-5 py-2.5 text-sm font-bold text-[#ff6636] transition-all duration-200 hover:bg-[#ff6636]/15 hover:scale-[1.01] active:scale-[0.99]";
const themeToggleClassName =
  "size-10 rounded-xl border border-border bg-background text-foreground hover:border-[#ff6636]/40 hover:bg-muted hover:text-[#ff6636] transition-all duration-200 flex items-center justify-center";
const browseMenuItems = [
  {
    label: "All Courses",
    href: "/courses",
    description: "Browse the full DevForge catalog",
  },
  {
    label: "My Learning",
    href: "/my-courses",
    description: "Continue enrolled paths and track your progress",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "See progress, recommendations, and recent activity",
  },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Compare plans and choose what fits your goals",
  },
  {
    label: "Community",
    href: "/community",
    description: "Join discussions, reviews, and learner support",
  },
  {
    label: "Notifications",
    href: "/notifications",
    description: "Check updates, reminders, and announcements",
  },
  {
    label: "Profile",
    href: "/profile",
    description: "Manage account settings and learning preferences",
  },
  {
    label: "System Status",
    href: "/status",
    description: "View service health and platform availability",
  },
];

function MarketingBrand({
  dark = false,
  size = "nav",
}: {
  dark?: boolean;
  size?: "nav" | "footer";
}) {
  const imageClassName =
    size === "footer"
      ? "h-20 w-20 object-contain sm:h-24 sm:w-24"
      : "h-14 w-14 object-contain sm:h-16 sm:w-16 transition-transform duration-300 ease-out group-hover:scale-105";

  return (
    <Link href="/" className="inline-flex items-center gap-3 group">
      <Image
        src="/images/DevForge.png"
        alt="DevForge logo"
        width={96}
        height={96}
        priority
        className={imageClassName}
      />
      <span
        className={`text-[26px] font-extrabold tracking-tight bg-gradient-to-r from-[#ff6636] to-[#ff8f6a] bg-clip-text text-transparent`}
      >
        DevForge
      </span>
    </Link>
  );
}

export function MarketingPublicHeader({
  activePath = "/",
  compact = false,
  showSearch = true,
}: {
  activePath?: string;
  compact?: boolean;
  showSearch?: boolean;
}) {
  const { data: session, isPending } = authClient.useSession();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isActive = (href: string) =>
    href === "/" ? activePath === "/" : activePath.startsWith(href);
  const isSignedIn = Boolean(session?.user);
  const showGuestActions = !mounted || (!isPending && !isSignedIn);
  const showSignedInActions = mounted && !isPending && isSignedIn;
  const canRenderInteractiveMenus = mounted;
  const signedInUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image || undefined,
      }
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto flex h-[4.5rem] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-6">
          <MarketingBrand />
        </div>

        {/* Center: Search & Browse */}
        <div className="hidden flex-1 items-center justify-center gap-4 lg:flex">
          <div className="flex w-full max-w-[620px] items-center gap-3">
            {/* Browse Catalog Dropdown Button */}
            {canRenderInteractiveMenus ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-between gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 hover:border-border/80 transition duration-200"
                  >
                    Browse
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[280px] rounded-xl border-border bg-popover p-2 shadow-lg"
                >
                  <DropdownMenuLabel className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Browse Catalog
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  {browseMenuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      asChild
                      className="rounded-lg p-0 focus:bg-transparent"
                    >
                      <Link
                        href={item.href}
                        className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition hover:bg-accent/20 focus:bg-accent/20"
                      >
                        <span className="text-xs font-bold text-foreground">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.description}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/courses"
                className="inline-flex h-10 items-center justify-between gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition duration-200"
              >
                Browse
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Link>
            )}

            {/* Dynamic Command-palette style Search Input */}
            <form
              action="/courses"
              className="flex h-10 flex-1 items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 focus-within:bg-background focus-within:border-[#ff6636]/60 focus-within:ring-1 focus-within:ring-[#ff6636]/20 transition-all duration-200 group"
            >
              <button type="submit" aria-label="Search courses" className="text-muted-foreground group-focus-within:text-[#ff6636]">
                <Search className="size-4" />
              </button>
              <input
                name="search"
                type="text"
                placeholder="Search courses..."
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[9px] font-bold text-muted-foreground">
                ⌘K
              </kbd>
            </form>
          </div>
        </div>

        {/* Right Side: Navigation Links, Auth, and Toggles */}
        <div className="flex items-center gap-3">
          
          {/* Display navigation links on the right side */}
          <div className="hidden items-center gap-5 xl:flex mr-2">
            {topNavLinks.slice(0, 4).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 hover:text-[#ff6636] ${
                  isActive(link.href) ? "text-[#ff6636]" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Signed In User Actions */}
          {showSignedInActions && signedInUser ? (
            <div className="flex items-center gap-2">
              <ThemeToggle className={themeToggleClassName} />
              
              <Link
                href="/my-courses"
                className={cn(
                  "hidden items-center justify-center gap-2 rounded-xl border border-border bg-background px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-all duration-200 hover:border-[#ff6636] hover:text-[#ff6636] sm:inline-flex",
                  isActive("/my-courses") && "border-[#ff6636] text-[#ff6636] bg-[#ff6636]/5"
                )}
              >
                <BookOpen className="size-4 text-[#ff6636]" />
                My Learning
              </Link>
              
              <Link 
                href="/dashboard" 
                className={cn(
                  "hidden items-center justify-center gap-2 rounded-xl border border-border bg-background px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-all duration-200 hover:border-[#ff6636] hover:text-[#ff6636] sm:inline-flex",
                  isActive("/dashboard") && "border-[#ff6636] text-[#ff6636] bg-[#ff6636]/5"
                )}
              >
                <LayoutDashboard className="size-4 text-[#ff6636]" />
                Dashboard
              </Link>
              
              <NotificationBell />
              <UserDropdown user={signedInUser} />
            </div>
          ) : null}

          {/* Guest User Actions */}
          {showGuestActions ? (
            <>
              <div className="hidden items-center gap-3 lg:flex">
                <ThemeToggle className={themeToggleClassName} />
                <Link
                  href="/community"
                  className="flex size-9.5 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-all duration-200 hover:border-[#ff6636]/40 hover:bg-muted hover:text-[#ff6636]"
                >
                  <Heart className="size-4.5" />
                </Link>
                <Link
                  href="/pricing"
                  className="flex size-9.5 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-all duration-200 hover:border-[#ff6636]/40 hover:bg-muted hover:text-[#ff6636]"
                >
                  <ShoppingCart className="size-4.5" />
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/register" className={softButtonClassName}>
                  Register
                </Link>
                <Link href="/login" className={primaryButtonClassName}>
                  Login
                </Link>
              </div>
            </>
          ) : null}

          {showGuestActions ? (
            <ThemeToggle className={`${themeToggleClassName} lg:hidden`} />
          ) : null}

          {/* Mobile Drawer Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9.5 w-9.5 rounded-xl lg:hidden border-border hover:bg-muted"
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
                  {topNavLinks.map((item) => {
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
                            <BookOpen className="h-4.5 w-4.5 text-[#ff6636]" />
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
    </header>
  );
}

export function MarketingPublicFooter() {
  return (
    <footer className="bg-background text-foreground">
      {/* ── Top CTA band ─────────────────────────────────────────── */}
      <div className="border-t border-border/60 bg-[#ff6636]">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Ready to level up?</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Start learning with 67k+ students worldwide.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#ff6636] hover:bg-white/90 transition-colors duration-200"
            >
              Join for Free
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors duration-200"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 gap-6 divide-x divide-border/60">
            {footerStats.map((stat) => (
              <div key={stat.label} className="text-center px-4">
                <p className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main link grid ────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)_200px]">

          {/* Brand column */}
          <div className="space-y-5">
            <MarketingBrand dark size="footer" />
            <p className="text-sm leading-7 text-muted-foreground max-w-[320px]">
              Structured learning for builders who want momentum, accountability,
              and course design that feels deliberate from the first click.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1">
              {socialLinks.map((social) => {
                const Icon = socialIconMap[social.label as keyof typeof socialIconMap];
                const isExternal = social.href.startsWith("http");
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer noopener" : undefined}
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] hover:bg-[#ff6636]/5 transition-all duration-200"
                  >
                    <Icon className="size-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground mb-5">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-semibold text-muted-foreground hover:text-[#ff6636] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* App download column */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground mb-5">
              Get the App
            </h3>
            <div className="space-y-3">
              <Link
                href="/courses"
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-[#ff6636]/40 hover:text-foreground hover:bg-muted/40 transition-all duration-200"
              >
                <span className="text-base">🍎</span>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Download on</p>
                  <p className="font-bold text-foreground text-xs">App Store</p>
                </div>
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-[#ff6636]/40 hover:text-foreground hover:bg-muted/40 transition-all duration-200"
              >
                <span className="text-base">🤖</span>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Get it on</p>
                  <p className="font-bold text-foreground text-xs">Google Play</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Bottom copyright bar ──────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs font-semibold text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DevForge. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/contact" className="hover:text-[#ff6636] transition-colors">Help Center</Link>
            <Link href="/about"   className="hover:text-[#ff6636] transition-colors">About</Link>
            <Link href="/pricing" className="hover:text-[#ff6636] transition-colors">Pricing</Link>
            <Link href="/status"  className="hover:text-[#ff6636] transition-colors">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MarketingMiniFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 DevForge. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/contact" className="hover:text-[#ff6636]">
            Help Center
          </Link>
          <Link href="/courses" className="hover:text-primary">
            Browse Courses
          </Link>
        </div>
      </div>
    </footer>
  );
}

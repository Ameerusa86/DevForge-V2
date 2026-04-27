"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
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

const socialIconMap = {
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  LinkedIn: FaLinkedinIn,
  GitHub: FaGithub,
  Twitter: FaTwitter,
  YouTube: FaYoutube,
};

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b] hover:shadow-[0_12px_30px_rgba(255,102,54,0.28)]";
const softButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-none bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15";
const themeToggleClassName =
  "size-10 rounded-none border border-border bg-background text-foreground hover:border-primary hover:bg-muted hover:text-primary";
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
      : "h-14 w-14 object-contain sm:h-16 sm:w-16";

  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <Image
        src="/images/DevForge.png"
        alt="DevForge logo"
        width={96}
        height={96}
        priority
        className={imageClassName}
      />
      <span
        className={`text-[28px] font-semibold tracking-[-0.03em] ${
          dark ? "text-card-foreground" : "text-foreground"
        }`}
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
  // During SSR and the first client render (before mount), always show guest
  // actions so the component tree matches and Radix IDs stay stable.
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

  if (compact) {
    return (
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <MarketingBrand />

          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            {topNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`transition hover:text-[#ff6636] ${
                  isActive(link.href) ? "text-primary" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className={themeToggleClassName} />
            {showSignedInActions && signedInUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden items-center justify-center rounded-none border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary sm:inline-flex"
                >
                  Dashboard
                </Link>
                <NotificationBell />
                <UserDropdown user={signedInUser} />
              </>
            ) : null}
            {showGuestActions ? (
              <>
                <Link href="/register" className={softButtonClassName}>
                  Create Account
                </Link>
                <Link href="/login" className={primaryButtonClassName}>
                  Sign In
                </Link>
              </>
            ) : null}
            <button
              type="button"
              aria-label="Open navigation"
              className="inline-flex size-11 items-center justify-center border border-border text-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-border">
      <div className="bg-background">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 lg:gap-10">
              <MarketingBrand />

              {showSearch ? (
                <div className="hidden flex-1 items-center gap-4 lg:flex">
                  {canRenderInteractiveMenus ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-12 min-w-[190px] items-center justify-between border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:border-primary data-[state=open]:border-primary"
                        >
                          Browse
                          <ChevronDown className="size-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[320px] rounded-none border-border bg-popover p-2"
                      >
                        <DropdownMenuLabel className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Browse Catalog
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        {browseMenuItems.map((item) => (
                          <DropdownMenuItem
                            key={item.label}
                            asChild
                            className="rounded-none p-0 focus:bg-transparent"
                          >
                            <Link
                              href={item.href}
                              className="flex w-full flex-col items-start gap-1 rounded-none px-3 py-3 text-left transition hover:bg-accent/20 focus:bg-accent/20"
                            >
                              <span className="text-sm font-semibold text-foreground">
                                {item.label}
                              </span>
                              <span className="text-xs leading-5 text-muted-foreground">
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
                      className="inline-flex h-12 min-w-[190px] items-center justify-between border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:border-primary"
                    >
                      Browse
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </Link>
                  )}
                  <form
                    action="/courses"
                    className="flex h-12 flex-1 items-center gap-3 border border-border bg-background px-4 focus-within:border-primary"
                  >
                    <button type="submit" aria-label="Search courses">
                      <Search className="size-4 text-muted-foreground" />
                    </button>
                    <input
                      name="search"
                      type="text"
                      placeholder="What do you want to learn..."
                      className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                    />
                  </form>

                  <div className="hidden items-center gap-4 xl:flex">
                    {topNavLinks.slice(0, 4).map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={`text-sm font-medium transition hover:text-primary ${
                          isActive(link.href)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
                  {topNavLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`transition hover:text-[#ff6636] ${
                        isActive(link.href) ? "text-primary" : ""
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {showSignedInActions && signedInUser ? (
                <div className="flex flex-wrap items-center gap-2">
                  <ThemeToggle className={themeToggleClassName} />
                  <Link
                    href="/my-courses"
                    className="hidden items-center justify-center gap-2 rounded-none border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary xl:inline-flex"
                  >
                    <BookOpen className="size-4" />
                    My Learning
                  </Link>
                  <Link href="/dashboard" className={primaryButtonClassName}>
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                  <NotificationBell />
                  <UserDropdown user={signedInUser} />
                </div>
              ) : null}

              {showGuestActions ? (
                <>
                  <div className="hidden items-center gap-4 lg:flex">
                    <ThemeToggle className={themeToggleClassName} />
                    <Link
                      href="/community"
                      className="text-foreground hover:text-[#ff6636]"
                    >
                      <Heart className="size-5" />
                    </Link>
                    <Link
                      href="/pricing"
                      className="text-foreground hover:text-[#ff6636]"
                    >
                      <ShoppingCart className="size-5" />
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href="/register" className={softButtonClassName}>
                      Create Account
                    </Link>
                    <Link href="/login" className={primaryButtonClassName}>
                      Sign In
                    </Link>
                  </div>
                </>
              ) : null}

              {showGuestActions ? (
                <ThemeToggle className={`${themeToggleClassName} lg:hidden`} />
              ) : null}
              <button
                type="button"
                aria-label="Open navigation"
                className="inline-flex size-10 items-center justify-center border border-border text-foreground lg:hidden"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm font-medium text-muted-foreground lg:hidden">
            {topNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={isActive(link.href) ? "text-primary" : ""}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function MarketingPublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-background text-foreground">
      <div className="border-b border-border/70 bg-muted/20">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8 lg:py-16">
          <div className="space-y-6">
            <h2 className="max-w-[560px] text-[32px] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[40px]">
              Start learning with 67.1k students around the world.
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={primaryButtonClassName}>
                Join the Family
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-none border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Browse all courses
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {footerStats.map((stat) => (
              <div key={stat.label} className="min-w-[140px]">
                <div className="text-[40px] font-semibold tracking-[-0.04em]">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(3,1fr)_220px]">
          <div>
            <MarketingBrand dark size="footer" />

            <p className="mt-5 max-w-[360px] text-sm leading-7 text-muted-foreground">
              Structured learning for builders who want momentum,
              accountability, and course design that feels deliberate from the
              first click.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon =
                  socialIconMap[social.label as keyof typeof socialIconMap];
                const isExternal = social.href.startsWith("http");
                const activeClassName =
                  social.label === "LinkedIn"
                    ? "bg-primary text-primary-foreground shadow-[0_6px_20px_rgba(204,82,43,0.45)]"
                    : "bg-muted text-foreground hover:bg-muted/80";

                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer noopener" : undefined}
                    className={`inline-flex size-11 items-center justify-center transition ${activeClassName}`}
                  >
                    <Icon className="size-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">
              Download our app
            </h3>
            <div className="mt-5 grid gap-3">
              <Link
                href="/courses"
                className="border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                App Store
              </Link>
              <Link
                href="/courses"
                className="border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Google Play
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/80 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DevForge. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/contact" className="hover:text-foreground">
              Help Center
            </Link>
            <Link href="/about" className="hover:text-foreground">
              About DevForge
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
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

"use client";

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
  Twitter: FaTwitter,
  YouTube: FaYoutube,
};

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b] hover:shadow-[0_12px_30px_rgba(255,102,54,0.28)]";
const softButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-none bg-[#ffeee8] px-6 py-3 text-sm font-semibold text-[#ff6636] transition hover:bg-[#ffe2d6] dark:bg-white/10 dark:text-white dark:hover:bg-white/15";
const browseMenuItems = [
  {
    label: "All Courses",
    href: "/courses",
    description: "Browse the full DevForge catalog",
  },
  {
    label: "Frontend",
    href: "/courses?categories=FRONTEND",
    description: "React, UI systems, and browser-first workflows",
  },
  {
    label: "Backend",
    href: "/courses?categories=BACKEND",
    description: "APIs, databases, and server architecture",
  },
  {
    label: "Full Stack",
    href: "/courses?categories=FULL_STACK",
    description: "End-to-end product development tracks",
  },
  {
    label: "Python",
    href: "/courses?categories=PYTHON",
    description: "Automation, tooling, and application fundamentals",
  },
  {
    label: "JavaScript",
    href: "/courses?categories=JAVASCRIPT",
    description: "Modern language patterns and runtime fluency",
  },
  {
    label: "TypeScript",
    href: "/courses?categories=TYPESCRIPT",
    description: "Typed app architecture for scale",
  },
  {
    label: ".NET",
    href: "/courses?categories=DOT_NET",
    description: "Microsoft stack and enterprise application paths",
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
          dark ? "text-white" : "text-[#1d2026] dark:text-white"
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
  const isActive = (href: string) =>
    href === "/" ? activePath === "/" : activePath.startsWith(href);
  const isSignedIn = Boolean(session?.user);
  const showGuestActions = !isPending && !isSignedIn;
  const showSignedInActions = !isPending && isSignedIn;
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
      <header className="border-b border-[#e9eaf0] bg-white dark:border-white/10 dark:bg-[#101318]">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <MarketingBrand />

          <div className="hidden items-center gap-8 text-sm font-medium text-[#4e5566] dark:text-[#b7bac7] lg:flex">
            {topNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`transition hover:text-[#ff6636] ${
                  isActive(link.href) ? "text-[#ff6636]" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="size-11 rounded-none border-[#d7dae0] bg-white text-[#1d2026] hover:border-[#ff6636] hover:bg-[#fffaf6] hover:text-[#ff6636] dark:border-white/12 dark:bg-[#151822] dark:text-white dark:hover:border-[#ff6636] dark:hover:bg-[#1d2026]" />
            {showSignedInActions && signedInUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden items-center justify-center rounded-none border border-[#d7dae0] bg-white px-5 py-3 text-sm font-semibold text-[#243041] transition hover:border-[#ff6636] hover:text-[#ff6636] sm:inline-flex dark:border-white/12 dark:bg-[#151822] dark:text-white"
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
              className="inline-flex size-11 items-center justify-center border border-[#e9eaf0] text-[#1d2026] dark:border-white/12 dark:text-white lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[#e9eaf0] dark:border-white/10">
      <div className="bg-white dark:bg-[#101318]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 lg:gap-10">
              <MarketingBrand />

              {showSearch ? (
                <div className="hidden flex-1 items-center gap-4 lg:flex">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-12 min-w-[190px] items-center justify-between border border-[#d7dae0] bg-white px-4 text-sm font-medium text-[#243041] transition hover:border-[#ff6636] data-[state=open]:border-[#ff6636] dark:border-white/12 dark:bg-[#151822] dark:text-white dark:hover:border-[#ff6636]"
                      >
                        Browse
                        <ChevronDown className="size-4 text-[#8c94a3] dark:text-[#b7bac7]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[320px] rounded-none border-[#d7dae0] bg-white p-2 dark:border-white/12 dark:bg-[#151822]"
                    >
                      <DropdownMenuLabel className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3] dark:text-[#b7bac7]">
                        Browse Catalog
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#e9eaf0] dark:bg-white/10" />
                      {browseMenuItems.map((item) => (
                        <DropdownMenuItem
                          key={item.label}
                          asChild
                          className="rounded-none p-0 focus:bg-transparent"
                        >
                          <Link
                            href={item.href}
                            className="flex w-full flex-col items-start gap-1 rounded-none px-3 py-3 text-left transition hover:bg-[#fff7f4] focus:bg-[#fff7f4] dark:hover:bg-white/10 dark:focus:bg-white/10"
                          >
                            <span className="text-sm font-semibold text-[#1d2026] dark:text-white">
                              {item.label}
                            </span>
                            <span className="text-xs leading-5 text-[#6e7485] dark:text-[#b7bac7]">
                              {item.description}
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <form
                    action="/courses"
                    className="flex h-12 flex-1 items-center gap-3 border border-[#d7dae0] bg-white px-4 focus-within:border-[#ff6636] dark:border-white/12 dark:bg-[#151822] dark:focus-within:border-[#ff6636]"
                  >
                    <button type="submit" aria-label="Search courses">
                      <Search className="size-4 text-[#8c94a3] dark:text-[#b7bac7]" />
                    </button>
                    <input
                      name="search"
                      type="text"
                      placeholder="What do you want to learn..."
                      className="w-full bg-transparent text-sm font-medium text-[#1d2026] outline-none placeholder:font-normal placeholder:text-[#667085] dark:text-white dark:placeholder:text-[#8c94a3]"
                    />
                  </form>
                </div>
              ) : (
                <div className="hidden items-center gap-8 text-sm font-medium text-[#4e5566] dark:text-[#b7bac7] lg:flex">
                  {topNavLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`transition hover:text-[#ff6636] ${
                        isActive(link.href) ? "text-[#ff6636]" : ""
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
                  <ThemeToggle className="size-10 rounded-none border-[#d7dae0] bg-white text-[#1d2026] hover:border-[#ff6636] hover:bg-[#fffaf6] hover:text-[#ff6636] dark:border-white/12 dark:bg-[#151822] dark:text-white dark:hover:border-[#ff6636] dark:hover:bg-[#1d2026]" />
                  <Link
                    href="/my-courses"
                    className="hidden items-center justify-center gap-2 rounded-none border border-[#d7dae0] bg-white px-5 py-3 text-sm font-semibold text-[#243041] transition hover:border-[#ff6636] hover:text-[#ff6636] xl:inline-flex dark:border-white/12 dark:bg-[#151822] dark:text-white"
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
                    <ThemeToggle className="size-10 rounded-none border-[#d7dae0] bg-white text-[#1d2026] hover:border-[#ff6636] hover:bg-[#fffaf6] hover:text-[#ff6636] dark:border-white/12 dark:bg-[#151822] dark:text-white dark:hover:border-[#ff6636] dark:hover:bg-[#1d2026]" />
                    <Link href="/community" className="text-[#1d2026] hover:text-[#ff6636] dark:text-white">
                      <Heart className="size-5" />
                    </Link>
                    <Link href="/pricing" className="text-[#1d2026] hover:text-[#ff6636] dark:text-white">
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
                <ThemeToggle className="size-10 rounded-none border-[#d7dae0] bg-white text-[#1d2026] hover:border-[#ff6636] hover:bg-[#fffaf6] hover:text-[#ff6636] dark:border-white/12 dark:bg-[#151822] dark:text-white dark:hover:border-[#ff6636] dark:hover:bg-[#1d2026] lg:hidden" />
              ) : null}
              <button
                type="button"
                aria-label="Open navigation"
                className="inline-flex size-10 items-center justify-center border border-[#e9eaf0] text-[#1d2026] dark:border-white/12 dark:text-white lg:hidden"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-4 border-t border-[#e9eaf0] pt-4 text-sm font-medium text-[#4e5566] dark:border-white/10 dark:text-[#b7bac7] lg:hidden">
            {topNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={isActive(link.href) ? "text-[#ff6636]" : ""}
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
    <footer className="bg-[#1d2026] text-white">
      <div className="border-b border-white/10">
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
                className="inline-flex items-center justify-center rounded-none border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
                <div className="mt-2 text-sm text-[#b7bac7]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(3,1fr)_220px]">
          <div>
            <MarketingBrand dark size="footer" />

            <p className="mt-5 max-w-[360px] text-sm leading-7 text-[#8c94a3]">
              Structured learning for builders who want momentum,
              accountability, and course design that feels deliberate from the
              first click.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon =
                  socialIconMap[social.label as keyof typeof socialIconMap];
                const activeClassName =
                  social.label === "LinkedIn"
                    ? "bg-[#ff6636] text-white shadow-[0_6px_20px_rgba(204,82,43,0.45)]"
                    : "bg-white/5 text-white hover:bg-white/10";

                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
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
              <ul className="mt-5 space-y-3 text-sm text-[#8c94a3]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-white">
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
                className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#b7bac7] hover:bg-white/10 hover:text-white"
              >
                App Store
              </Link>
              <Link
                href="/courses"
                className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#b7bac7] hover:bg-white/10 hover:text-white"
              >
                Google Play
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[#8c94a3] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DevForge. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/contact" className="hover:text-white">
              Help Center
            </Link>
            <Link href="/about" className="hover:text-white">
              About DevForge
            </Link>
            <Link href="/pricing" className="hover:text-white">
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
    <footer className="border-t border-[#e9eaf0] bg-white">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-5 text-sm text-[#6e7485] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 DevForge. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/contact" className="hover:text-[#ff6636]">
            Help Center
          </Link>
          <Link href="/courses" className="hover:text-[#ff6636]">
            Browse Courses
          </Link>
        </div>
      </div>
    </footer>
  );
}

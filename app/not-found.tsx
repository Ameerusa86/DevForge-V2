import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Home,
  Search,
  TriangleAlert,
} from "lucide-react";

import {
  MarketingMiniFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/" showSearch={false} />

      <main className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex items-center px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-xl space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                <Compass className="size-3.5" /> Error 404
              </span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Page{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  not found
                </span>
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground font-semibold">
                The page you requested could not be found. The link may be
                outdated, or the page may have moved.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-colors"
              >
                Go to Homepage <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
              >
                Browse Courses <Search className="size-4" />
              </Link>
            </div>

            <div className="grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-xs font-bold text-muted-foreground transition hover:border-[#ff6636]/40 hover:text-[#ff6636]"
              >
                <Home className="size-4 text-[#ff6636]" />
                Home
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-xs font-bold text-muted-foreground transition hover:border-[#ff6636]/40 hover:text-[#ff6636]"
              >
                <Search className="size-4 text-[#ff6636]" />
                Courses
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-xs font-bold text-muted-foreground transition hover:border-[#ff6636]/40 hover:text-[#ff6636]"
              >
                <TriangleAlert className="size-4 text-[#ff6636]" />
                Support
              </Link>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-[#1d2026] lg:flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,102,54,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(86,79,253,0.18),transparent_40%)]" />
          <div className="relative space-y-6 text-center text-white">
            <div className="flex items-center justify-center gap-5">
              <div className="flex size-28 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-7xl font-extrabold">
                4
              </div>
              <div className="flex size-32 items-center justify-center rounded-3xl border border-[#ff6636]/50 bg-[#ff6636]/20 text-8xl font-extrabold text-[#ff8f6a]">
                0
              </div>
              <div className="flex size-28 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-7xl font-extrabold">
                4
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
              DevForge Navigation
            </p>
          </div>
        </section>
      </main>

      <MarketingMiniFooter />
    </div>
  );
}

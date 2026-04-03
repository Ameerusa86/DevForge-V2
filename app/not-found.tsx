import Link from "next/link";
import {
  ArrowRight,
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
    <div className="min-h-screen bg-white text-[#1d2026]">
      <MarketingPublicHeader activePath="/" showSearch={false} />

      <main className="grid min-h-[calc(100vh-218px)] lg:grid-cols-[minmax(0,534px)_minmax(0,1fr)]">
        <section className="flex items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[534px] space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Error 404
              </p>
              <h1 className="text-[56px] font-semibold leading-[1] tracking-[-0.04em] sm:text-[72px]">
                Oops! page not found
              </h1>
              <p className="max-w-[534px] text-lg leading-8 text-[#6e7485]">
                Something went wrong. The page you requested could not be
                found. The link may be broken, or the page may have been
                removed.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
              >
                Go to homepage <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-none border border-[#e9eaf0] bg-white px-6 py-3 text-sm font-semibold text-[#1d2026] transition hover:border-[#ff6636] hover:text-[#ff6636]"
              >
                Browse courses <Search className="size-4" />
              </Link>
            </div>

            <div className="grid gap-3 border-t border-[#e9eaf0] pt-6 sm:grid-cols-3">
              <Link
                href="/"
                className="flex items-center gap-3 border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4 text-sm text-[#4e5566] transition hover:border-[#ff6636] hover:text-[#ff6636]"
              >
                <Home className="size-4" />
                Home
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-3 border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4 text-sm text-[#4e5566] transition hover:border-[#ff6636] hover:text-[#ff6636]"
              >
                <Search className="size-4" />
                Courses
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4 text-sm text-[#4e5566] transition hover:border-[#ff6636] hover:text-[#ff6636]"
              >
                <TriangleAlert className="size-4" />
                Support
              </Link>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-[#f5f7fa] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,102,54,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(86,79,253,0.12),transparent_24%)]" />
          <div className="absolute inset-y-0 left-[18%] w-[68%] bg-[#1d2026]" style={{ clipPath: "polygon(22% 0,100% 0,78% 100%,0 100%)" }} />
          <div className="absolute inset-y-0 left-[24%] flex w-[58%] items-center justify-center">
            <div className="space-y-6 text-center text-white">
              <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-white/10 text-[96px] font-semibold">
                4
              </div>
              <div className="mx-auto flex size-36 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[120px] font-semibold">
                0
              </div>
              <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-white/10 text-[96px] font-semibold">
                4
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingMiniFooter />
    </div>
  );
}

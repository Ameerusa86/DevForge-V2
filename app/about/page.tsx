import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Globe,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";

const values = [
  {
    title: "Practical learning",
    description:
      "Courses are built around output, not passive consumption. The goal is momentum you can measure.",
    icon: Target,
    tone: "bg-[#ff6636]/10 text-[#ff6636]",
  },
  {
    title: "Clear structure",
    description:
      "We reduce noise so learners can move through a path without wondering what to do next.",
    icon: Compass,
    tone: "bg-violet-500/10 text-violet-500",
  },
  {
    title: "Real community",
    description:
      "Support, accountability, and honest feedback matter more than vanity metrics.",
    icon: Users,
    tone: "bg-emerald-500/10 text-emerald-500",
  },
];

const principles = [
  {
    title: "Clarity over clutter",
    description:
      "Interfaces and lessons should remove hesitation, not add to it.",
    icon: Sparkles,
  },
  {
    title: "Accessible growth",
    description:
      "People should be able to learn from anywhere and still feel guided.",
    icon: Globe,
  },
  {
    title: "Trust by default",
    description:
      "Strong structure, honest pricing, and reliable support are not optional.",
    icon: ShieldCheck,
  },
  {
    title: "Learning that compounds",
    description:
      "Each lesson should make the next one easier to start and easier to finish.",
    icon: BookOpen,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/about" />

      <main className="flex-1">
        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-14 lg:py-20">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                <Sparkles className="size-3.5" /> Our Story
              </span>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Building a better way to{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  learn and grow
                </span>
              </h1>
              <p className="max-w-2xl text-base font-semibold leading-relaxed text-muted-foreground">
                DevForge exists to make skill-building feel focused, practical,
                and worth sticking with. We design for people who want clarity,
                forward motion, and less friction between intention and action.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { value: "67.1k", label: "Active learners" },
                { value: "6.3k", label: "Courses and paths" },
                { value: "99.9%", label: "Momentum we aim to protect" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border bg-card px-6 py-5 shadow-2xs"
                >
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mission & Values ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] items-start">
            <div className="space-y-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ff6636]">
                Mission
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-foreground">
                Help people build real skills without the usual noise
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground font-medium">
                Learning should not feel like fighting the product. Our mission
                is to reduce friction, clarify the next step, and help people
                make progress they can actually see.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground font-medium">
                Whether someone is changing careers, sharpening a specialty, or
                trying to finish what they start, DevForge is designed to turn
                good intentions into consistent movement.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <article
                    key={value.title}
                    className="rounded-2xl border border-border bg-card p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-[#ff6636]/40 hover:shadow-lg"
                  >
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl ${value.tone}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-base font-extrabold text-foreground">
                      {value.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium">
                      {value.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Principles ───────────────────────────────────────────────────── */}
        <section className="border-t border-b border-border/50 bg-muted/25 py-14 lg:py-18">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ff6636]">
                Principles
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-foreground">
                What shapes every route, lesson, and decision
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article
                    key={principle.title}
                    className="rounded-2xl border border-border bg-card p-6 shadow-2xs hover:border-[#ff6636]/40 transition-colors"
                  >
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-base font-extrabold text-foreground">
                      {principle.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium">
                      {principle.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Card ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/50 p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="pointer-events-none absolute -top-32 -right-32 size-72 rounded-full bg-[#ff6636]/10 blur-3xl" />

            <div className="max-w-2xl space-y-3 relative">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ff6636]">
                Start Now
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-foreground">
                Ready to learn with more structure and less friction?
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground font-medium">
                Explore the course catalog, create your account, and move into a
                cleaner learning flow designed to help you keep going.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0 relative">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-colors"
              >
                Browse Courses <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

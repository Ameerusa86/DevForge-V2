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
    tone: "bg-[#ffeee8] text-[#ff6636]",
  },
  {
    title: "Clear structure",
    description:
      "We reduce noise so learners can move through a path without wondering what to do next.",
    icon: Compass,
    tone: "bg-[#ebebff] text-[#564ffd]",
  },
  {
    title: "Real community",
    description:
      "Support, accountability, and honest feedback matter more than vanity metrics.",
    icon: Users,
    tone: "bg-[#e1f7e3] text-[#23bd33]",
  },
];

const principles = [
  {
    title: "Clarity over clutter",
    description: "Interfaces and lessons should remove hesitation, not add to it.",
    icon: Sparkles,
  },
  {
    title: "Accessible growth",
    description: "People should be able to learn from anywhere and still feel guided.",
    icon: Globe,
  },
  {
    title: "Trust by default",
    description: "Strong structure, honest pricing, and reliable support are not optional.",
    icon: ShieldCheck,
  },
  {
    title: "Learning that compounds",
    description: "Each lesson should make the next one easier to start and easier to finish.",
    icon: BookOpen,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#1d2026]">
      <MarketingPublicHeader activePath="/about" />

      <main>
        <section className="border-b border-[#e9eaf0] bg-[#f5f7fa]">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <p className="text-sm text-[#8c94a3]">Home / About</p>
            <div className="mt-5 max-w-[880px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Our Story
              </p>
              <h1 className="mt-3 text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px] lg:text-[72px]">
                Building a better way to learn and grow
              </h1>
              <p className="mt-5 max-w-[720px] text-lg leading-8 text-[#6e7485]">
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
                <div key={stat.label} className="border border-[#e9eaf0] bg-white px-5 py-5">
                  <p className="text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-[#6e7485]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Mission
              </p>
              <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
                Help people build real skills without the usual noise
              </h2>
              <p className="text-base leading-8 text-[#6e7485]">
                Learning should not feel like fighting the product. Our mission
                is to reduce friction, clarify the next step, and help people
                make progress they can actually see.
              </p>
              <p className="text-base leading-8 text-[#6e7485]">
                Whether someone is changing careers, sharpening a specialty, or
                trying to finish what they start, DevForge is designed to turn
                good intentions into consistent movement.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <article
                    key={value.title}
                    className="border border-[#e9eaf0] bg-[#f5f7fa] p-5 transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(29,32,38,0.08)]"
                  >
                    <div className={`flex size-12 items-center justify-center ${value.tone}`}>
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-[#1d2026]">
                      {value.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#6e7485]">
                      {value.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#f5f7fa] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto max-w-[1320px]">
            <div className="max-w-[720px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Principles
              </p>
              <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
                What shapes every route, lesson, and decision
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article key={principle.title} className="border border-[#e9eaf0] bg-white p-6">
                    <div className="flex size-12 items-center justify-center bg-[#ffeee8] text-[#ff6636]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-[#1d2026]">
                      {principle.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#6e7485]">
                      {principle.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto grid max-w-[1320px] gap-8 border border-[#e9eaf0] bg-white px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-12 lg:py-12">
            <div className="max-w-[720px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Start now
              </p>
              <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
                Ready to learn with more structure and less friction?
              </h2>
              <p className="mt-4 text-base leading-8 text-[#6e7485]">
                Explore the course catalog, create your account, and move into a
                cleaner learning flow designed to help you keep going.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
              >
                Browse courses <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-none border border-[#e9eaf0] bg-white px-6 py-3 text-sm font-semibold text-[#1d2026] transition hover:border-[#ff6636] hover:text-[#ff6636]"
              >
                Create free account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

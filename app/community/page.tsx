import Link from "next/link";
import {
  ArrowRight,
  Flame,
  MessageSquare,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";

const trendingTopics = [
  "React Patterns",
  "Next.js Routing",
  "System Design",
  "Career Advice",
  "Open Source",
  "Interview Prep",
];

const featuredDiscussions = [
  {
    title: "Showcase Saturday: What did you ship this week?",
    author: "Maya",
    tag: "Showcase",
    replies: 42,
    minutesAgo: 15,
  },
  {
    title: "How I went from tutorial hell to building real projects",
    author: "Sam",
    tag: "Learning",
    replies: 31,
    minutesAgo: 32,
  },
  {
    title: "Best way to structure API routes in growing apps",
    author: "Alex",
    tag: "Backend",
    replies: 18,
    minutesAgo: 54,
  },
];

const leaderboard = [
  { name: "Rina", points: 1820, accent: "bg-[#f7c948]" },
  { name: "Omar", points: 1695, accent: "bg-[#ebebff]" },
  { name: "Leo", points: 1602, accent: "bg-[#ffeee8]" },
  { name: "Nora", points: 1494, accent: "bg-[#e1f7e3]" },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white text-[#1d2026]">
      <MarketingPublicHeader activePath="/community" />

      <main>
        <section className="border-b border-[#e9eaf0] bg-[#f5f7fa]">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <p className="text-sm text-[#8c94a3]">Home / Community</p>
            <div className="mt-5 max-w-[860px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                DevForge Community
              </p>
              <h1 className="mt-3 text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px] lg:text-[72px]">
                Build with people, not in isolation
              </h1>
              <p className="mt-5 max-w-[720px] text-lg leading-8 text-[#6e7485]">
                Join discussions, share progress, ask for help, and learn from
                developers shipping real projects every day.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
              >
                Join the community <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-none border border-[#e9eaf0] bg-white px-6 py-3 text-sm font-semibold text-[#1d2026] transition hover:border-[#ff6636] hover:text-[#ff6636]"
              >
                Explore courses
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Active members",
                  value: "12.4k",
                  icon: Users,
                  tone: "bg-[#ebebff] text-[#564ffd]",
                },
                {
                  label: "Discussions this month",
                  value: "3.1k",
                  icon: MessageSquare,
                  tone: "bg-[#ffeee8] text-[#ff6636]",
                },
                {
                  label: "Projects shared weekly",
                  value: "240+",
                  icon: Zap,
                  tone: "bg-[#e1f7e3] text-[#23bd33]",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="border border-[#e9eaf0] bg-white p-5">
                    <div className={`flex size-12 items-center justify-center ${item.tone}`}>
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm text-[#6e7485]">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto grid max-w-[1320px] gap-6 xl:grid-cols-[minmax(0,2fr)_336px]">
            <div className="space-y-6">
              <section className="border border-[#e9eaf0] bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center bg-[#ffeee8] text-[#ff6636]">
                    <Flame className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c94a3]">
                      Hottest threads
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      Featured Discussions
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {featuredDiscussions.map((item) => (
                    <article
                      key={item.title}
                      className="border border-[#e9eaf0] bg-[#f5f7fa] p-5 transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(29,32,38,0.08)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex bg-[#fff2e5] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#65390c]">
                          {item.tag}
                        </span>
                        <span className="text-xs text-[#8c94a3]">
                          {item.minutesAgo}m ago
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-[#1d2026]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm text-[#6e7485]">
                        by {item.author} · {item.replies} replies
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="border border-[#e9eaf0] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c94a3]">
                  Trending now
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Popular Topics</h2>

                <div className="mt-5 flex flex-wrap gap-3">
                  {trendingTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-2 text-sm font-medium text-[#4e5566]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="border border-[#e9eaf0] bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center bg-[#ebebff] text-[#564ffd]">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c94a3]">
                      Top contributors
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      Weekly Leaderboard
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {leaderboard.map((member, index) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-11 items-center justify-center ${member.accent} text-sm font-semibold text-[#1d2026]`}
                        >
                          {member.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1d2026]">
                            {member.name}
                          </p>
                          <p className="text-xs text-[#8c94a3]">
                            Rank #{index + 1}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[#1d2026]">
                        {member.points}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border border-[#e9eaf0] bg-[#fff2e5] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ff6636]">
                  Start posting
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1d2026]">
                  Share your first build
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#6e7485]">
                  Ask a question, share a lesson learned, or post your latest
                  project to get feedback from the community.
                </p>
                <Link
                  href="/register"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                >
                  Create account to post
                </Link>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

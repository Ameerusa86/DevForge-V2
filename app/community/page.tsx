"use client";

import Link from "next/link";
import {
  ArrowRight,
  Flame,
  MessageSquare,
  Trophy,
  Users,
  Zap,
  Sparkles,
  Search,
  MessageCircle,
  Clock,
  ChevronRight,
  CheckCircle2,
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
    tagColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    replies: 42,
    minutesAgo: 15,
  },
  {
    title: "How I went from tutorial hell to building real projects",
    author: "Sam",
    tag: "Learning",
    tagColor: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    replies: 31,
    minutesAgo: 32,
  },
  {
    title: "Best way to structure API routes in growing apps",
    author: "Alex",
    tag: "Backend",
    tagColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    replies: 18,
    minutesAgo: 54,
  },
];

const leaderboard = [
  { name: "Rina", points: 1820, rankColor: "text-amber-500 bg-amber-500/10", avatarBg: "bg-amber-100 text-amber-700" },
  { name: "Omar", points: 1695, rankColor: "text-slate-400 bg-slate-500/10", avatarBg: "bg-slate-100 text-slate-700" },
  { name: "Leo", points: 1602, rankColor: "text-amber-700 bg-amber-700/10", avatarBg: "bg-amber-50 text-amber-900" },
  { name: "Nora", points: 1494, rankColor: "text-muted-foreground bg-muted", avatarBg: "bg-muted text-muted-foreground" },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/community" />

      <main>
        {/* ── Hero section ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-16 lg:py-20">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl space-y-5 text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                <Users className="size-3.5" /> DevForge Community
              </span>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Build with people,<br />
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  not in isolation.
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground font-semibold leading-relaxed">
                Join discussions, share progress, ask for help, and learn from developers shipping real-world projects every day.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white shadow-md hover:shadow-lg shadow-[#ff6636]/10 hover:bg-[#e95a2b] transition-all duration-200"
                >
                  Join the Community <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-foreground hover:border-[#ff6636]/50 hover:bg-[#ff6636]/5 hover:text-[#ff6636] transition-all duration-200"
                >
                  Explore Courses
                </Link>
              </div>
            </div>

            {/* Stat Cards Strip */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Active members",
                  value: "12.4k",
                  icon: Users,
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                  desc: "Developers learning together",
                },
                {
                  label: "Discussions this month",
                  value: "3.1k",
                  icon: MessageSquare,
                  color: "text-[#ff6636]",
                  bg: "bg-[#ff6636]/10",
                  desc: "Q&A, shares, and feedback",
                },
                {
                  label: "Projects shared weekly",
                  value: "240+",
                  icon: Zap,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                  desc: "Active builds & shipping logs",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold tracking-tight text-foreground">
                        {item.value}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground/75 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Main content grid ──────────────────────────────────────── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20 bg-background">
          <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[1fr_340px]">
            
            {/* Left Column: Threads and Topics */}
            <div className="space-y-8">
              
              {/* Featured Discussions */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3.5 mb-6 border-b border-border/50 pb-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                    <Flame className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Hottest threads
                    </p>
                    <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                      Featured Discussions
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {featuredDiscussions.map((item) => (
                    <article
                      key={item.title}
                      className="group relative flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-5 transition-all duration-300 hover:border-[#ff6636]/40 hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${item.tagColor}`}>
                          {item.tag}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                          <Clock className="size-3" />
                          {item.minutesAgo}m ago
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-[#ff6636] transition-colors duration-200">
                        <Link href="/register" className="focus:outline-none">
                          {item.title}
                        </Link>
                      </h3>

                      <div className="flex items-center justify-between pt-3 border-t border-border/50 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex size-5 items-center justify-center rounded-full bg-[#ff6636]/10 text-[#ff6636] font-bold text-[9px]">
                            {item.author.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            by {item.author}
                          </span>
                        </div>

                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                          <MessageCircle className="size-3.5 text-[#ff6636]" />
                          {item.replies} replies
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Popular Topics */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Trending now
                  </p>
                  <h2 className="text-lg font-extrabold text-foreground mt-0.5">Popular Topics</h2>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {trendingTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs font-bold text-muted-foreground hover:border-[#ff6636]/40 hover:text-foreground transition-all duration-200 cursor-pointer"
                    >
                      # {topic}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Leaderboard and CTA */}
            <aside className="space-y-8">
              
              {/* Leaderboard */}
              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Top contributors
                    </p>
                    <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                      Weekly Leaderboard
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {leaderboard.map((member, index) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/10 p-3.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${member.rankColor}`}>
                          {index + 1}
                        </span>
                        
                        {/* User Avatar Initials */}
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${member.avatarBg}`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="text-xs font-extrabold text-foreground leading-none">
                            {member.name}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground mt-1">
                            Rank #{index + 1} Member
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-extrabold text-[#ff6636]">
                          {member.points}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                          XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Start Posting Box */}
              <section className="relative overflow-hidden rounded-2xl border border-border bg-[#ff6636]/5 dark:bg-[#ff6636]/5 p-6 space-y-4">
                <div className="pointer-events-none absolute -bottom-32 -right-32 size-60 rounded-full bg-[#ff6636]/10 blur-2xl" />
                
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6636]/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#ff6636]">
                  <Sparkles className="size-3" /> Share Your Build
                </span>
                
                <h2 className="text-base font-extrabold text-foreground leading-snug">
                  Ask questions, share updates, gather feedback.
                </h2>
                
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  Post a question, share a lesson learned, or showcase your latest project to get fast feedback from the community.
                </p>
                
                <div className="pt-2">
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-3 text-xs font-black uppercase tracking-widest text-white shadow-md hover:shadow-lg shadow-[#ff6636]/10 transition-all duration-200"
                  >
                    Join to Post <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

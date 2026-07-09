"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Sparkles, X, HelpCircle, ShieldCheck, Mail, ArrowRight } from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
  order: number;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingPeriod: string;
  currency: string;
  isPopular: boolean;
  buttonText: string;
  buttonLink: string | null;
  features: PricingFeature[];
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/pricing");
        const data = await response.json();
        if (data.success) {
          setPlans(data.data);
        }
      } catch (error) {
        console.error("Error fetching pricing plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    if (currency === "USD") return `$${price}`;
    return `${price} ${currency}`;
  };

  const formatBillingPeriod = (period: string) => {
    switch (period) {
      case "monthly":
        return "/ month";
      case "yearly":
        return "/ year";
      case "one-time":
        return "one-time";
      default:
        return period;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/pricing" />

      <main>
        {/* ── Hero section ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-16 lg:py-20">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl space-y-5 text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                <ShieldCheck className="size-3.5" /> Pricing Options
              </span>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Simple, transparent<br />
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  pricing for everyone.
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground font-semibold leading-relaxed">
                Choose the plan that fits your learning pace and team size. No hidden fees, no surprise add-ons, and a clear path to career growth.
              </p>
            </div>
          </div>
        </section>

        {/* ── Main Plans section ────────────────────────────────────── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20 bg-background">
          <div className="mx-auto max-w-[1320px]">
            {loading ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-24 rounded-full" />
                      <Skeleton className="h-10 w-32 rounded-lg" />
                      <Skeleton className="h-4 w-40 rounded-full" />
                    </div>
                    <hr className="border-border/60" />
                    <div className="space-y-4">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton className="size-5 rounded-full" />
                          <Skeleton className="h-4 flex-1 rounded-full" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                <HelpCircle className="size-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-bold text-foreground">No plans found</h3>
                <p className="text-sm font-semibold text-muted-foreground mt-1">
                  Pricing plans are currently being updated. Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                {plans.map((plan) => (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${
                      plan.isPopular
                        ? "border-[#ff6636] bg-[#ff6636]/5 dark:bg-[#ff6636]/5 shadow-[0_20px_45px_rgba(255,102,54,0.12)]"
                        : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6636] to-[#ff8f6a] px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                        <Sparkles className="size-3" />
                        Most Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {plan.name}
                      </p>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold tracking-tight text-foreground">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <span className="text-sm font-bold text-muted-foreground">
                          {formatBillingPeriod(plan.billingPeriod)}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="mt-4 text-xs font-semibold text-muted-foreground leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 border-t border-border/50 pt-6">
                      <ul className="space-y-4">
                        {plan.features.map((feature) => (
                          <li key={feature.id} className="flex items-start gap-3 text-sm">
                            {feature.included ? (
                              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500">
                                <Check className="size-3" />
                              </span>
                            ) : (
                              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
                                <X className="size-3" />
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-xs font-semibold leading-relaxed",
                                feature.included ? "text-foreground" : "text-muted-foreground/50 line-through decoration-muted-foreground/20"
                              )}
                            >
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4">
                      {plan.buttonLink ? (
                        <Link
                          href={plan.buttonLink}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-extrabold uppercase tracking-widest transition-all duration-200 ${
                            plan.isPopular
                              ? "bg-[#ff6636] text-white hover:bg-[#e95a2b] shadow-md hover:shadow-lg shadow-[#ff6636]/10"
                              : "border border-border bg-card text-foreground hover:border-[#ff6636]/50 hover:bg-[#ff6636]/5 hover:text-[#ff6636]"
                          }`}
                        >
                          {plan.buttonText}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-extrabold uppercase tracking-widest transition-all duration-200 ${
                            plan.isPopular
                              ? "bg-[#ff6636] text-white hover:bg-[#e95a2b] shadow-md hover:shadow-lg shadow-[#ff6636]/10"
                              : "border border-border bg-card text-foreground hover:border-[#ff6636]/50 hover:bg-[#ff6636]/5 hover:text-[#ff6636]"
                          }`}
                        >
                          {plan.buttonText}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Enterprise Banner section ────────────────────────────── */}
        <section className="bg-muted/30 border-t border-border/40 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1320px]">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted p-8 sm:p-12 lg:p-14">
              <div className="pointer-events-none absolute -bottom-48 -left-48 size-96 rounded-full bg-[#ff6636]/5 blur-3xl" />
              <div className="pointer-events-none absolute -top-48 -right-48 size-96 rounded-full bg-violet-500/5 blur-3xl" />

              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-[720px] space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-violet-500">
                    <Mail className="size-3.5" /> Enterprise & Teams
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-tight">
                    Need a custom solution for your team?
                  </h2>
                  <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                    Contact us for enterprise bulk pricing, team-wide analytics dashboards, dedicated onboarding sessions, and custom curricula mapping to your internal training goals.
                  </p>
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                  <Link
                    href="/contact"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white shadow-md hover:shadow-lg shadow-[#ff6636]/10 transition-all duration-200"
                  >
                    Contact Sales <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

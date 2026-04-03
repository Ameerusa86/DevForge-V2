"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";

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
    <div className="min-h-screen bg-white text-[#1d2026]">
      <MarketingPublicHeader activePath="/pricing" />

      <main>
        <section className="border-b border-[#e9eaf0] bg-[#f5f7fa]">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <p className="text-sm text-[#8c94a3]">Home / Pricing</p>
            <div className="mt-5 max-w-[820px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Pricing
              </p>
              <h1 className="mt-3 text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[56px] lg:text-[72px]">
                Simple, transparent pricing
              </h1>
              <p className="mt-5 max-w-[720px] text-lg leading-8 text-[#6e7485]">
                Choose the plan that fits your learning pace and team size. No
                hidden fees, no surprise add-ons, and a clear path to support.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto max-w-[1320px]">
            {loading ? (
              <div className="border border-[#e9eaf0] bg-white px-6 py-12 text-center text-[#6e7485]">
                Loading pricing plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="border border-[#e9eaf0] bg-white px-6 py-12 text-center text-[#6e7485]">
                No pricing plans are available at the moment.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => (
                  <article
                    key={plan.id}
                    className={`relative flex h-full flex-col border p-6 ${
                      plan.isPopular
                        ? "border-[#ff6636] bg-[#fff2e5] shadow-[0_22px_50px_rgba(255,102,54,0.14)]"
                        : "border-[#e9eaf0] bg-white"
                    }`}
                  >
                    {plan.isPopular ? (
                      <div className="mb-5 inline-flex w-fit items-center gap-2 bg-[#ff6636] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                        <Sparkles className="size-3.5" />
                        Most Popular
                      </div>
                    ) : null}

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c94a3]">
                        {plan.name}
                      </p>
                      <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.03em] text-[#1d2026]">
                        {formatPrice(plan.price, plan.currency)}
                      </h2>
                      <p className="mt-1 text-sm text-[#8c94a3]">
                        {formatBillingPeriod(plan.billingPeriod)}
                      </p>
                      {plan.description ? (
                        <p className="mt-4 text-sm leading-7 text-[#6e7485]">
                          {plan.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-6 flex-1 border-t border-[#e9eaf0] pt-6">
                      <ul className="space-y-4">
                        {plan.features.map((feature) => (
                          <li key={feature.id} className="flex items-start gap-3 text-sm">
                            {feature.included ? (
                              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center bg-[#e1f7e3] text-[#15711f]">
                                <Check className="size-3.5" />
                              </span>
                            ) : (
                              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center bg-[#f5f7fa] text-[#8c94a3]">
                                <X className="size-3.5" />
                              </span>
                            )}
                            <span
                              className={
                                feature.included ? "text-[#4e5566]" : "text-[#8c94a3]"
                              }
                            >
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      {plan.buttonLink ? (
                        <Link
                          href={plan.buttonLink}
                          className={`inline-flex w-full items-center justify-center rounded-none px-6 py-3 text-sm font-semibold transition ${
                            plan.isPopular
                              ? "bg-[#ff6636] text-white hover:bg-[#e95a2b]"
                              : "border border-[#e9eaf0] bg-white text-[#1d2026] hover:border-[#ff6636] hover:text-[#ff6636]"
                          }`}
                        >
                          {plan.buttonText}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`inline-flex w-full items-center justify-center rounded-none px-6 py-3 text-sm font-semibold transition ${
                            plan.isPopular
                              ? "bg-[#ff6636] text-white hover:bg-[#e95a2b]"
                              : "border border-[#e9eaf0] bg-white text-[#1d2026] hover:border-[#ff6636] hover:text-[#ff6636]"
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

        <section className="bg-[#f5f7fa] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto grid max-w-[1320px] gap-8 border border-[#e9eaf0] bg-white px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-12 lg:py-12">
            <div className="max-w-[720px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Enterprise & teams
              </p>
              <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
                Need a custom solution?
              </h2>
              <p className="mt-4 text-base leading-8 text-[#6e7485]">
                Contact us if you need enterprise pricing, team-wide onboarding,
                or a structure that matches internal training and growth.
              </p>
            </div>

            <div className="flex items-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

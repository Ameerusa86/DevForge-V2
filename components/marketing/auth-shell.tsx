import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { MarketingPublicHeader } from "@/components/marketing/public-chrome";

export function MarketingAuthShell({
  mode,
  eyebrow,
  title,
  subtitle,
  switchHref,
  switchLabel,
  switchPrefix,
  sideTitle,
  sideDescription,
  bullets,
  children,
}: {
  mode: "login" | "register";
  eyebrow: string;
  title: string;
  subtitle: string;
  switchHref: string;
  switchLabel: string;
  switchPrefix: string;
  sideTitle: string;
  sideDescription: string;
  bullets: string[];
  children: ReactNode;
}) {
  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f7fa_0%,#ffffff_100%)] text-[#1d2026]">
      <MarketingPublicHeader activePath={isLogin ? "/login" : "/register"} compact />

      <main className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-6 flex justify-end">
            <p className="text-sm text-[#6e7485]">
              {switchPrefix}{" "}
              <Link href={switchHref} className="font-semibold text-[#ff6636]">
                {switchLabel}
              </Link>
            </p>
          </div>

          <div className="grid overflow-hidden border border-[#e9eaf0] bg-white shadow-[0_24px_60px_rgba(29,32,38,0.08)] lg:grid-cols-[836px_minmax(0,648px)]">
            <div className="relative hidden min-h-[720px] overflow-hidden lg:block">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffeee8_0%,#fff2e5_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,102,54,0.2),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(86,79,253,0.16),transparent_28%)]" />
              <div className="absolute inset-0">
                <Image
                  src="/images/HeroImg.jpg"
                  alt={sideTitle}
                  fill
                  priority
                  sizes="836px"
                  className="object-cover opacity-85"
                  style={{ objectPosition: isLogin ? "center 22%" : "center 28%" }}
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,32,38,0.06)_0%,rgba(29,32,38,0.3)_100%)]" />
            </div>

            <div className="flex items-center bg-white px-6 py-10 sm:px-10 lg:px-16">
              <div className="mx-auto w-full max-w-[520px]">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                    {eyebrow}
                  </p>
                  <h1 className="text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#1d2026] sm:text-[48px]">
                    {title}
                  </h1>
                  <p className="max-w-[520px] text-base leading-7 text-[#6e7485]">
                    {subtitle}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 rounded-none border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1d2026]">
                      {sideTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#6e7485]">
                      {sideDescription}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 size-5 shrink-0 text-[#ff6636]" />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:hidden">
                  {bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-2 text-sm text-[#4e5566]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#23bd33]" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">{children}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 hidden grid-cols-3 gap-4 lg:grid">
            {bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 border border-[#e9eaf0] bg-white px-4 py-4"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#23bd33]" />
                <span className="text-sm text-[#4e5566]">{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

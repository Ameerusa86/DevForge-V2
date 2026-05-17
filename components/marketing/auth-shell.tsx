import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-[#f5f7fa] text-[#1d2026]">
      <MarketingPublicHeader
        activePath={isLogin ? "/login" : "/register"}
        compact
      />

      <main className="min-h-[calc(100vh-89px)]">
        <div className="grid min-h-[calc(100vh-89px)] w-full lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
          <section className="relative hidden overflow-hidden bg-[#1d2026] lg:block">
            <div className="absolute inset-0">
              <Image
                src="/images/HeroImg.jpg"
                alt={sideTitle}
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
                style={{
                  objectPosition: isLogin ? "center 28%" : "center 34%",
                }}
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,32,38,0.18)_0%,rgba(29,32,38,0.78)_100%)]" />
            <div className="absolute inset-y-0 left-0 w-[42%] bg-[linear-gradient(90deg,rgba(29,32,38,0.62)_0%,rgba(29,32,38,0)_100%)]" />

            <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                Learning Management Systems
              </p>
              <h2 className="mt-4 max-w-[520px] text-5xl font-semibold leading-[1.02] tracking-[-0.03em]">
                {sideTitle}
              </h2>
              <p className="mt-4 max-w-[560px] text-base leading-8 text-white/80">
                {sideDescription}
              </p>

              <div className="mt-7 space-y-3">
                {bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-2 text-sm text-white/90"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#23bd33]" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative flex items-center bg-[linear-gradient(180deg,#232836_0%,#1d2026_100%)] px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
            <div className="mx-auto w-full max-w-[540px] border border-white/10 bg-[#252b3b] p-6 shadow-[0_24px_64px_rgba(8,11,17,0.45)] sm:p-8">
              <div className="mb-6 flex justify-end">
                <p className="text-sm text-[#b7bac7]">
                  {switchPrefix}{" "}
                  <Link
                    href={switchHref}
                    className="font-semibold text-[#ff6636]"
                  >
                    {switchLabel}
                  </Link>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                  {eyebrow}
                </p>
                <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.4rem]">
                  {title}
                </h1>
                <p className="max-w-[520px] text-sm leading-7 text-[#d0d3dd] sm:text-base">
                  {subtitle}
                </p>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:hidden">
                {bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-2 border border-white/15 bg-white/5 p-3 text-xs text-[#d0d3dd] sm:text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#23bd33]" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">{children}</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

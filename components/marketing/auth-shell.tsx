import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, Shield } from "lucide-react";

import { MarketingPublicHeader } from "@/components/marketing/public-chrome";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader
        activePath={isLogin ? "/login" : "/register"}
        compact
      />

      <main className="min-h-[calc(100vh-80px)]">
        <div className="grid min-h-[calc(100vh-80px)] w-full lg:grid-cols-[1fr_1.1fr]">
          {/* Left Hero Panel */}
          <section className="relative hidden overflow-hidden bg-[#103436] lg:block">
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <Image
                src="/images/auth_hero.png"
                alt={sideTitle}
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 50vw, 45vw"
                className="object-contain p-8 transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
            {/* Subtle premium dark gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a2223] via-transparent to-transparent opacity-40 pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-[#0a2223]/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14 space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 backdrop-blur px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ff6636]">
                <Shield className="size-3" /> DevForge
              </span>
              <h2 className="max-w-[480px] text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                {sideTitle}
              </h2>
              <p className="max-w-[500px] text-xs font-semibold text-white/70 leading-relaxed">
                {sideDescription}
              </p>

              <div className="mt-6 space-y-2.5 pt-2">
                {bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-center gap-2.5 text-xs font-bold text-white"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Form Card Panel (Sized larger and responsive) */}
          <section className="relative flex items-center justify-center bg-muted/15 px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
            <div className="w-full max-w-[540px] rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl space-y-6">
              <div className="flex justify-end text-xs font-semibold text-muted-foreground border-b border-border/50 pb-4">
                <p>
                  {switchPrefix}{" "}
                  <Link
                    href={switchHref}
                    className="font-bold text-[#ff6636] hover:text-[#e95a2b] transition-colors"
                  >
                    {switchLabel}
                  </Link>
                </p>
              </div>

              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-[#ff6636]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">
                  {eyebrow}
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                <p className="max-w-[520px] text-xs font-semibold text-muted-foreground leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Mobile bullets */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:hidden">
                {bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-[10px] font-bold text-muted-foreground"
                  >
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">{bullet}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">{children}</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

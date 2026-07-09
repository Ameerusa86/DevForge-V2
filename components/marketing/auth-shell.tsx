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
        <div className="grid min-h-[calc(100vh-80px)] w-full lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
          
          {/* Left Hero Panel */}
          <section className="relative hidden overflow-hidden bg-muted lg:block">
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
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-background/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14 space-y-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6636]/30 bg-background/80 backdrop-blur px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ff6636]">
                <Shield className="size-3" /> Dreams LMS
              </span>
              <h2 className="max-w-[520px] text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
                {sideTitle}
              </h2>
              <p className="max-w-[560px] text-sm font-semibold text-muted-foreground leading-relaxed">
                {sideDescription}
              </p>

              <div className="mt-7 space-y-3 pt-2">
                {bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-center gap-2.5 text-xs font-bold text-foreground"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Form Card Panel */}
          <section className="relative flex items-center justify-center bg-muted/20 px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
            <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8 space-y-6">
              
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

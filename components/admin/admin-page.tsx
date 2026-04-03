"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("admin-page flex flex-col gap-6 lg:gap-8", className)}>
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  meta,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("admin-page-header", className)}>
      <div className="admin-page-header__content">
        <div className="max-w-3xl space-y-4">
          {eyebrow ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="admin-header-badge" variant="outline">
                {eyebrow}
              </Badge>
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Control panel
              </span>
            </div>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {meta ? (
            <div className="flex flex-wrap items-center gap-3">{meta}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function AdminPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("admin-panel", className)}>
      {title || description || action ? (
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="space-y-2">
            {title ? (
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            ) : null}
            {description ? (
              <CardDescription className="max-w-2xl text-sm leading-6">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("px-6 py-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function AdminToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-toolbar", className)}>{children}</div>;
}

const metricToneClasses = {
  primary: "bg-primary/12 text-primary ring-primary/10",
  info: "bg-sky-500/12 text-sky-700 ring-sky-500/10",
  success: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/10",
  warning: "bg-amber-500/14 text-amber-700 ring-amber-500/10",
} as const;

export function AdminMetricCard({
  title,
  value,
  description,
  icon: Icon,
  change,
  tone = "primary",
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  change?: string;
  tone?: keyof typeof metricToneClasses;
  className?: string;
}) {
  return (
    <Card className={cn("admin-metric-card gap-4", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl ring-1",
            metricToneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {change ? (
          <Badge variant="outline" className="admin-metric-badge">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {change}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
        <div className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
          {value}
        </div>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

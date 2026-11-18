"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  type LucideIcon,
  RefreshCw,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SystemStatus {
  status: string;
  message: string | null;
  lastChecked: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  startedAt: string;
  resolvedAt: string | null;
  updates: Array<{
    id: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; badgeClass: string; icon: LucideIcon; dot: string }
> = {
  OPERATIONAL: {
    label: "All Systems Operational",
    color: "text-emerald-600 dark:text-emerald-400",
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  DEGRADED: {
    label: "Degraded Performance",
    color: "text-amber-600 dark:text-amber-400",
    badgeClass:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
    dot: "bg-amber-500",
  },
  PARTIAL_OUTAGE: {
    label: "Partial Outage",
    color: "text-[#ff6636]",
    badgeClass: "border-[#ff6636]/30 bg-[#ff6636]/10 text-[#ff6636]",
    icon: AlertCircle,
    dot: "bg-[#ff6636]",
  },
  MAJOR_OUTAGE: {
    label: "Major Outage",
    color: "text-red-600 dark:text-red-400",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    icon: XCircle,
    dot: "bg-red-500",
  },
  MAINTENANCE: {
    label: "Under Maintenance",
    color: "text-blue-600 dark:text-blue-400",
    badgeClass:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: Wrench,
    dot: "bg-blue-500",
  },
};

const incidentStatusLabels: Record<string, string> = {
  INVESTIGATING: "Investigating",
  IDENTIFIED: "Identified",
  MONITORING: "Monitoring",
  RESOLVED: "Resolved",
};

export default function StatusPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<
    MaintenanceWindow[]
  >([]);
  const [uptime, setUptime] = useState("99.99");

  const loadStatusData = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const data = await response.json();

      if (data.success) {
        setSystemStatus(data.data.systemStatus);
        setServices(data.data.services);
        setActiveIncidents(data.data.activeIncidents);
        setRecentIncidents(data.data.recentIncidents);
        setUpcomingMaintenance(data.data.upcomingMaintenance);
        setUptime(data.data.uptime);
      }
    } catch (error) {
      console.error("Failed to load status data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStatusData();
    const interval = setInterval(() => {
      void loadStatusData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentStatus = systemStatus
    ? statusConfig[systemStatus.status] || statusConfig.OPERATIONAL
    : statusConfig.OPERATIONAL;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/status" />

      <main className="flex-1">
        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-14 lg:py-18">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-widest",
                    currentStatus.badgeClass,
                  )}
                >
                  <StatusIcon className="size-3.5" />
                  {currentStatus.label}
                </span>

                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Platform{" "}
                  <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                    System Status
                  </span>
                </h1>

                <p className="text-sm sm:text-base font-semibold leading-relaxed text-muted-foreground">
                  {systemStatus?.message ||
                    "Live service availability, incident updates, and scheduled maintenance across DevForge."}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => loadStatusData(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-60 transition-all"
                  >
                    <RefreshCw
                      className={cn("size-3.5", refreshing && "animate-spin")}
                    />
                    {refreshing ? "Checking…" : "Refresh Status"}
                  </button>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-colors"
                  >
                    Report an Issue <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 shrink-0">
                <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    30-Day Uptime
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {uptime}%
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Monitored Services
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-foreground">
                    {services.length}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Last Checked
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-foreground">
                    {systemStatus
                      ? new Date(systemStatus.lastChecked).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )
                      : "Just now"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Active Incidents ─────────────────────────────────────────────── */}
        {activeIncidents.length > 0 && (
          <section className="border-b border-border/60 bg-red-500/5 py-10">
            <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="size-5 text-red-500" />
                <h2 className="text-xl font-extrabold text-foreground">
                  Active Incidents ({activeIncidents.length})
                </h2>
              </div>

              <div className="space-y-4">
                {activeIncidents.map((incident) => (
                  <article
                    key={incident.id}
                    className="rounded-2xl border border-red-500/30 bg-card p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-foreground">
                            {incident.title}
                          </h3>
                          <Badge variant="destructive" className="text-[10px]">
                            {incidentStatusLabels[incident.status] ||
                              incident.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {incident.description}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Started {new Date(incident.startedAt).toLocaleString()}
                      </span>
                    </div>

                    {incident.updates && incident.updates.length > 0 && (
                      <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          Timeline Updates
                        </p>
                        {incident.updates.map((update) => (
                          <div
                            key={update.id}
                            className="rounded-xl border border-border/60 bg-muted/25 p-3.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#ff6636]">
                                {incidentStatusLabels[update.status] ||
                                  update.status}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(update.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {update.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Upcoming Maintenance ─────────────────────────────────────────── */}
        {upcomingMaintenance.length > 0 && (
          <section className="border-b border-border/60 bg-blue-500/5 py-10">
            <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="flex items-center gap-2.5">
                <Wrench className="size-5 text-blue-500" />
                <h2 className="text-xl font-extrabold text-foreground">
                  Scheduled Maintenance ({upcomingMaintenance.length})
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {upcomingMaintenance.map((maint) => (
                  <article
                    key={maint.id}
                    className="rounded-2xl border border-blue-500/30 bg-card p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-foreground">
                        {maint.title}
                      </h3>
                      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                        {maint.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {maint.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground pt-1">
                      <Clock className="size-3.5 text-blue-500" />
                      <span>
                        {new Date(maint.scheduledStart).toLocaleString()} →{" "}
                        {new Date(maint.scheduledEnd).toLocaleString()}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Services List ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff6636]">
                Infrastructure
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                Core Services
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-500" /> Auto-refreshes
              every 60s
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-2">
              <Activity className="size-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">
                No services configured yet
              </p>
              <p className="text-xs text-muted-foreground">
                Platform components will appear here once monitored.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => {
                const serviceStatus =
                  statusConfig[service.status] || statusConfig.OPERATIONAL;
                const ServiceIcon = serviceStatus.icon;
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-2xs hover:border-[#ff6636]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                          serviceStatus.badgeClass,
                        )}
                      >
                        <ServiceIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-foreground truncate">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-xs font-medium text-muted-foreground line-clamp-1 mt-0.5">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold shrink-0",
                        serviceStatus.badgeClass,
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          serviceStatus.dot,
                        )}
                      />
                      {serviceStatus.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Recent Incidents ─────────────────────────────────────────────── */}
        {recentIncidents.length > 0 && (
          <section className="border-t border-border/60 bg-muted/20 py-12 lg:py-16">
            <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                  History
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                  Recent Incidents (Last 7 Days)
                </h2>
              </div>

              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <article
                    key={incident.id}
                    className="rounded-2xl border border-border bg-card p-6 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-foreground">
                          {incident.title}
                        </h3>
                        <Badge
                          variant={
                            incident.status === "RESOLVED"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {incidentStatusLabels[incident.status] ||
                            incident.status}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {new Date(incident.startedAt).toLocaleString()}
                        {incident.resolvedAt
                          ? ` — ${new Date(incident.resolvedAt).toLocaleString()}`
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {incident.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

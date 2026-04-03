"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  type LucideIcon,
  Wrench,
  XCircle,
} from "lucide-react";

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
  { label: string; color: string; icon: LucideIcon; bg: string }
> = {
  OPERATIONAL: {
    label: "All Systems Operational",
    color: "text-green-600",
    icon: CheckCircle2,
    bg: "bg-green-500",
  },
  DEGRADED: {
    label: "Degraded Performance",
    color: "text-yellow-600",
    icon: AlertTriangle,
    bg: "bg-yellow-500",
  },
  PARTIAL_OUTAGE: {
    label: "Partial Outage",
    color: "text-orange-600",
    icon: AlertCircle,
    bg: "bg-orange-500",
  },
  MAJOR_OUTAGE: {
    label: "Major Outage",
    color: "text-red-600",
    icon: XCircle,
    bg: "bg-red-500",
  },
  MAINTENANCE: {
    label: "Under Maintenance",
    color: "text-blue-600",
    icon: Wrench,
    bg: "bg-blue-500",
  },
};

const incidentStatusLabels: Record<string, string> = {
  INVESTIGATING: "🔍 Investigating",
  IDENTIFIED: "🎯 Identified",
  MONITORING: "👁️ Monitoring",
  RESOLVED: "✅ Resolved",
};

export default function StatusPage() {
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<
    MaintenanceWindow[]
  >([]);
  const [uptime, setUptime] = useState("99.99");

  useEffect(() => {
    loadStatusData();
    // Refresh every 60 seconds
    const interval = setInterval(loadStatusData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStatusData = async () => {
    try {
      const response = await fetch("/api/status");
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
    }
  };

  const currentStatus = systemStatus
    ? statusConfig[systemStatus.status] || statusConfig.OPERATIONAL
    : statusConfig.OPERATIONAL;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/50 bg-linear-to-br from-background via-muted/10 to-background">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="page-shell-full py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${currentStatus.color} bg-opacity-10`}
              >
                <StatusIcon className="h-5 w-5" />
                <span className="font-medium">{currentStatus.label}</span>
              </div>
              <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">
                System Status
              </h1>
              <p className="text-lg text-muted-foreground">
                {systemStatus?.message ||
                  "Current status and uptime for all services"}
              </p>
              <div className="flex items-center justify-center gap-8 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{uptime}%</p>
                  <p className="text-sm text-muted-foreground">Uptime (30 days)</p>
                </div>
                {systemStatus && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Last checked:{" "}
                      {new Date(systemStatus.lastChecked).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <section className="py-12 bg-red-50 dark:bg-red-950/20 border-b border-border">
            <div className="page-shell-full">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
                Active Incidents
              </h2>
              <div className="space-y-4">
                {activeIncidents.map((incident) => (
                  <Card
                    key={incident.id}
                    className="border-red-200 dark:border-red-900"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{incident.title}</h3>
                            <Badge variant="destructive">
                              {incidentStatusLabels[incident.status]}
                            </Badge>
                            <Badge variant="outline">{incident.severity}</Badge>
                          </div>
                          <p className="text-muted-foreground">{incident.description}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Started {new Date(incident.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {incident.updates && incident.updates.length > 0 && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          <h4 className="font-semibold text-sm">Updates</h4>
                          {incident.updates.map((update) => (
                            <div key={update.id} className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {incidentStatusLabels[update.status]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(update.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{update.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Maintenance */}
        {upcomingMaintenance.length > 0 && (
          <section className="py-12 bg-blue-50 dark:bg-blue-950/20 border-b border-border">
            <div className="page-shell-full">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Wrench className="h-6 w-6 text-blue-600" />
                Scheduled Maintenance
              </h2>
              <div className="space-y-4">
                {upcomingMaintenance.map((maint) => (
                  <Card key={maint.id} className="border-blue-200 dark:border-blue-900">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{maint.title}</h3>
                            <Badge>{maint.status}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{maint.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(maint.scheduledStart).toLocaleString()} →{" "}
                                {new Date(maint.scheduledEnd).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Services Status */}
        <section className="py-16">
          <div className="page-shell-full">
            <h2 className="text-2xl font-bold mb-8">Services</h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No services configured</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => {
                  const serviceStatus = statusConfig[service.status] || statusConfig.OPERATIONAL;
                  const ServiceIcon = serviceStatus.icon;
                  return (
                    <Card key={service.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${serviceStatus.bg}/10`}>
                              <ServiceIcon className={`h-5 w-5 ${serviceStatus.color}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{service.name}</h3>
                              {service.description && (
                                <p className="text-sm text-muted-foreground">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              service.status === "OPERATIONAL"
                                ? "secondary"
                                : "destructive"
                            }
                            className="flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${serviceStatus.bg}`} />
                            {serviceStatus.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent Incidents */}
        {recentIncidents.length > 0 && (
          <section className="py-16 bg-muted/30 border-t border-border">
            <div className="page-shell-full">
              <h2 className="text-2xl font-bold mb-8">
                Recent Incidents (Last 7 Days)
              </h2>
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <Card key={incident.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{incident.title}</h3>
                            <Badge
                              variant={
                                incident.status === "RESOLVED"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {incidentStatusLabels[incident.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {incident.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(incident.startedAt).toLocaleString()}
                            {incident.resolvedAt &&
                              ` - ${new Date(incident.resolvedAt).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

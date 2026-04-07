"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";

interface SystemStatus {
  id: string;
  status: string;
  message: string | null;
  lastChecked: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  status: string;
  order: number;
  isActive: boolean;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  affectedServices: string[];
  startedAt: string;
  resolvedAt: string | null;
  updates: IncidentUpdate[];
}

interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  createdAt: string;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  affectedServices: string[];
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
}

const statusIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  OPERATIONAL: CheckCircle2,
  DEGRADED: AlertTriangle,
  PARTIAL_OUTAGE: AlertCircle,
  MAJOR_OUTAGE: XCircle,
  MAINTENANCE: Wrench,
};

export default function AdminStatusPage() {
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceWindow[]>([]);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    status: "OPERATIONAL",
  });
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    status: "INVESTIGATING",
    severity: "MINOR",
    affectedServices: [] as string[],
  });
  const [newMaintenance, setNewMaintenance] = useState({
    title: "",
    description: "",
    scheduledStart: "",
    scheduledEnd: "",
    affectedServices: [] as string[],
  });
  const [serviceSearch, setServiceSearch] = useState("");
  const [incidentFilter, setIncidentFilter] = useState<
    "ALL" | "OPEN" | "RESOLVED"
  >("ALL");
  const [incidentSearch, setIncidentSearch] = useState("");
  const [maintenanceFilter, setMaintenanceFilter] = useState<
    "ALL" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  >("ALL");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/admin/status");
      const data = await response.json();

      if (data.success) {
        setSystemStatus(data.data.systemStatus);
        setServices(data.data.services);
        setIncidents(data.data.incidents);
        setMaintenance(data.data.maintenanceWindows);
      } else {
        toast.error("Failed to load status data");
      }
    } catch (error) {
      toast.error("Failed to load status data");
    } finally {
      setLoading(false);
    }
  };

  const updateSystemStatus = async (status: string, message: string) => {
    try {
      const response = await fetch("/api/admin/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, message }),
      });

      const data = await response.json();
      if (data.success) {
        setSystemStatus(data.data);
        toast.success("System status updated");
      } else {
        toast.error("Failed to update system status");
      }
    } catch (error) {
      toast.error("Failed to update system status");
    }
  };

  const addService = async () => {
    if (!newService.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      const response = await fetch("/api/admin/status/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newService, order: services.length }),
      });

      const data = await response.json();
      if (data.success) {
        setServices([...services, data.data]);
        setNewService({ name: "", description: "", status: "OPERATIONAL" });
        toast.success("Service added");
      } else {
        toast.error("Failed to add service");
      }
    } catch {
      toast.error("Failed to add service");
    }
  };

  const updateService = async (service: Service) => {
    try {
      const response = await fetch("/api/admin/status/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Service updated");
      } else {
        toast.error("Failed to update service");
      }
    } catch {
      toast.error("Failed to update service");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/admin/status/services?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setServices(services.filter((s) => s.id !== id));
        toast.success("Service deleted");
      } else {
        toast.error("Failed to delete service");
      }
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const addIncident = async () => {
    if (!newIncident.title.trim() || !newIncident.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      const response = await fetch("/api/admin/status/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIncident),
      });

      const data = await response.json();
      if (data.success) {
        setIncidents([data.data, ...incidents]);
        setNewIncident({
          title: "",
          description: "",
          status: "INVESTIGATING",
          severity: "MINOR",
          affectedServices: [],
        });
        toast.success("Incident created");
      } else {
        toast.error("Failed to create incident");
      }
    } catch {
      toast.error("Failed to create incident");
    }
  };

  const updateIncident = async (incident: Incident) => {
    try {
      const response = await fetch("/api/admin/status/incidents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident),
      });

      const data = await response.json();
      if (data.success) {
        setIncidents(
          incidents.map((i) => (i.id === incident.id ? data.data : i)),
        );
        toast.success("Incident updated");
      } else {
        toast.error("Failed to update incident");
      }
    } catch {
      toast.error("Failed to update incident");
    }
  };

  const deleteIncident = async (id: string) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;

    try {
      const response = await fetch(`/api/admin/status/incidents?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setIncidents(incidents.filter((i) => i.id !== id));
        toast.success("Incident deleted");
      } else {
        toast.error("Failed to delete incident");
      }
    } catch {
      toast.error("Failed to delete incident");
    }
  };

  const addMaintenance = async () => {
    if (
      !newMaintenance.title.trim() ||
      !newMaintenance.scheduledStart ||
      !newMaintenance.scheduledEnd
    ) {
      toast.error("All fields are required");
      return;
    }

    try {
      const response = await fetch("/api/admin/status/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaintenance),
      });

      const data = await response.json();
      if (data.success) {
        setMaintenance([...maintenance, data.data]);
        setNewMaintenance({
          title: "",
          description: "",
          scheduledStart: "",
          scheduledEnd: "",
          affectedServices: [],
        });
        toast.success("Maintenance window created");
      } else {
        toast.error("Failed to create maintenance window");
      }
    } catch {
      toast.error("Failed to create maintenance window");
    }
  };

  const updateMaintenance = async (maint: MaintenanceWindow) => {
    try {
      const response = await fetch("/api/admin/status/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maint),
      });

      const data = await response.json();
      if (data.success) {
        setMaintenance(
          maintenance.map((m) => (m.id === maint.id ? data.data : m)),
        );
        toast.success("Maintenance window updated");
      } else {
        toast.error("Failed to update maintenance window");
      }
    } catch {
      toast.error("Failed to update maintenance window");
    }
  };

  const deleteMaintenance = async (id: string) => {
    if (!confirm("Are you sure you want to delete this maintenance window?"))
      return;

    try {
      const response = await fetch(`/api/admin/status/maintenance?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setMaintenance(maintenance.filter((m) => m.id !== id));
        toast.success("Maintenance window deleted");
      } else {
        toast.error("Failed to delete maintenance window");
      }
    } catch {
      toast.error("Failed to delete maintenance window");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading status data...</p>
        </div>
      </div>
    );
  }

  const filteredServices = services.filter((service) => {
    if (!serviceSearch.trim()) return true;
    const q = serviceSearch.toLowerCase();
    return (
      service.name.toLowerCase().includes(q) ||
      (service.description || "").toLowerCase().includes(q)
    );
  });

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      !incidentSearch.trim() ||
      incident.title.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      incident.description.toLowerCase().includes(incidentSearch.toLowerCase());

    const isResolved = incident.status === "RESOLVED";
    const matchesStatus =
      incidentFilter === "ALL" ||
      (incidentFilter === "OPEN" && !isResolved) ||
      (incidentFilter === "RESOLVED" && isResolved);

    return matchesSearch && matchesStatus;
  });

  const filteredMaintenance = maintenance.filter((maint) => {
    return maintenanceFilter === "ALL" || maint.status === maintenanceFilter;
  });

  const serviceNameById = new Map(
    services.map((service) => [service.id, service.name]),
  );

  const StatusIcon = systemStatus ? statusIcons[systemStatus.status] : Activity;

  return (
    <AdminPage className="mx-auto max-w-7xl p-6">
      <AdminPageHeader
        eyebrow="Reliability center"
        title="Status Page Management"
        description="Monitor and manage system status, services, incidents, and planned maintenance windows."
        actions={
          <Link href="/status" target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2">
              <Activity className="h-4 w-4" />
              View Public Page
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overall Status</p>
            <p className="mt-1 text-2xl font-bold">
              {systemStatus?.status || "UNKNOWN"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Services</p>
            <p className="mt-1 text-2xl font-bold">
              {services.filter((s) => s.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open Incidents</p>
            <p className="mt-1 text-2xl font-bold">
              {incidents.filter((i) => i.status !== "RESOLVED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Upcoming Maintenance
            </p>
            <p className="mt-1 text-2xl font-bold">
              {
                maintenance.filter(
                  (m) => m.status === "SCHEDULED" || m.status === "IN_PROGRESS",
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Overall Status</Label>
              <Select
                value={systemStatus?.status || "OPERATIONAL"}
                onValueChange={(value) => {
                  if (systemStatus) {
                    updateSystemStatus(value, systemStatus.message || "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATIONAL">✅ Operational</SelectItem>
                  <SelectItem value="DEGRADED">
                    ⚠️ Degraded Performance
                  </SelectItem>
                  <SelectItem value="PARTIAL_OUTAGE">
                    🟠 Partial Outage
                  </SelectItem>
                  <SelectItem value="MAJOR_OUTAGE">🔴 Major Outage</SelectItem>
                  <SelectItem value="MAINTENANCE">🔧 Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Status Message</Label>
              <Input
                value={systemStatus?.message || ""}
                onChange={(e) => {
                  if (systemStatus) {
                    setSystemStatus({
                      ...systemStatus,
                      message: e.target.value,
                    });
                  }
                }}
                onBlur={() => {
                  if (systemStatus) {
                    updateSystemStatus(
                      systemStatus.status,
                      systemStatus.message || "",
                    );
                  }
                }}
                placeholder="All systems operational"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Service
              </CardTitle>
              <CardDescription>
                Monitor individual services and components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    placeholder="API Server"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newService.description}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        description: e.target.value,
                      })
                    }
                    placeholder="Main API endpoint"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newService.status}
                    onValueChange={(value) =>
                      setNewService({ ...newService, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="DEGRADED">Degraded</SelectItem>
                      <SelectItem value="PARTIAL_OUTAGE">
                        Partial Outage
                      </SelectItem>
                      <SelectItem value="MAJOR_OUTAGE">Major Outage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={addService} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No services yet. Add your first service above.
                </p>
              ) : filteredServices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No services match your search.
                </p>
              ) : (
                filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    className={!service.isActive ? "opacity-60" : ""}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={service.name}
                                onChange={(e) => {
                                  const updated = services.map((s) =>
                                    s.id === service.id
                                      ? { ...s, name: e.target.value }
                                      : s,
                                  );
                                  setServices(updated);
                                }}
                                onBlur={() => updateService(service)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={service.description || ""}
                                onChange={(e) => {
                                  const updated = services.map((s) =>
                                    s.id === service.id
                                      ? { ...s, description: e.target.value }
                                      : s,
                                  );
                                  setServices(updated);
                                }}
                                onBlur={() => updateService(service)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={service.status}
                                onValueChange={(value) => {
                                  const updated = services.map((s) =>
                                    s.id === service.id
                                      ? { ...s, status: value }
                                      : s,
                                  );
                                  setServices(updated);
                                  updateService({ ...service, status: value });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OPERATIONAL">
                                    ✅ Operational
                                  </SelectItem>
                                  <SelectItem value="DEGRADED">
                                    ⚠️ Degraded
                                  </SelectItem>
                                  <SelectItem value="PARTIAL_OUTAGE">
                                    🟠 Partial Outage
                                  </SelectItem>
                                  <SelectItem value="MAJOR_OUTAGE">
                                    🔴 Major Outage
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                              <Switch
                                checked={service.isActive}
                                onCheckedChange={(checked) => {
                                  const updated = services.map((s) =>
                                    s.id === service.id
                                      ? { ...s, isActive: checked }
                                      : s,
                                  );
                                  setServices(updated);
                                  updateService({
                                    ...service,
                                    isActive: checked,
                                  });
                                }}
                              />
                              <Label>
                                {service.isActive ? "Active" : "Inactive"}
                              </Label>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Report New Incident
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newIncident.title}
                    onChange={(e) =>
                      setNewIncident({ ...newIncident, title: e.target.value })
                    }
                    placeholder="Database Connection Issues"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newIncident.description}
                    onChange={(e) =>
                      setNewIncident({
                        ...newIncident,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the incident..."
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newIncident.status}
                      onValueChange={(value) =>
                        setNewIncident({ ...newIncident, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INVESTIGATING">
                          🔍 Investigating
                        </SelectItem>
                        <SelectItem value="IDENTIFIED">
                          🎯 Identified
                        </SelectItem>
                        <SelectItem value="MONITORING">
                          👁️ Monitoring
                        </SelectItem>
                        <SelectItem value="RESOLVED">✅ Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={newIncident.severity}
                      onValueChange={(value) =>
                        setNewIncident({ ...newIncident, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MINOR">Minor</SelectItem>
                        <SelectItem value="MAJOR">Major</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {services.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Affected Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {services.map((service) => {
                        const selected = newIncident.affectedServices.includes(
                          service.id,
                        );
                        return (
                          <Button
                            key={service.id}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => {
                              setNewIncident((prev) => ({
                                ...prev,
                                affectedServices: selected
                                  ? prev.affectedServices.filter(
                                      (id) => id !== service.id,
                                    )
                                  : [...prev.affectedServices, service.id],
                              }));
                            }}
                          >
                            {service.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              <Button onClick={addIncident} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Incident
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active & Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents..."
                    value={incidentSearch}
                    onChange={(e) => setIncidentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={incidentFilter}
                  onValueChange={(value) =>
                    setIncidentFilter(value as "ALL" | "OPEN" | "RESOLVED")
                  }
                >
                  <SelectTrigger className="md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All incidents</SelectItem>
                    <SelectItem value="OPEN">Open incidents</SelectItem>
                    <SelectItem value="RESOLVED">Resolved incidents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {incidents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No incidents reported
                </p>
              ) : filteredIncidents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No incidents match your filters.
                </p>
              ) : (
                filteredIncidents.map((incident) => (
                  <Card key={incident.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{incident.title}</h3>
                            <Badge
                              variant={
                                incident.status === "RESOLVED"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {incident.status}
                            </Badge>
                            <Badge variant="outline">{incident.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {incident.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Started:{" "}
                            {new Date(incident.startedAt).toLocaleString()}
                            {incident.affectedServices.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {incident.affectedServices.map((serviceId) => (
                                  <Badge key={serviceId} variant="outline">
                                    {serviceNameById.get(serviceId) ||
                                      "Unknown service"}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                            {incident.resolvedAt &&
                              ` • Resolved: ${new Date(incident.resolvedAt).toLocaleString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={incident.status}
                            onValueChange={(value) => {
                              updateIncident({ ...incident, status: value });
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INVESTIGATING">
                                Investigating
                              </SelectItem>
                              <SelectItem value="IDENTIFIED">
                                Identified
                              </SelectItem>
                              <SelectItem value="MONITORING">
                                Monitoring
                              </SelectItem>
                              <SelectItem value="RESOLVED">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteIncident(incident.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Schedule Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newMaintenance.title}
                    onChange={(e) =>
                      setNewMaintenance({
                        ...newMaintenance,
                        title: e.target.value,
                      })
                    }
                    placeholder="Database Upgrade"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newMaintenance.description}
                    onChange={(e) =>
                      setNewMaintenance({
                        ...newMaintenance,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the maintenance..."
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scheduled Start</Label>
                    <Input
                      type="datetime-local"
                      value={newMaintenance.scheduledStart}
                      onChange={(e) =>
                        setNewMaintenance({
                          ...newMaintenance,
                          scheduledStart: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scheduled End</Label>
                    <Input
                      type="datetime-local"
                      value={newMaintenance.scheduledEnd}
                      onChange={(e) =>
                        setNewMaintenance({
                          ...newMaintenance,
                          scheduledEnd: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {services.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Affected Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {services.map((service) => {
                        const selected =
                          newMaintenance.affectedServices.includes(service.id);
                        return (
                          <Button
                            key={service.id}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => {
                              setNewMaintenance((prev) => ({
                                ...prev,
                                affectedServices: selected
                                  ? prev.affectedServices.filter(
                                      (id) => id !== service.id,
                                    )
                                  : [...prev.affectedServices, service.id],
                              }));
                            }}
                          >
                            {service.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              <Button onClick={addMaintenance} className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Maintenance
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled & Past Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={maintenanceFilter}
                onValueChange={(value) =>
                  setMaintenanceFilter(
                    value as
                      | "ALL"
                      | "SCHEDULED"
                      | "IN_PROGRESS"
                      | "COMPLETED"
                      | "CANCELLED",
                  )
                }
              >
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All maintenance</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {maintenance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No maintenance scheduled
                </p>
              ) : filteredMaintenance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No maintenance windows match this filter.
                </p>
              ) : (
                filteredMaintenance.map((maint) => (
                  <Card key={maint.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            <h3 className="font-semibold">{maint.title}</h3>
                            <Badge>{maint.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {maint.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(maint.scheduledStart).toLocaleString()} →{" "}
                            {new Date(maint.scheduledEnd).toLocaleString()}
                            {maint.affectedServices.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {maint.affectedServices.map((serviceId) => (
                                  <Badge key={serviceId} variant="outline">
                                    {serviceNameById.get(serviceId) ||
                                      "Unknown service"}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={maint.status}
                            onValueChange={(value) => {
                              updateMaintenance({ ...maint, status: value });
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SCHEDULED">
                                Scheduled
                              </SelectItem>
                              <SelectItem value="IN_PROGRESS">
                                In Progress
                              </SelectItem>
                              <SelectItem value="COMPLETED">
                                Completed
                              </SelectItem>
                              <SelectItem value="CANCELLED">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteMaintenance(maint.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}

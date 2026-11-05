"use client";

import { useState, useEffect } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Clock,
  Users,
  Video,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Trash2,
  Edit3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StudentAttendee {
  id: string;
  registeredAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface LiveEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  attendees: number;
  maxAttendees: number;
  status: "upcoming" | "completed";
  category: "qa" | "workshop" | "webinar" | "office-hours";
  description: string;
  streamUrl: string;
  registrations?: StudentAttendee[];
}

export default function SchedulePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal State - Create / Edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formInstructor, setFormInstructor] = useState("");
  const [formCategory, setFormCategory] = useState<"qa" | "workshop" | "webinar" | "office-hours">("qa");
  const [formMaxAttendees, setFormMaxAttendees] = useState("100");
  const [formStreamUrl, setFormStreamUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Selected Event Details
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/schedule");
      if (res.ok) {
        const raw = await res.json();
        const mapped: LiveEvent[] = raw.map((item: {
          id: string;
          title: string;
          description?: string | null;
          scheduledAt: string;
          category?: "qa" | "workshop" | "webinar" | "office-hours";
          status?: "upcoming" | "completed";
          maxAttendees?: number;
          streamUrl?: string | null;
          instructor?: { name?: string | null };
          registrations?: StudentAttendee[];
        }) => {
          const dateObj = new Date(item.scheduledAt);
          return {
            id: item.id,
            title: item.title,
            date: dateObj.toISOString().slice(0, 10),
            time: dateObj.toISOString().slice(11, 16),
            instructor: item.instructor?.name || "Instructor",
            attendees: item.registrations?.length || 0,
            maxAttendees: item.maxAttendees || 100,
            status: item.status || "upcoming",
            category: item.category || "workshop",
            description: item.description || "",
            streamUrl: item.streamUrl || "",
            registrations: item.registrations || [],
          };
        });
        setEvents(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const resetForm = () => {
    setFormTitle("");
    setFormDate("");
    setFormTime("");
    setFormInstructor("");
    setFormCategory("qa");
    setFormMaxAttendees("100");
    setFormStreamUrl("");
    setFormDescription("");
    setEditingEvent(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: LiveEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDate(event.date);
    setFormTime(event.time);
    setFormInstructor(event.instructor);
    setFormCategory(event.category);
    setFormMaxAttendees(event.maxAttendees.toString());
    setFormStreamUrl(event.streamUrl);
    setFormDescription(event.description);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle || !formDate || !formTime || !formStreamUrl) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const scheduledAt = new Date(`${formDate}T${formTime}:00Z`).toISOString();

      if (editingEvent) {
        const res = await fetch(`/api/admin/schedule/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            scheduledAt,
            category: formCategory,
            maxAttendees: Number(formMaxAttendees) || 100,
            description: formDescription,
            streamUrl: formStreamUrl,
          }),
        });

        if (!res.ok) throw new Error("Failed to update session");
        toast.success("Event updated successfully!");
      } else {
        const res = await fetch("/api/admin/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            scheduledAt,
            category: formCategory,
            maxAttendees: Number(formMaxAttendees) || 100,
            description: formDescription,
            streamUrl: formStreamUrl,
          }),
        });

        if (!res.ok) throw new Error("Failed to schedule session");
        toast.success("New live session scheduled! 🚀");
      }

      await fetchSchedule();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Could not save schedule item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to cancel and delete this event?")) {
      try {
        const res = await fetch(`/api/admin/schedule/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete");
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
        toast.success("Event cancelled and removed.");
        if (selectedEvent?.id === id) {
          setSelectedEvent(null);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete event.");
      }
    }
  };

  const handleToggleStatus = async (event: LiveEvent) => {
    const nextStatus = event.status === "upcoming" ? "completed" : "upcoming";
    try {
      const res = await fetch(`/api/admin/schedule/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setEvents((prev) =>
        prev.map((ev) => (ev.id === event.id ? { ...ev, status: nextStatus } : ev))
      );
      toast.success(`Event status marked as ${nextStatus}.`);
      if (selectedEvent?.id === event.id) {
        setSelectedEvent((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "qa":
        return "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-500 border border-sky-500/20";
      case "workshop":
        return "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500 border border-emerald-500/20";
      case "webinar":
        return "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-500 border border-purple-500/20";
      case "office-hours":
        return "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500 border border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "qa":
        return "Live Q&A";
      case "workshop":
        return "Interactive Workshop";
      case "webinar":
        return "Webinar";
      case "office-hours":
        return "Office Hours";
      default:
        return category;
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Live Class & Webinar Schedule"
        description="Organize, host, and broadcast live code sessions, instructor Q&A events, and technical workshops."
        actions={
          <Button
            onClick={openCreateDialog}
            className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-extrabold text-xs px-5 py-2.5 shadow-md shadow-[#ff6636]/20 gap-2 uppercase tracking-wider"
          >
            <Plus className="size-4" /> Schedule Session
          </Button>
        }
      />

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search sessions, topics, instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 rounded-xl text-xs bg-background"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            <Filter className="size-3.5" /> Filter:
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val: "all" | "upcoming" | "completed") => setStatusFilter(val)}
          >
            <SelectTrigger className="h-9 w-32 rounded-xl border-border bg-background text-[11px] font-semibold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs font-semibold">All Statuses</SelectItem>
              <SelectItem value="upcoming" className="text-xs font-semibold">Upcoming</SelectItem>
              <SelectItem value="completed" className="text-xs font-semibold">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border bg-background text-[11px] font-semibold">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs font-semibold">All Categories</SelectItem>
              <SelectItem value="qa" className="text-xs font-semibold">Q&A Sessions</SelectItem>
              <SelectItem value="workshop" className="text-xs font-semibold">Workshops</SelectItem>
              <SelectItem value="webinar" className="text-xs font-semibold">Webinars</SelectItem>
              <SelectItem value="office-hours" className="text-xs font-semibold">Office Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Events list */}
        <div className={cn("space-y-4", selectedEvent ? "lg:col-span-2" : "lg:col-span-3")}>
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground font-semibold">
              Loading scheduled sessions from database...
            </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card
                key={event.id}
                className={cn(
                  "rounded-2xl border transition-all hover:shadow-md cursor-pointer overflow-hidden",
                  selectedEvent?.id === event.id
                    ? "border-[#ff6636] bg-[#ff6636]/5"
                    : "border-border/50 bg-card"
                )}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Calendar visual widget */}
                    <div className="flex flex-col items-center justify-center size-14 shrink-0 rounded-2xl border border-border/80 bg-muted/50 p-2 text-center">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-black text-foreground leading-none mt-0.5">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", getCategoryBadgeClass(event.category))}>
                          {getCategoryLabel(event.category)}
                        </span>
                        
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                          event.status === "upcoming"
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {event.status}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold tracking-tight text-foreground leading-tight">
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="size-3.5 text-[#ff6636]" />
                          Instructor: {event.instructor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {event.time} (UTC)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-4 border-t border-border/40 md:pt-0 md:border-t-0 shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                      <Users className="size-3.5 text-muted-foreground/60" />
                      <span>{event.attendees} / {event.maxAttendees}</span>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground/55 hidden md:block" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center">
              <AlertCircle className="size-8 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">No Scheduled Events</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                We couldn&apos;t find any live events matching your filters. Schedule a new live programming event above.
              </p>
            </div>
          )}
        </div>

        {/* Selected Event Details Panel */}
        {selectedEvent && (
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border border-[#ff6636]/30 bg-card shadow-lg sticky top-6 overflow-hidden">
              <div className="bg-[#ff6636]/5 p-5 border-b border-border/50 flex items-start justify-between">
                <div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest", getCategoryBadgeClass(selectedEvent.category))}>
                    {getCategoryLabel(selectedEvent.category)}
                  </span>
                  <h3 className="font-extrabold text-base text-foreground mt-2 leading-tight">
                    {selectedEvent.title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="p-5 space-y-5">
                <div className="text-xs text-muted-foreground space-y-2">
                  <p className="leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>

                {/* Broadcast Link */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Video className="size-3.5 text-[#ff6636]" /> Broadcast Stream URL
                  </span>
                  <a
                    href={selectedEvent.streamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#ff6636] hover:underline break-all block"
                  >
                    {selectedEvent.streamUrl}
                  </a>
                </div>

                {/* Roster of Registered Students */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/30 pb-1">
                    <span>REGISTERED STUDENTS ({selectedEvent.attendees})</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(selectedEvent.registrations || []).length > 0 ? (
                      selectedEvent.registrations?.map((reg) => (
                        <div key={reg.id} className="flex items-center justify-between p-2 rounded-xl border border-border/40 hover:bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6 border">
                              <AvatarFallback className="bg-muted text-[8px] font-black">
                                {reg.user.name?.split(" ").map((n) => n[0]).join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-[10px]">
                              <p className="font-bold text-foreground leading-tight">{reg.user.name}</p>
                              <p className="text-muted-foreground leading-none mt-0.5">{reg.user.email}</p>
                            </div>
                          </div>
                          <span className="text-[8px] font-extrabold uppercase text-muted-foreground/60">
                            {new Date(reg.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-2">
                        No students have registered yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Control actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-10 text-xs font-bold gap-1.5"
                      onClick={() => openEditDialog(selectedEvent)}
                    >
                      <Edit3 className="size-4" /> Edit Event
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 px-3 border-red-500/20"
                      onClick={() => handleDelete(selectedEvent.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleToggleStatus(selectedEvent)}
                    className={cn(
                      "w-full rounded-xl h-10 text-xs font-bold gap-1.5",
                      selectedEvent.status === "upcoming"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <CheckCircle className="size-4" />
                    <span>
                      {selectedEvent.status === "upcoming"
                        ? "Mark as Completed"
                        : "Mark as Upcoming"}
                    </span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Schedule / Edit Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingEvent ? "Edit Live Session" : "Schedule Live Class / Workshop"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure session details, YouTube live / Meet stream link, and seat limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Session Title <span className="text-[#ff6636]">*</span>
              </label>
              <Input
                placeholder="e.g. Next.js 16 Deep Dive Workshop"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-10 rounded-xl border-border text-xs font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Session Type <span className="text-[#ff6636]">*</span>
                </label>
                <Select
                  value={formCategory}
                  onValueChange={(val: "qa" | "workshop" | "webinar" | "office-hours") =>
                    setFormCategory(val)
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl border-border text-xs font-semibold">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="qa" className="text-xs font-semibold">Q&A Session</SelectItem>
                    <SelectItem value="workshop" className="text-xs font-semibold">Workshop</SelectItem>
                    <SelectItem value="webinar" className="text-xs font-semibold">Webinar</SelectItem>
                    <SelectItem value="office-hours" className="text-xs font-semibold">Office Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Capacity (Max Seats)
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formMaxAttendees}
                  onChange={(e) => setFormMaxAttendees(e.target.value)}
                  className="h-10 rounded-xl border-border text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Date <span className="text-[#ff6636]">*</span>
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-10 rounded-xl border-border text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Time (UTC) <span className="text-[#ff6636]">*</span>
                </label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="h-10 rounded-xl border-border text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Stream / Room URL <span className="text-[#ff6636]">*</span>
              </label>
              <Input
                placeholder="https://youtube.com/live/... or https://meet.google.com/..."
                value={formStreamUrl}
                onChange={(e) => setFormStreamUrl(e.target.value)}
                className="h-10 rounded-xl border-border text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Overview & Agenda
              </label>
              <Textarea
                placeholder="What topics will be covered? What should attendees prepare in advance?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="rounded-xl border-border text-xs font-medium"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs"
              >
                {isSaving ? "Saving..." : editingEvent ? "Update Session" : "Schedule Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

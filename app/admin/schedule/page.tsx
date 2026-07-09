"use client";

import { useState } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Calendar,
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
}

const mockAttendees = [
  { name: "Alice Vance", email: "alice@devforge.com", registeredAt: "2026-01-02" },
  { name: "Bob Carter", email: "bob@devforge.com", registeredAt: "2026-01-03" },
  { name: "Charlie Davis", email: "charlie@devforge.com", registeredAt: "2026-01-04" },
  { name: "Diana Prince", email: "diana@devforge.com", registeredAt: "2026-01-05" },
  { name: "Ethan Hunt", email: "ethan@devforge.com", registeredAt: "2026-01-05" },
];

export default function SchedulePage() {
  // Initial list of events
  const [events, setEvents] = useState<LiveEvent[]>([
    {
      id: "ev-1",
      title: "Live Q&A Session: React Best Practices",
      date: "2026-08-15",
      time: "14:00",
      instructor: "John Doe",
      attendees: 45,
      maxAttendees: 100,
      status: "upcoming",
      category: "qa",
      description: "Ask anything about Server Components, state management, hooks optimization, and layout performance in React 19.",
      streamUrl: "https://youtube.com/live/react-best-practices",
    },
    {
      id: "ev-2",
      title: "Workshop: Advanced CSS Techniques",
      date: "2026-08-18",
      time: "16:00",
      instructor: "Jane Smith",
      attendees: 32,
      maxAttendees: 50,
      status: "upcoming",
      category: "workshop",
      description: "Hands-on deep dive into CSS Container Queries, CSS Grid layouts, advanced animation strategies, and modern variables.",
      streamUrl: "https://zoom.us/j/css-workshop-998",
    },
    {
      id: "ev-3",
      title: "Webinar: Career in Tech - Getting Hired",
      date: "2026-01-12",
      time: "10:00",
      instructor: "Mike Johnson",
      attendees: 78,
      maxAttendees: 150,
      status: "completed",
      category: "webinar",
      description: "How to build an engineering portfolio, optimize your resume for systems, and pass system design challenges.",
      streamUrl: "https://youtube.com/live/tech-career-hired",
    },
    {
      id: "ev-4",
      title: "Office Hours: C# & Backend Solutions",
      date: "2026-08-20",
      time: "11:00",
      instructor: "David Miller",
      attendees: 8,
      maxAttendees: 20,
      status: "upcoming",
      category: "office-hours",
      description: "Drop in to get code help, API feedback, database structure analysis, or architecture reviews from our instructors.",
      streamUrl: "https://meet.google.com/csharp-office-hours",
    },
  ]);

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

  // Drawer / View Details State
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle || !formDate || !formTime || !formInstructor || !formStreamUrl) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const eventData: LiveEvent = {
      id: editingEvent ? editingEvent.id : `ev-${Date.now()}`,
      title: formTitle,
      date: formDate,
      time: formTime,
      instructor: formInstructor,
      attendees: editingEvent ? editingEvent.attendees : 0,
      maxAttendees: Number(formMaxAttendees) || 100,
      status: editingEvent ? editingEvent.status : "upcoming",
      category: formCategory,
      description: formDescription,
      streamUrl: formStreamUrl,
    };

    if (editingEvent) {
      setEvents((prev) => prev.map((ev) => (ev.id === editingEvent.id ? eventData : ev)));
      toast.success("Event updated successfully!");
    } else {
      setEvents((prev) => [eventData, ...prev]);
      toast.success("New live event scheduled!");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to cancel and delete this event?")) {
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      toast.success("Event cancelled and removed.");
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
      }
    }
  };

  const handleToggleStatus = (event: LiveEvent) => {
    const nextStatus = event.status === "upcoming" ? "completed" : "upcoming";
    setEvents((prev) =>
      prev.map((ev) => (ev.id === event.id ? { ...ev, status: nextStatus } : ev))
    );
    toast.success(`Event status updated to ${nextStatus}.`);
    if (selectedEvent?.id === event.id) {
      setSelectedEvent((prev) => prev ? { ...prev, status: nextStatus } : null);
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
        return "Q&A Session";
      case "workshop":
        return "Interactive Workshop";
      case "webinar":
        return "Live Webinar";
      case "office-hours":
        return "Office Hours";
      default:
        return category;
    }
  };

  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Live Programming & Broadcasts"
        title="Schedule Manager"
        description="Plan, organize, and manage live programming, workshops, office hours, and guest broadcasts for learners."
        actions={
          <button
            onClick={openCreateDialog}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors h-10 shadow-md shadow-[#ff6636]/10"
          >
            <Plus className="size-4" />
            Schedule Event
          </button>
        }
      />

      {/* Filter and Search Bar controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm mb-6 mt-6">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by title, instructor, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:border-border/80"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            <Filter className="size-3.5" /> Filter:
          </div>

          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
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

      {/* Main Grid: Content and Detailed Panel side-by-side if selected */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        
        {/* Events list */}
        <div className={cn("space-y-4", selectedEvent ? "lg:col-span-2" : "lg:col-span-3")}>
          {filteredEvents.length > 0 ? (
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
                We couldn't find any live events matching your filters. Schedule a new live programming event above.
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
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", getCategoryBadgeClass(selectedEvent.category))}>
                    {getCategoryLabel(selectedEvent.category)}
                  </span>
                  <CardTitle className="text-base font-extrabold mt-2 leading-tight">
                    Event Details
                  </CardTitle>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-foreground">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    {selectedEvent.description || "No session description provided."}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/30 pb-2">
                    <span>TIMING & LOCATION</span>
                  </div>
                  <div className="grid gap-2 text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-[#ff6636]" />
                      <span>{formatEventDate(selectedEvent.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-[#ff6636]" />
                      <span>{selectedEvent.time} UTC</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Video className="size-4 text-[#ff6636]" />
                      <a
                        href={selectedEvent.streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#ff6636] hover:underline truncate"
                      >
                        {selectedEvent.streamUrl}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Attendee Statistics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/30 pb-1">
                    <span>ATTENDEE CAPACITY ({selectedEvent.attendees} / {selectedEvent.maxAttendees})</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[#ff6636] rounded-full transition-all"
                      style={{ width: `${(selectedEvent.attendees / selectedEvent.maxAttendees) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Roster of Registered Students */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/30 pb-1">
                    <span>RECENT REGISTERED STUDENTS</span>
                  </div>
                  <div className="space-y-2">
                    {mockAttendees.map((student) => (
                      <div key={student.email} className="flex items-center justify-between p-2 rounded-xl border border-border/40 hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 border">
                            <AvatarFallback className="bg-muted text-[8px] font-black">
                              {student.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-[10px]">
                            <p className="font-bold text-foreground leading-tight">{student.name}</p>
                            <p className="text-muted-foreground leading-none mt-0.5">{student.email}</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold uppercase text-muted-foreground/60">{student.registeredAt}</span>
                      </div>
                    ))}
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
                      variant="destructive"
                      className="rounded-xl h-10 text-xs font-bold gap-1.5 px-3"
                      onClick={() => handleDelete(selectedEvent.id)}
                    >
                      <Trash2 className="size-4" /> Cancel
                    </Button>
                  </div>
                  <Button
                    className={cn(
                      "w-full rounded-xl h-10 text-xs font-bold gap-1.5",
                      selectedEvent.status === "completed" && "bg-muted text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => handleToggleStatus(selectedEvent)}
                  >
                    <CheckCircle className="size-4" />
                    Mark as {selectedEvent.status === "upcoming" ? "Completed" : "Upcoming"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* dialog modal for Event Scheduling & Editing */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">
              {editingEvent ? "Edit Live Event" : "Schedule Live Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Coordinate and broadcast live office hours, guest workshops, and Q&A webinars for programmers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Session Title <span className="text-[#ff6636]">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Masterclass: Advanced Web Assembly"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Session Type <span className="text-[#ff6636]">*</span>
                </label>
                <Select
                  value={formCategory}
                  onValueChange={(val: any) => setFormCategory(val)}
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

              {/* Instructor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Instructor Name <span className="text-[#ff6636]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formInstructor}
                  onChange={(e) => setFormInstructor(e.target.value)}
                  required
                  className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Date <span className="text-[#ff6636]">*</span>
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="h-10 rounded-xl border-border text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Time (UTC) <span className="text-[#ff6636]">*</span>
                </label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                  className="h-10 rounded-xl border-border text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Max Attendees */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Attendee Capacity
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formMaxAttendees}
                  onChange={(e) => setFormMaxAttendees(e.target.value)}
                  className="h-10 rounded-xl border-border text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>

              {/* Stream URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Stream Link <span className="text-[#ff6636]">*</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={formStreamUrl}
                  onChange={(e) => setFormStreamUrl(e.target.value)}
                  required
                  className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Description / Syllabus
              </label>
              <Textarea
                placeholder="Give learners brief details on what topics will be covered or what prerequisites are expected..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="min-h-20 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-10 text-xs font-bold"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-10 text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white"
              >
                {editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

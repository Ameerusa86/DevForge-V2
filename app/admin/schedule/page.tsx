"use client";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SchedulePage() {
  const events = [
    {
      id: 1,
      title: "Live Q&A Session: React Best Practices",
      date: "2026-01-15",
      time: "14:00",
      instructor: "John Doe",
      attendees: 45,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Workshop: Advanced CSS Techniques",
      date: "2026-01-18",
      time: "16:00",
      instructor: "Jane Smith",
      attendees: 32,
      status: "upcoming",
    },
    {
      id: 3,
      title: "Webinar: Career in Tech",
      date: "2026-01-12",
      time: "10:00",
      instructor: "Mike Johnson",
      attendees: 78,
      status: "completed",
    },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Live programming"
        title="Schedule"
        description="Coordinate workshops, office hours, webinars, and live sessions for learners and instructors."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        }
      />

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Instructor: {event.instructor}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    event.status === "upcoming" ? "default" : "secondary"
                  }
                >
                  {event.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Date:</span> {event.date}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {event.time}
                  </div>
                  <div>
                    <span className="font-medium">Attendees:</span>{" "}
                    {event.attendees}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {event.status === "upcoming" && (
                    <Button size="sm">Edit</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPage>
  );
}

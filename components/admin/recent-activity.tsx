"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Users, BookOpen, GraduationCap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "user" | "course" | "enrollment";

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: ActivityType;
}

const FILTERS: {
  label: string;
  value: "all" | ActivityType;
  icon?: React.ElementType;
}[] = [
  { label: "All Logs", value: "all" },
  { label: "Users", value: "user", icon: Users },
  { label: "Courses", value: "course", icon: BookOpen },
  { label: "Enrollments", value: "enrollment", icon: GraduationCap },
];

function getActivityColor(type: ActivityType) {
  switch (type) {
    case "user":
      return "bg-blue-500 ring-4 ring-blue-500/10";
    case "course":
      return "bg-emerald-500 ring-4 ring-emerald-500/10";
    case "enrollment":
      return "bg-purple-500 ring-4 ring-purple-500/10";
    default:
      return "bg-muted";
  }
}

function SkeletonItem() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="relative mt-2">
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
      </div>
      <div className="flex-1 rounded-2xl border border-border/50 bg-background/50 px-4 py-4">
        <div className="flex justify-between gap-3">
          <div className="h-3.5 w-36 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="mt-3 h-3 w-56 rounded bg-muted" />
      </div>
    </div>
  );
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | ActivityType>("all");

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/activity");
      if (res.ok) {
        const data: Activity[] = await res.json();
        setActivities(data);
      } else {
        // Fallback mock items
        setActivities([
          {
            id: "act-1",
            title: "New Student Enrollment",
            description: "Sarah Johnson enrolled in 'Interactive Blueprint: React & Next.js'",
            time: "2m ago",
            type: "enrollment",
          },
          {
            id: "act-2",
            title: "Course Status Updated",
            description: "Advanced C# & ASP.NET Core was updated and published to catalog.",
            time: "15m ago",
            type: "course",
          },
          {
            id: "act-3",
            title: "New User Registered",
            description: "Alice Vance signed up with GitHub provider credentials.",
            time: "1h ago",
            type: "user",
          },
        ]);
      }
    } catch {
      // fallback mock items
      setActivities([
        {
          id: "act-1",
          title: "New Student Enrollment",
          description: "Sarah Johnson enrolled in 'Interactive Blueprint: React & Next.js'",
          time: "2m ago",
          type: "enrollment",
        },
        {
          id: "act-2",
          title: "Course Status Updated",
          description: "Advanced C# & ASP.NET Core was updated and published to catalog.",
          time: "15m ago",
          type: "course",
        },
        {
          id: "act-3",
          title: "New User Registered",
          description: "Alice Vance signed up with GitHub provider credentials.",
          time: "1h ago",
          type: "user",
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const visible =
    filter === "all" ? activities : activities.filter((a) => a.type === filter);

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-[565px]">
      <CardHeader className="border-b border-border/50 px-6 py-5 flex flex-row items-center justify-between shrink-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
            <Clock className="size-4.5 text-[#ff6636]" />
            Recent Activity Logs
          </CardTitle>
          <p className="text-[10px] font-semibold text-muted-foreground">
            Live updates across users and platform content.
          </p>
        </div>
        
        <button
          onClick={() => fetchActivities(true)}
          disabled={refreshing}
          className="flex size-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-60 transition-all"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
        </button>
      </CardHeader>

      {/* Filters (Swapped with custom styled filter tags) */}
      <div className="flex flex-wrap gap-1.5 px-6 pt-4 shrink-0 overflow-x-auto">
        {FILTERS.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider transition-all border",
              filter === value
                ? "bg-[#ff6636] border-[#ff6636] text-white"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <CardContent className="flex-1 p-6 overflow-hidden">
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)
          ) : visible.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
              No recent logs registered.
            </div>
          ) : (
            visible.map((activity, idx) => (
              <div key={activity.id} className="flex gap-3">
                <div className="relative flex flex-col items-center shrink-0 mt-1">
                  <div
                    className={cn("size-2.5 rounded-full z-10 shrink-0", getActivityColor(activity.type))}
                  />
                  {idx < visible.length - 1 && (
                    <div className="w-px flex-1 bg-border/50 my-1 min-h-[3.5rem]" />
                  )}
                </div>
                
                <div className="flex-1 rounded-2xl border border-border/40 bg-muted/20 p-4 shadow-sm relative group hover:border-[#ff6636]/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold text-foreground">
                      {activity.title}
                    </p>
                    <p className="shrink-0 text-[8px] font-black uppercase tracking-widest text-muted-foreground/80">
                      {activity.time}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed font-semibold">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

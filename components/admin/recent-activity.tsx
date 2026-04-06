"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, BookOpen, GraduationCap } from "lucide-react";
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
  { label: "All", value: "all" },
  { label: "Users", value: "user", icon: Users },
  { label: "Courses", value: "course", icon: BookOpen },
  { label: "Enrollments", value: "enrollment", icon: GraduationCap },
];

function getActivityColor(type: ActivityType) {
  switch (type) {
    case "user":
      return "bg-blue-500";
    case "course":
      return "bg-green-500";
    case "enrollment":
      return "bg-purple-500";
  }
}

function SkeletonItem() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="relative mt-2">
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
      </div>
      <div className="flex-1 rounded-[1.25rem] border border-border/60 bg-background/70 px-4 py-4">
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
      }
    } catch {
      // silently fail — stale data remains visible
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
    <Card className="admin-panel">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            Recent Activity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Live changes across content, users, and platform operations.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchActivities(true)}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>

      {/* Filter tabs */}
      <div className="flex gap-1 px-6 pt-4">
        {FILTERS.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
          </button>
        ))}
      </div>

      <CardContent className="px-6 py-6">
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity found.
            </p>
          ) : (
            visible.map((activity, idx) => (
              <div key={activity.id} className="flex gap-4">
                <div className="relative">
                  <div
                    className={`mt-2 h-2.5 w-2.5 rounded-full shadow-sm ${getActivityColor(activity.type)}`}
                  />
                  {idx < visible.length - 1 && (
                    <div className="absolute left-1/2 top-5 h-full w-px -translate-x-1/2 bg-border" />
                  )}
                </div>
                <div className="flex-1 rounded-[1.25rem] border border-border/60 bg-background/70 px-4 py-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {activity.title}
                    </p>
                    <p className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecentActivityProps {
  activities: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type: "user" | "course" | "system";
  }>;
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-500";
      case "course":
        return "bg-green-500";
      case "system":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="admin-panel">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Live changes across content, users, and platform operations.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View All</DropdownMenuItem>
            <DropdownMenuItem>Export</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <div className="relative">
                <div
                  className={`mt-2 h-2.5 w-2.5 rounded-full shadow-sm ${getActivityColor(
                    activity.type
                  )}`}
                />
                {activity.id !== activities[activities.length - 1].id && (
                  <div className="absolute left-1/2 top-5 h-full w-px -translate-x-1/2 bg-border" />
                )}
              </div>
              <div className="flex-1 rounded-[1.25rem] border border-border/60 bg-background/70 px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

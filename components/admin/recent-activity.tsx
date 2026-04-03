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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
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
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <div className="relative">
                <div
                  className={`w-2 h-2 rounded-full ${getActivityColor(
                    activity.type
                  )} mt-2`}
                />
                {activity.id !== activities[activities.length - 1].id && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-full bg-border" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

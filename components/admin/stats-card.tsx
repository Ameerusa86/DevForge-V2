import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("admin-metric-card gap-4", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/10">
          <Icon className="h-5 w-5" />
        </div>
        {trend ? (
          <Badge variant="outline" className="admin-metric-badge">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {trend.isPositive ? "+" : "-"}
            {trend.value}%
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
          {value}
        </div>
        {(description || trend) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {description ? <p>{description}</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

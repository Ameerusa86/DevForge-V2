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
    <Card className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md", className)}>
      <div className="space-y-1.5 min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <h3 className="text-3xl font-extrabold text-foreground tracking-tight truncate">
          {value}
        </h3>
        {description && (
          <p className="text-[9px] font-semibold text-muted-foreground leading-none truncate mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
          <Icon className="size-5" />
        </div>
        {trend && (
          <Badge className="text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border-none">
            <ArrowUpRight className="size-2.5 mr-0.5" />
            {trend.isPositive ? "+" : "-"}
            {trend.value}%
          </Badge>
        )}
      </div>
    </Card>
  );
}

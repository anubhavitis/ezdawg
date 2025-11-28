import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
}: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div
          className={cn(
            "p-2.5 rounded-md",
            iconBgColor || "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              iconColor || "text-muted-foreground"
            )}
          />
        </div>
      </div>
    </Card>
  );
}

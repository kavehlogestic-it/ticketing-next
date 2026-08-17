import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface KpiStatItem {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  color: string;
  bg: string;
}

interface KpiStatCardProps {
  item: KpiStatItem;
}

export function KpiStatCard({ item }: KpiStatCardProps) {
  const Icon = item.icon;

  return (
    <Card className="shadow-2xs transition-all hover:border-primary/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {item.title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold font-mono ${item.color}`}>
          {item.value.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
      </CardContent>
    </Card>
  );
}

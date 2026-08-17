import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Welcome Banner Skeleton */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>
        </div>

        {/* KPI Cards Skeleton Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-3 w-32 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Tickets Section Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          <div className="rounded-xl border bg-card p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-12 rounded" />
                  <Skeleton className="h-5 w-48 sm:w-64 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

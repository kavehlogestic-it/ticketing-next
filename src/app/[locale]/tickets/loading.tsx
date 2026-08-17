import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-6 gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-36 rounded-md" />
              <Skeleton className="h-4 w-56 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Filters & Search Skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((tab) => (
              <Skeleton key={tab} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-5 w-44 sm:w-80 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-24 rounded hidden md:block" />
                <Skeleton className="h-4 w-20 rounded hidden lg:block" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

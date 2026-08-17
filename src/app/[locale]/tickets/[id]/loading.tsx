import { Skeleton } from "@/components/ui/skeleton";

export default function TicketDetailLoading() {
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-background">
      {/* Sticky Ticket Header Skeleton */}
      <header className="shrink-0 border-b bg-card px-4 py-3 sm:px-6 shadow-2xs z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-5 w-64 sm:w-96 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Main Workspace Body Skeleton */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Chat Conversation Thread Skeleton */}
        <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-background/50 p-4 sm:p-6 space-y-4">
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>

          {/* Chat bubble skeletons */}
          <div className="flex items-start gap-3 justify-end my-3">
            <div className="max-w-[70%] rounded-2xl p-4 bg-card border space-y-2 w-72">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          </div>

          <div className="flex items-start gap-3 justify-start my-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="max-w-[70%] rounded-2xl p-4 bg-card border space-y-2 w-80">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
          </div>

          {/* Composer Skeleton */}
          <div className="mt-auto border-t bg-card p-3 rounded-xl flex items-center gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          </div>
        </section>

        {/* Right Column: Desktop Info Panel Skeleton */}
        <aside className="hidden lg:flex w-80 lg:w-96 shrink-0 h-full border-s border-border bg-card p-5 flex-col space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="space-y-2.5">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

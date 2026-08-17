import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewTicketLoading() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-7 w-36 rounded-md" />

        <Card className="shadow-md border-border/80">
          <CardHeader className="space-y-2 pb-6 border-b">
            <Skeleton className="h-7 w-64 rounded-md" />
            <Skeleton className="h-4 w-96 rounded" />
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>

            <Skeleton className="h-10 w-40 rounded-lg" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

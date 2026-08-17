import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupsLoading() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>

        <Skeleton className="h-20 w-full rounded-xl" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((card) => (
            <Card key={card} className="shadow-2xs">
              <CardHeader className="border-b pb-4 space-y-2">
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                  >
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

import { Spinner } from "@/components/common/spinner";

export default function GlobalLoading() {
  return (
    <div className="flex flex-1 min-h-[60vh] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <Spinner className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          در حال بارگذاری اطلاعات...
        </p>
      </div>
    </div>
  );
}

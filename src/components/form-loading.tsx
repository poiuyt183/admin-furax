import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FormLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <Skeleton className="h-9 w-24" />

      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Đang tải dữ liệu...</span>
      </div>

      <div className="space-y-6 rounded-lg border p-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

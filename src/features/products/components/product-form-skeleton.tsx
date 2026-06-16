import { Card, CardContent, CardHeader } from "@/components/ui/card";

function FieldSkeleton({ className = "h-10" }: { className?: string }) {
  return <div className={`${className} rounded-md bg-muted animate-pulse`} />;
}

export function ProductFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-md bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton className="h-10 w-1/2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-5 w-20 rounded-md bg-muted animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-[860px] mx-auto rounded-2xl border border-gray-200 overflow-hidden">
                <div className="h-14 bg-muted/60 animate-pulse border-b" />
                <div className="min-h-[400px] p-8 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {(["status", "category", "primary", "gallery"] as const).map((id) => (
            <Card key={id}>
              <CardHeader>
                <div className="h-5 w-24 rounded-md bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <FieldSkeleton />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

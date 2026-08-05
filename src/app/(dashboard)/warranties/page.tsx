import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { WarrantyTable } from "@/features/warranties/components/warranty-table";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function WarrantiesPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    trpc.warranty.list.queryOptions({ status: "PENDING" }),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bảo hành</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Duyệt yêu cầu kích hoạt bảo hành từ khách hàng.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <WarrantyTable />
      </HydrationBoundary>
    </div>
  );
}

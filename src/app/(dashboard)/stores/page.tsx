import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { StoreTable } from "@/features/stores/components/store-table";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function StoresPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(trpc.store.list.queryOptions({}));

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cửa hàng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý vị trí showroom hiển thị trên trang tìm cửa hàng.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StoreTable />
      </HydrationBoundary>
    </div>
  );
}

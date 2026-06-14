import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductTable } from "@/features/products/components/product-table";
import { getQueryClient, trpc } from "@/trpc/server";

const DEFAULT_PRODUCT_LIST_INPUT = {
  search: undefined,
  status: undefined,
  categoryId: undefined,
};

export default async function ProductsPage() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(trpc.category.list.queryOptions()),
    queryClient.prefetchQuery(
      trpc.product.list.queryOptions(DEFAULT_PRODUCT_LIST_INPUT),
    ),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sản phẩm</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý danh mục thiết bị, giá cả và tình trạng.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductTable />
      </HydrationBoundary>
    </div>
  );
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { CategoryTable } from "@/features/categories/components/category-table";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function CategoriesPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(trpc.category.list.queryOptions());

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý các danh mục sản phẩm cho hệ thống thiết bị.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CategoryTable />
      </HydrationBoundary>
    </div>
  );
}

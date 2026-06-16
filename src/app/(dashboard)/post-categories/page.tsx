import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PostCategoryTable } from "@/features/post-categories/components/post-category-table";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function PostCategoriesPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(trpc.postCategory.list.queryOptions());

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danh mục bài viết</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Phân loại bài viết theo chủ đề và nội dung.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PostCategoryTable />
      </HydrationBoundary>
    </div>
  );
}

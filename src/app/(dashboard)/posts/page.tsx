import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PostTable } from "@/features/posts/components/post-table";
import { getQueryClient, trpc } from "@/trpc/server";

const DEFAULT_POST_LIST_INPUT = {
  search: undefined,
  status: undefined,
  categoryId: undefined,
};

export default async function PostsPage() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(trpc.postCategory.list.queryOptions()),
    queryClient.prefetchQuery(trpc.post.list.queryOptions(DEFAULT_POST_LIST_INPUT)),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bài viết</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý nội dung bài viết, trạng thái xuất bản và danh mục.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PostTable />
      </HydrationBoundary>
    </div>
  );
}

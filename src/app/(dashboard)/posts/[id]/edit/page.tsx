import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PostForm } from "@/features/posts/components/post-form";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(trpc.post.getById.queryOptions({ id })),
    queryClient.prefetchQuery(trpc.postCategory.list.queryOptions()),
  ]);

  return (
    <div className="py-4">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PostForm postId={id} />
      </HydrationBoundary>
    </div>
  );
}

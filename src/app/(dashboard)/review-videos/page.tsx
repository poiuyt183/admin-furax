import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ReviewVideoTable } from "@/features/review-videos/components/review-video-table";
import { getQueryClient, trpc } from "@/trpc/server";

export const metadata = {
  title: "Video Review",
};

export default async function ReviewVideosPage() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(trpc.category.list.queryOptions()),
    queryClient.prefetchQuery(trpc.reviewVideo.list.queryOptions({})),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Video Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý video review sản phẩm theo danh mục, hiển thị trên trang Video
          Review.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReviewVideoTable />
      </HydrationBoundary>
    </div>
  );
}

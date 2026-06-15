import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { HomepageEditor } from "@/features/pages/components/homepage-editor";

export const metadata = {
  title: "Quản lý trang chủ",
};

export default async function HomepageCMSPage() {
  const queryClient = getQueryClient();

  // Only prefetch the critical config — banner renders instantly.
  // Categories & products stream in progressively via Suspense on the client.
  await queryClient.prefetchQuery(trpc.homepage.get.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomepageEditor />
    </HydrationBoundary>
  );
}


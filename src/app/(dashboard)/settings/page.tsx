import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SettingsEditor } from "@/features/settings/components/settings-editor";
import { getQueryClient, trpc } from "@/trpc/server";

export const metadata = {
  title: "Cài đặt website",
};

export default async function SettingsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(trpc.settings.get.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsEditor />
    </HydrationBoundary>
  );
}

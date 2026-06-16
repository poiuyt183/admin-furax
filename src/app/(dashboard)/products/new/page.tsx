import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductForm } from "@/features/products/components/product-form";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function NewProductPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(trpc.category.list.queryOptions());

  return (
    <div className="py-4">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductForm />
      </HydrationBoundary>
    </div>
  );
}

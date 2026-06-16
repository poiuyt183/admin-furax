import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductForm } from "@/features/products/components/product-form";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(trpc.product.getById.queryOptions({ id })),
    queryClient.prefetchQuery(trpc.category.list.queryOptions()),
  ]);

  return (
    <div className="py-4">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductForm productId={id} />
      </HydrationBoundary>
    </div>
  );
}

import { ProductForm } from "@/features/products/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="py-4">
      <ProductForm productId={id} />
    </div>
  );
}

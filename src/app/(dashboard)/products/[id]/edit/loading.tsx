import { ProductFormSkeleton } from "@/features/products/components/product-form-skeleton";

export default function EditProductLoading() {
  return (
    <div className="py-4">
      <ProductFormSkeleton />
    </div>
  );
}

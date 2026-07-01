"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { startNavigationProgress } from "@/components/navigation-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import {
  type CreateProductInput,
  createProductSchema,
} from "../product.schema";
import { ImageUpload, MultiImageUpload } from "./image-upload";
import { ProductFormSkeleton } from "./product-form-skeleton";

const RichEditor = dynamic(() => import("@/components/editor/RichEditor"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[860px] mx-auto rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="h-14 bg-gray-50 border-b border-gray-200 animate-pulse" />
      <div className="min-h-[400px] p-8">
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    </div>
  ),
});

const PRODUCT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Bản nháp", indicatorClassName: "bg-yellow-500" },
  {
    value: "PUBLISHED",
    label: "Đã xuất bản",
    indicatorClassName: "bg-green-500",
  },
  { value: "ARCHIVED", label: "Đã lưu trữ", indicatorClassName: "bg-gray-400" },
] as const;

type ProductFormValues = z.input<typeof createProductSchema>;

const EMPTY_FORM_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  comparePrice: null,
  primaryImage: "",
  status: "DRAFT",
  categoryId: "",
  images: [],
  specs: [],
  brand: "",
  origin: "",
  sku: "",
  warranty: "",
};

function productToFormValues(product: {
  name: string;
  slug: string;
  description: string | null;
  price: string;
  comparePrice: string | null;
  primaryImage: string | null;
  status: ProductFormValues["status"];
  categoryId: string | null;
  images: Array<{ url: string; alt: string | null }>;
  specs: Array<{ label: string; value: string; group: string | null; position: number }>;
  brand: string | null;
  origin: string | null;
  sku: string | null;
  warranty: string | null;
}): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    primaryImage: product.primaryImage ?? "",
    status: product.status,
    categoryId: product.categoryId ?? "",
    images: product.images.map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
    })),
    specs: product.specs.map((spec) => ({
      label: spec.label,
      value: spec.value,
      group: spec.group ?? "",
      position: spec.position,
    })),
    brand: product.brand ?? "",
    origin: product.origin ?? "",
    sku: product.sku ?? "",
    warranty: product.warranty ?? "",
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatVND(value: number | string): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return "";
  return new Intl.NumberFormat("vi-VN").format(num);
}

interface ProductFormProps {
  productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!productId;

  const { data: product, isLoading: productLoading } = useQuery({
    ...trpc.product.getById.queryOptions({ id: productId ?? "" }),
    enabled: isEditing,
  });

  const { data: categories = [] } = useQuery(trpc.category.list.queryOptions());

  const categoryOptions = useMemo(() => {
    if (
      !product?.category ||
      categories.some((cat) => cat.id === product.category?.id)
    ) {
      return categories;
    }

    return [product.category, ...categories];
  }, [categories, product?.category]);

  const form = useForm<ProductFormValues, unknown, CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: EMPTY_FORM_VALUES,
    values: isEditing && product ? productToFormValues(product) : undefined,
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } =
    useFieldArray({
      control: form.control,
      name: "specs",
    });

  const watchName = form.watch("name");
  const watchPrice = Number(form.watch("price"));
  const watchComparePrice = Number(form.watch("comparePrice"));

  useEffect(() => {
    if (!isEditing && watchName) {
      form.setValue("slug", slugify(watchName));
    }
  }, [watchName, isEditing, form]);

  const createMutation = useMutation(
    trpc.product.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        });
        toast.success("Tạo sản phẩm thành công");
        startNavigationProgress();
        router.push("/products");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.product.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        });
        toast.success("Cập nhật sản phẩm thành công");
        startNavigationProgress();
        router.push("/products");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (data: CreateProductInput) => {
    if (isEditing && productId) {
      updateMutation.mutate({ id: productId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && productLoading && !product) {
    return <ProductFormSkeleton />;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm Mới"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Cập nhật thông tin chi tiết của sản phẩm dưới đây."
                : "Điền các thông tin để tạo sản phẩm mới."}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          <Save className="size-4" />
          {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left column — main details ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Thông tin chung */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="prod-name">Tên sản phẩm <span className="text-destructive">*</span></Label>
                <Input
                  id="prod-name"
                  placeholder="VD: Samsung French Door Refrigerator"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="prod-slug">Đường dẫn (Slug) <span className="text-destructive">*</span></Label>
                <Input
                  id="prod-slug"
                  placeholder="VD: samsung-french-door-refrigerator"
                  {...form.register("slug")}
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>

              {/* Brand + Origin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-brand">Thương hiệu</Label>
                  <Input
                    id="prod-brand"
                    placeholder="VD: Samsung, LG, Apple..."
                    {...form.register("brand")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-origin">Xuất xứ</Label>
                  <Input
                    id="prod-origin"
                    placeholder="VD: Hàn Quốc, Việt Nam..."
                    {...form.register("origin")}
                  />
                </div>
              </div>

              {/* SKU + Warranty */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-sku">Mã sản phẩm (SKU)</Label>
                  <Input
                    id="prod-sku"
                    placeholder="VD: SAM-RF-001"
                    {...form.register("sku")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-warranty">Bảo hành</Label>
                  <Input
                    id="prod-warranty"
                    placeholder="VD: 12 tháng, 2 năm..."
                    {...form.register("warranty")}
                  />
                </div>
              </div>

              {/* Price + Compare Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-price">Giá bán (VNĐ) <span className="text-destructive">*</span></Label>
                  <Input
                    id="prod-price"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="1000"
                    {...form.register("price")}
                  />
                  {form.formState.errors.price && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                  {watchPrice > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatVND(watchPrice)} ₫
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-compare-price">Giá gốc (VNĐ)</Label>
                  <Input
                    id="prod-compare-price"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="1000"
                    {...form.register("comparePrice")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {watchComparePrice > 0
                      ? `${formatVND(watchComparePrice)} ₫ — dùng để hiển thị giảm giá`
                      : "Để trống nếu không có giảm giá"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mô tả */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mô tả sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <RichEditor
                      value={field.value ?? ""}
                      placeholder="Viết mô tả chi tiết cho sản phẩm..."
                      onChange={(html) => field.onChange(html)}
                    />
                    {form.formState.errors.description && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Thông số kỹ thuật */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Thông số kỹ thuật</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Thêm các thông số như CPU, RAM, dung tích, kích thước...
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendSpec({ label: "", value: "", group: "", position: specFields.length })
                  }
                >
                  <Plus className="size-3.5" />
                  Thêm thông số
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {specFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl text-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Chưa có thông số nào.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      appendSpec({ label: "", value: "", group: "", position: 0 })
                    }
                  >
                    <Plus className="size-3.5" />
                    Thêm thông số đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1.5rem_1fr_1.5fr_1fr_1.5rem] gap-2 px-1">
                    <span />
                    <span className="text-xs font-medium text-muted-foreground">Nhóm (tùy chọn)</span>
                    <span className="text-xs font-medium text-muted-foreground">Tên thông số</span>
                    <span className="text-xs font-medium text-muted-foreground">Giá trị</span>
                    <span />
                  </div>

                  {specFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-[1.5rem_1fr_1.5fr_1fr_1.5rem] gap-2 items-start"
                    >
                      {/* Drag handle (visual only) */}
                      <div className="flex items-center justify-center h-9 text-muted-foreground/40 cursor-grab">
                        <GripVertical className="size-4" />
                      </div>

                      {/* Group */}
                      <div>
                        <Input
                          placeholder="VD: Hiệu năng"
                          {...form.register(`specs.${index}.group`)}
                        />
                      </div>

                      {/* Label */}
                      <div>
                        <Input
                          placeholder="VD: Bộ vi xử lý"
                          {...form.register(`specs.${index}.label`)}
                        />
                        {form.formState.errors.specs?.[index]?.label && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.specs[index].label?.message}
                          </p>
                        )}
                      </div>

                      {/* Value */}
                      <div>
                        <Input
                          placeholder="VD: Intel Core i7"
                          {...form.register(`specs.${index}.value`)}
                        />
                        {form.formState.errors.specs?.[index]?.value && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.specs[index].value?.message}
                          </p>
                        )}
                      </div>

                      {/* Remove */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeSpec(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() =>
                        appendSpec({
                          label: "",
                          value: "",
                          group: specFields[specFields.length - 1]?.group ?? "",
                          position: specFields.length,
                        })
                      }
                    >
                      <Plus className="size-3.5" />
                      Thêm hàng
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Right column — sidebar ─── */}
        <div className="space-y-6">
          {/* Trạng thái */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    key={field.value}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạng thái">
                        {
                          PRODUCT_STATUS_OPTIONS.find(
                            (option) => option.value === field.value,
                          )?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-2 rounded-full ${option.indicatorClassName}`}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </CardContent>
          </Card>

          {/* Danh mục */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field }) => {
                  const selectedCategory = categoryOptions.find(
                    (cat) => cat.id === field.value,
                  );

                  return (
                    <div className="space-y-2">
                      <Select
                        key={field.value}
                        value={field.value || "none"}
                        onValueChange={(val) =>
                          field.onChange(val === "none" ? "" : val)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn danh mục">
                            {selectedCategory?.name ?? "Không có danh mục"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Không có danh mục
                          </SelectItem>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.categoryId && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.categoryId.message}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
            </CardContent>
          </Card>

          {/* Ảnh chính */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ảnh chính</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="primaryImage"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange("")}
                    />
                    {form.formState.errors.primaryImage && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.primaryImage.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Ảnh sản phẩm */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ảnh sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="images"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <MultiImageUpload
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                    {form.formState.errors.images && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.images.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

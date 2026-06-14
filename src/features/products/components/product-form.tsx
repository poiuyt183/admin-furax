"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod/v4";
import RichEditor from "@/components/editor/RichEditor";
import { Button } from "@/components/ui/button";
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
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      primaryImage: "",
      status: "DRAFT",
      categoryId: "",
      images: [],
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        price: Number(product.price),
        primaryImage: product.primaryImage ?? "",
        status: product.status,
        categoryId: product.categoryId ?? "",
        images: product.images.map((img) => ({
          url: img.url,
          alt: img.alt ?? "",
        })),
      });
    }
  }, [product, form]);

  const watchName = form.watch("name");
  const watchPrice = Number(form.watch("price"));

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

  if (isEditing && productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Đang tải dữ liệu sản phẩm...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        {/* Left column — main details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prod-name">Tên sản phẩm</Label>
                <Input
                  id="prod-name"
                  placeholder="e.g. Samsung French Door Refrigerator"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prod-slug">Đường dẫn (Slug)</Label>
                <Input
                  id="prod-slug"
                  placeholder="e.g. samsung-french-door-refrigerator"
                  {...form.register("slug")}
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prod-price">Giá (VNĐ)</Label>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mô tả</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <RichEditor
                      initialContent={field.value ?? ""}
                      placeholder="Viết mô tả cho sản phẩm..."
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
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-6">
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Search } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { ImageUpload } from "@/features/products/components/image-upload";
import { type CreatePostInput, createPostSchema } from "../post.schema";
import { PostFormSkeleton } from "./post-form-skeleton";
import { SeoScoreModal } from "./seo-score-modal";

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

const POST_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Bản nháp", indicatorClassName: "bg-yellow-500" },
  {
    value: "PUBLISHED",
    label: "Đã xuất bản",
    indicatorClassName: "bg-green-500",
  },
  { value: "ARCHIVED", label: "Đã lưu trữ", indicatorClassName: "bg-gray-400" },
] as const;

type PostFormValues = z.input<typeof createPostSchema>;

const EMPTY_FORM_VALUES: PostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  metaTitle: "",
  metaDescription: "",
  status: "DRAFT",
  categoryId: "",
};

function postToFormValues(post: {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  coverImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: PostFormValues["status"];
  categoryId: string | null;
}): PostFormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content ?? "",
    coverImage: post.coverImage ?? "",
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    status: post.status,
    categoryId: post.categoryId ?? "",
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

interface PostFormProps {
  postId?: string;
}

export function PostForm({ postId }: PostFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!postId;
  const [seoModalOpen, setSeoModalOpen] = useState(false);

  const { data: post, isLoading: postLoading } = useQuery({
    ...trpc.post.getById.queryOptions({ id: postId ?? "" }),
    enabled: isEditing,
  });

  const { data: categories = [] } = useQuery(
    trpc.postCategory.list.queryOptions(),
  );

  const categoryOptions = useMemo(() => {
    if (
      !post?.category ||
      categories.some((cat) => cat.id === post.category?.id)
    ) {
      return categories;
    }
    return [post.category, ...categories];
  }, [categories, post?.category]);

  const form = useForm<PostFormValues, unknown, CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: EMPTY_FORM_VALUES,
    values: isEditing && post ? postToFormValues(post) : undefined,
  });

  const watchTitle = form.watch("title");

  useEffect(() => {
    if (!isEditing && watchTitle) {
      form.setValue("slug", slugify(watchTitle));
    }
  }, [watchTitle, isEditing, form]);

  const createMutation = useMutation(
    trpc.post.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.post.list.queryKey(),
        });
        toast.success("Tạo bài viết thành công");
        startNavigationProgress();
        router.push("/posts");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.post.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.post.list.queryKey(),
        });
        toast.success("Cập nhật bài viết thành công");
        startNavigationProgress();
        router.push("/posts");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (data: CreatePostInput) => {
    if (isEditing && postId) {
      updateMutation.mutate({ id: postId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && postLoading && !post) {
    return <PostFormSkeleton />;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/posts">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Chỉnh sửa Bài viết" : "Thêm Bài viết Mới"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Cập nhật nội dung và thông tin bài viết."
                : "Soạn thảo và xuất bản bài viết mới."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSeoModalOpen(true)}
          >
            <Search className="size-4" />
            Kiểm tra SEO
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            <Save className="size-4" />
            {isEditing ? "Lưu thay đổi" : "Tạo bài viết"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-title">Tiêu đề</Label>
                <Input
                  id="post-title"
                  placeholder="Nhập tiêu đề bài viết"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-slug">Đường dẫn (Slug)</Label>
                <Input
                  id="post-slug"
                  placeholder="e.g. huong-dan-su-dung"
                  {...form.register("slug")}
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-excerpt">Tóm tắt</Label>
                <Textarea
                  id="post-excerpt"
                  placeholder="Mô tả ngắn hiển thị ở danh sách bài viết..."
                  rows={3}
                  {...form.register("excerpt")}
                />
                {form.formState.errors.excerpt && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.excerpt.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nội dung</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="content"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <RichEditor
                      value={field.value ?? ""}
                      placeholder="Viết nội dung bài viết..."
                      onChange={(html) => field.onChange(html)}
                    />
                    {form.formState.errors.content && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.content.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>

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
                    key={field.value}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạng thái">
                        {
                          POST_STATUS_OPTIONS.find(
                            (option) => option.value === field.value,
                          )?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {POST_STATUS_OPTIONS.map((option) => (
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
                        <SelectItem value="none">Không có danh mục</SelectItem>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ảnh bìa</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="coverImage"
                control={form.control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    onRemove={() => field.onChange("")}
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-meta-title">Meta Title</Label>
                  <span className="text-xs text-muted-foreground">
                    {form.watch("metaTitle")?.length ?? 0}/70
                  </span>
                </div>
                <Input
                  id="post-meta-title"
                  placeholder="Tiêu đề SEO (mặc định dùng tiêu đề bài viết)"
                  {...form.register("metaTitle")}
                />
                {form.formState.errors.metaTitle && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.metaTitle.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-meta-desc">Meta Description</Label>
                  <span className="text-xs text-muted-foreground">
                    {form.watch("metaDescription")?.length ?? 0}/200
                  </span>
                </div>
                <Textarea
                  id="post-meta-desc"
                  placeholder="Mô tả SEO (mặc định dùng tóm tắt)"
                  rows={3}
                  {...form.register("metaDescription")}
                />
                {form.formState.errors.metaDescription && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.metaDescription.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SeoScoreModal
        open={seoModalOpen}
        onOpenChange={setSeoModalOpen}
        postData={{
          title: form.getValues("title") ?? "",
          slug: form.getValues("slug") ?? "",
          excerpt: form.getValues("excerpt") ?? "",
          content: form.getValues("content") ?? "",
          coverImage: form.getValues("coverImage") ?? "",
          metaTitle: form.getValues("metaTitle") ?? "",
          metaDescription: form.getValues("metaDescription") ?? "",
        }}
      />
    </form>
  );
}

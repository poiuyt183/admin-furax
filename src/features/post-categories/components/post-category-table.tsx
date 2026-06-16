"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useTRPC } from "@/trpc/client";
import type { CreatePostCategoryInput } from "../post-category.schema";
import { getPostCategoryColumns } from "./post-category-columns";
import { PostCategoryDialog } from "./post-category-dialog";

type PostCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  createdAt: string;
  _count: { posts: number };
};

export function PostCategoryTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PostCategoryRow | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] =
    useState<PostCategoryRow | null>(null);

  const { data: categories = [], isLoading } = useQuery(
    trpc.postCategory.list.queryOptions(),
  );

  const createMutation = useMutation(
    trpc.postCategory.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.postCategory.list.queryKey(),
        });
        setDialogOpen(false);
        toast.success("Tạo danh mục bài viết thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.postCategory.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.postCategory.list.queryKey(),
        });
        setDialogOpen(false);
        setEditingCategory(null);
        toast.success("Cập nhật danh mục bài viết thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.postCategory.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.postCategory.list.queryKey(),
        });
        setDeletingCategory(null);
        toast.success("Đã xoá danh mục bài viết");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleSubmit = (data: CreatePostCategoryInput) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(
    () =>
      getPostCategoryColumns({
        onEdit: (category) => {
          setEditingCategory(category);
          setDialogOpen(true);
        },
        onDelete: setDeletingCategory,
      }),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Đang tải danh mục bài viết...
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        searchPlaceholder="Tìm kiếm danh mục bài viết..."
        toolbar={
          <Button
            onClick={() => {
              setEditingCategory(null);
              setDialogOpen(true);
            }}
            className="ml-auto"
          >
            <Plus className="size-4" />
            Thêm danh mục
          </Button>
        }
      />

      <PostCategoryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={
          editingCategory
            ? {
                id: editingCategory.id,
                name: editingCategory.name,
                slug: editingCategory.slug,
                description: editingCategory.description ?? "",
                image: editingCategory.image ?? "",
              }
            : undefined
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá danh mục bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá &ldquo;{deletingCategory?.name}&rdquo;? Hành
              động này không thể hoàn tác.
              {(deletingCategory?._count?.posts ?? 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Danh mục này đang có {deletingCategory?._count.posts} bài
                  viết. Bạn phải chuyển các bài viết sang danh mục khác trước
                  khi xoá.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategory) {
                  deleteMutation.mutate({ id: deletingCategory.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

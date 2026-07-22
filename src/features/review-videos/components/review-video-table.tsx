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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import type { CreateReviewVideoInput } from "../review-video.schema";
import { getReviewVideoColumns } from "./review-video-columns";
import { ReviewVideoDialog } from "./review-video-dialog";

type ReviewVideoRow = {
  id: string;
  title: string | null;
  youtubeUrl: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export function ReviewVideoTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ReviewVideoRow | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<ReviewVideoRow | null>(
    null,
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const { data: categories = [] } = useQuery(
    trpc.category.list.queryOptions(),
  );

  const { data: videos = [], isLoading } = useQuery(
    trpc.reviewVideo.list.queryOptions({
      categoryId: categoryFilter !== "ALL" ? categoryFilter : undefined,
      isActive:
        activeFilter === "ALL"
          ? undefined
          : activeFilter === "ACTIVE",
    }),
  );

  const createMutation = useMutation(
    trpc.reviewVideo.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.reviewVideo.list.queryKey(),
        });
        setDialogOpen(false);
        toast.success("Thêm video thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.reviewVideo.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.reviewVideo.list.queryKey(),
        });
        setDialogOpen(false);
        setEditingVideo(null);
        toast.success("Cập nhật video thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.reviewVideo.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.reviewVideo.list.queryKey(),
        });
        setDeletingVideo(null);
        toast.success("Đã xoá video");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleSubmit = (data: CreateReviewVideoInput) => {
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(
    () =>
      getReviewVideoColumns({
        onEdit: (video) => {
          setEditingVideo(video);
          setDialogOpen(true);
        },
        onDelete: setDeletingVideo,
      }),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Đang tải danh sách video...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Đang hiển thị</SelectItem>
            <SelectItem value="INACTIVE">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={videos}
        searchKey="title"
        searchPlaceholder="Tìm theo tiêu đề, link, danh mục..."
        toolbar={
          <Button
            onClick={() => {
              setEditingVideo(null);
              setDialogOpen(true);
            }}
            className="ml-auto"
          >
            <Plus className="size-4" />
            Thêm video
          </Button>
        }
      />

      <ReviewVideoDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingVideo(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={
          editingVideo
            ? {
                id: editingVideo.id,
                title: editingVideo.title ?? "",
                youtubeUrl: editingVideo.youtubeUrl,
                categoryId: editingVideo.categoryId,
                isActive: editingVideo.isActive,
              }
            : undefined
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deletingVideo}
        onOpenChange={(open) => !open && setDeletingVideo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá video?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá video &ldquo;
              {deletingVideo?.title || "Video review"}&rdquo;? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingVideo) {
                  deleteMutation.mutate({ id: deletingVideo.id });
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

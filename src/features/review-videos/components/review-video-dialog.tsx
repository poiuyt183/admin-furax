"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod/v4";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getYoutubeEmbedUrl } from "@/lib/youtube";
import {
  createReviewVideoSchema,
  type CreateReviewVideoInput,
} from "../review-video.schema";

type ReviewVideoFormValues = z.input<typeof createReviewVideoSchema>;

interface ReviewVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateReviewVideoInput) => void;
  defaultValues?: Partial<CreateReviewVideoInput & { id: string }>;
  isLoading?: boolean;
}

export function ReviewVideoDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading,
}: ReviewVideoDialogProps) {
  const trpc = useTRPC();
  const isEditing = !!defaultValues?.id;

  const { data: categories = [] } = useQuery(
    trpc.category.list.queryOptions(),
  );

  const form = useForm<ReviewVideoFormValues, unknown, CreateReviewVideoInput>({
    resolver: zodResolver(createReviewVideoSchema),
    defaultValues: {
      title: "",
      youtubeUrl: "",
      categoryId: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: defaultValues?.title ?? "",
        youtubeUrl: defaultValues?.youtubeUrl ?? "",
        categoryId: defaultValues?.categoryId ?? "",
        isActive: defaultValues?.isActive ?? true,
      });
    }
  }, [open, defaultValues, form]);

  const youtubeUrl = form.watch("youtubeUrl");
  const embedUrl = useMemo(
    () => getYoutubeEmbedUrl(youtubeUrl ?? ""),
    [youtubeUrl],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa video review" : "Thêm video review"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-video-title">Tiêu đề (tuỳ chọn)</Label>
            <Input
              id="review-video-title"
              placeholder="Review bếp từ FuraX IH-400 Pro"
              {...form.register("title")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-video-url">Link YouTube</Label>
            <div className="relative">
              <Input
                id="review-video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                {...form.register("youtubeUrl")}
                className="pr-10"
              />
              {youtubeUrl && embedUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
            {form.formState.errors.youtubeUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.youtubeUrl.message}
              </p>
            )}
          </div>

          {embedUrl && (
            <div className="overflow-hidden rounded-lg border">
              <div className="aspect-video w-full">
                <iframe
                  title="Xem trước video"
                  src={embedUrl}
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Danh mục sản phẩm</Label>
            <Controller
              name="categoryId"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.categoryId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.categoryId.message}
              </p>
            )}
          </div>

          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                Hiển thị trên trang Video Review
              </label>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Lưu thay đổi" : "Thêm video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

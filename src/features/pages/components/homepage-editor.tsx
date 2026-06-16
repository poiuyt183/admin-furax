"use client";

import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImageIcon,
  LayoutGrid,
  Package,
  Save,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Video,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/trpc/client";
import { ImageUpload } from "@/features/products/components/image-upload";
import {
  CategorySelector,
  FeaturedSelectorSkeleton,
  ProductSelector,
} from "./featured-selector";
import type { Banner } from "@/trpc/routers/homepage";
import {
  getYoutubeEmbedUrl,
  isValidYoutubeUrl,
} from "@/lib/youtube";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function BannerItem({
  banner,
  index,
  isDragOver,
  dragOverPosition,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  banner: Banner;
  index: number;
  isDragOver: boolean;
  dragOverPosition: "top" | "bottom" | null;
  onChange: (b: Banner) => void;
  onRemove: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
        onDragStart(index);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e, index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      className={[
        "relative rounded-lg border bg-card p-4 space-y-4 transition-all select-none",
        isDragging ? "opacity-40 scale-[0.98] shadow-none" : "shadow-sm",
        isDragOver ? "ring-2 ring-primary" : "",
      ].join(" ")}
    >
      {/* Drop indicator line */}
      {isDragOver && dragOverPosition === "top" && (
        <div className="absolute top-0 left-4 right-4 h-0.5 -translate-y-1 bg-primary rounded-full" />
      )}
      {isDragOver && dragOverPosition === "bottom" && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 translate-y-1 bg-primary rounded-full" />
      )}

      {/* Header row */}
      <div className="flex items-center gap-2">
        <GripVertical className="size-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
        <span className="text-sm font-medium flex-1">Banner {index + 1}</span>
        <div className="flex items-center gap-2">
          <Label htmlFor={`banner-active-${banner.id}`} className="text-xs text-muted-foreground">
            Hiển thị
          </Label>
          <Switch
            id={`banner-active-${banner.id}`}
            checked={banner.isActive}
            onCheckedChange={(v) => onChange({ ...banner, isActive: v })}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Separator />

      {/* Image upload */}
      <div className="space-y-2 w-full">
        <Label>Ảnh banner</Label>
        <ImageUpload
          value={banner.imageUrl}
          onChange={(url) => onChange({ ...banner, imageUrl: url })}
          onRemove={() => onChange({ ...banner, imageUrl: "" })}
          aspectRatio="video"
        />
      </div>

      {/* Link */}
      <div className="space-y-2">
        <Label htmlFor={`banner-link-${banner.id}`}>Đường dẫn khi click</Label>
        <div className="relative">
          <Input
            id={`banner-link-${banner.id}`}
            placeholder="/products hoặc https://..."
            value={banner.link}
            onChange={(e) => onChange({ ...banner, link: e.target.value })}
            className="pr-10"
          />
          {banner.link && (
            <a
              href={banner.link}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function HomepageEditor() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: config } = useSuspenseQuery(trpc.homepage.get.queryOptions());

  const updateMutation = useMutation(
    trpc.homepage.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.homepage.get.queryKey() });
        toast.success("Đã lưu cấu hình trang chủ");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [banners, setBanners] = useState<Banner[]>(config?.banners ?? []);
  const [featuredCategoryIds, setFeaturedCategoryIds] = useState<string[]>(
    config?.featuredCategoryIds ?? [],
  );
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>(
    config?.featuredProductIds ?? [],
  );
  const [productVideoUrl, setProductVideoUrl] = useState(
    config?.productVideoUrl ?? "",
  );

  useEffect(() => {
    if (config) {
      setBanners(config.banners ?? []);
      setFeaturedCategoryIds(config.featuredCategoryIds ?? []);
      setFeaturedProductIds(config.featuredProductIds ?? []);
      setProductVideoUrl(config.productVideoUrl ?? "");
    }
  }, [config]);

  const productVideoEmbedUrl = useMemo(
    () => getYoutubeEmbedUrl(productVideoUrl),
    [productVideoUrl],
  );
  const productVideoUrlError =
    productVideoUrl.trim() && !isValidYoutubeUrl(productVideoUrl)
      ? "Link YouTube không hợp lệ"
      : null;

  const addBanner = () => {
    setBanners((prev) => [
      ...prev,
      { id: generateId(), imageUrl: "", link: "", isActive: true },
    ]);
  };

  const updateBanner = (index: number, updated: Banner) => {
    setBanners((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  const removeBanner = (index: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag-and-drop state
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"top" | "bottom" | null>(null);

  const handleDragStart = (index: number) => setDragFromIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (dragFromIndex === null || dragFromIndex === index) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverIndex(index);
    setDragOverPosition(e.clientY < midY ? "top" : "bottom");
  };

  const handleDrop = (toIndex: number) => {
    if (dragFromIndex === null || dragFromIndex === toIndex) return;
    setBanners((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragFromIndex, 1);
      const insertAt = dragOverPosition === "top" ? toIndex : toIndex + 1;
      const adjustedIndex = dragFromIndex < toIndex ? insertAt - 1 : insertAt;
      next.splice(adjustedIndex, 0, moved);
      return next;
    });
    setDragFromIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const handleSave = () => {
    if (productVideoUrlError) {
      toast.error(productVideoUrlError);
      return;
    }

    updateMutation.mutate({
      banners,
      featuredCategoryIds,
      featuredProductIds,
      productVideoUrl: productVideoUrl.trim(),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trang chủ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý nội dung hiển thị trên trang chủ website.
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Banner section */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Banner</CardTitle>
              <CardDescription>
                Quản lý danh sách ảnh banner hiển thị trên trang chủ
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addBanner}>
              <Plus className="size-4" />
              Thêm banner
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {banners.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
                <ImageIcon className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chưa có banner nào</p>
                <Button type="button" variant="outline" size="sm" onClick={addBanner}>
                  <Plus className="size-4" />
                  Thêm banner đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {banners.map((banner, index) => (
                  <BannerItem
                    key={banner.id}
                    banner={banner}
                    index={index}
                    isDragOver={dragOverIndex === index}
                    dragOverPosition={dragOverIndex === index ? dragOverPosition : null}
                    onChange={(updated) => updateBanner(index, updated)}
                    onRemove={() => removeBanner(index)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <LayoutGrid className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Danh mục nổi bật</CardTitle>
              <CardDescription>
                Các danh mục được hiển thị ưu tiên trên trang chủ
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FeaturedSelectorSkeleton />}>
              <CategorySelector
                selectedIds={featuredCategoryIds}
                onChange={setFeaturedCategoryIds}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Featured Products */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Sản phẩm nổi bật</CardTitle>
              <CardDescription>Các sản phẩm được ghim lên trang chủ</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FeaturedSelectorSkeleton />}>
              <ProductSelector
                selectedIds={featuredProductIds}
                onChange={setFeaturedProductIds}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Product Video */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Video className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Video sản phẩm</CardTitle>
              <CardDescription>
                Một video YouTube giới thiệu/review sản phẩm hiển thị trên trang chủ
              </CardDescription>
            </div>
            {productVideoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductVideoUrl("")}
              >
                <Trash2 className="size-4" />
                Xóa video
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-video-url">Link YouTube</Label>
              <div className="relative">
                <Input
                  id="product-video-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={productVideoUrl}
                  onChange={(event) => setProductVideoUrl(event.target.value)}
                  className="pr-10"
                />
                {productVideoUrl && productVideoEmbedUrl && (
                  <a
                    href={productVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
              {productVideoUrlError ? (
                <p className="text-xs text-destructive">{productVideoUrlError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ link dạng youtube.com/watch, youtu.be, youtube.com/shorts
                </p>
              )}
            </div>

            {productVideoEmbedUrl ? (
              <div className="overflow-hidden rounded-lg border bg-muted/20">
                <div className="aspect-video w-full">
                  <iframe
                    title="Xem trước video sản phẩm"
                    src={productVideoEmbedUrl}
                    className="size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted/20">
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <Video className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Chưa có video. Dán link YouTube để xem trước.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod/v4";
import { ExternalLink, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createStoreSchema,
  type CreateStoreInput,
} from "../store.schema";

const StoreLocationPicker = dynamic(
  () =>
    import("./store-location-picker").then((mod) => mod.StoreLocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-border bg-muted/40">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

type StoreFormValues = z.input<typeof createStoreSchema>;

interface StoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStoreInput) => void;
  defaultValues?: Partial<CreateStoreInput & { id: string }>;
  isLoading?: boolean;
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

export function StoreDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading,
}: StoreDialogProps) {
  const isEditing = !!defaultValues?.id;

  const form = useForm<StoreFormValues, unknown, CreateStoreInput>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      slug: "",
      name: "",
      address: "",
      city: "",
      district: "",
      phone: "",
      hours: "08:00 – 21:00",
      lat: 10.7769,
      lng: 106.7009,
      isMainStore: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        slug: defaultValues?.slug ?? "",
        name: defaultValues?.name ?? "",
        address: defaultValues?.address ?? "",
        city: defaultValues?.city ?? "",
        district: defaultValues?.district ?? "",
        phone: defaultValues?.phone ?? "",
        hours: defaultValues?.hours ?? "08:00 – 21:00",
        lat: defaultValues?.lat ?? 10.7769,
        lng: defaultValues?.lng ?? 106.7009,
        isMainStore: defaultValues?.isMainStore ?? false,
        isActive: defaultValues?.isActive ?? true,
      });
      setFlyToTarget(null);
    }
  }, [open, defaultValues, form]);

  const watchName = form.watch("name");
  useEffect(() => {
    if (!isEditing && watchName) {
      form.setValue("slug", slugify(watchName));
    }
  }, [watchName, isEditing, form]);

  const lat = form.watch("lat");
  const lng = form.watch("lng");
  const address = form.watch("address");
  const city = form.watch("city");
  const district = form.watch("district");
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const openGoogleMaps = useCallback(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      window.open(
        `https://www.google.com/maps?q=${lat},${lng}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }, [lat, lng]);

  const geocodeAddress = useCallback(async () => {
    const query = [address, district, city, "Vietnam"]
      .filter(Boolean)
      .join(", ");

    if (!address?.trim()) {
      toast.error("Vui lòng nhập địa chỉ trước khi tìm trên bản đồ");
      return;
    }

    setIsGeocoding(true);

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        toast.error("Không tìm thấy vị trí phù hợp với địa chỉ này");
        return;
      }

      const data = (await response.json()) as {
        lat: number;
        lng: number;
      };

      form.setValue("lat", data.lat, { shouldValidate: true });
      form.setValue("lng", data.lng, { shouldValidate: true });
      setFlyToTarget({ lat: data.lat, lng: data.lng });
      toast.success("Đã định vị địa chỉ trên bản đồ");
    } catch {
      toast.error("Không thể tìm vị trí, vui lòng thử lại");
    } finally {
      setIsGeocoding(false);
    }
  }, [address, city, district, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa Cửa hàng" : "Thêm Cửa hàng Mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="store-name">Tên cửa hàng</Label>
              <Input
                id="store-name"
                placeholder="FuraX Showroom Quận 1"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-slug">Mã cửa hàng</Label>
              <Input
                id="store-slug"
                placeholder="hcm-q1"
                {...form.register("slug")}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-phone">Số điện thoại</Label>
              <Input
                id="store-phone"
                placeholder="028 3822 1234"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="store-address">Địa chỉ</Label>
              <Textarea
                id="store-address"
                placeholder="123 Nguyễn Huệ, Phường Bến Nghé, Quận 1..."
                rows={2}
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-city">Thành phố</Label>
              <Input
                id="store-city"
                placeholder="TP. Hồ Chí Minh"
                {...form.register("city")}
              />
              {form.formState.errors.city && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-district">Quận / Huyện</Label>
              <Input
                id="store-district"
                placeholder="Quận 1"
                {...form.register("district")}
              />
              {form.formState.errors.district && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.district.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="store-hours">Giờ mở cửa</Label>
              <Input
                id="store-hours"
                placeholder="08:00 – 21:00"
                {...form.register("hours")}
              />
              {form.formState.errors.hours && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.hours.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label>Vị trí trên bản đồ</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nhấp vào bản đồ hoặc kéo ghim để chọn vị trí cửa hàng
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={geocodeAddress}
                  disabled={isGeocoding}
                  className="gap-2 shrink-0"
                >
                  {isGeocoding ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  Tìm theo địa chỉ
                </Button>
              </div>

              <StoreLocationPicker
                active={open}
                lat={Number(lat) || 10.7769}
                lng={Number(lng) || 106.7009}
                flyTo={flyToTarget}
                onChange={(coords) => {
                  form.setValue("lat", coords.lat, { shouldValidate: true });
                  form.setValue("lng", coords.lng, { shouldValidate: true });
                }}
              />

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
                    ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
                    : "Chưa chọn vị trí"}
                </span>
                {(form.formState.errors.lat || form.formState.errors.lng) && (
                  <span className="text-destructive">
                    {form.formState.errors.lat?.message ??
                      form.formState.errors.lng?.message}
                  </span>
                )}
              </div>

              <input type="hidden" {...form.register("lat")} />
              <input type="hidden" {...form.register("lng")} />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openGoogleMaps}
            className="gap-2"
          >
            <ExternalLink className="size-4" />
            Kiểm tra vị trí trên Google Maps
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <Controller
              name="isMainStore"
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  Cửa hàng chính (icon vương miện)
                </label>
              )}
            />
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
                  Hiển thị trên trang cửa hàng
                </label>
              )}
            />
          </div>

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
              {isEditing ? "Lưu thay đổi" : "Thêm cửa hàng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

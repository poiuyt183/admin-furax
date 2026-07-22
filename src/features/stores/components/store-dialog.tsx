"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod/v4";
import { ExternalLink, Link2, Loader2, MapPin, Search, X } from "lucide-react";
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
import { parseGoogleMapsCoords } from "@/lib/google-maps";
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
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-border bg-muted/40">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

type StoreFormValues = z.input<typeof createStoreSchema>;

type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  address: string;
  district: string;
  city: string;
};

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

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

export function StoreDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading,
}: StoreDialogProps) {
  const isEditing = !!defaultValues?.id;
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
      setLocationQuery("");
      setSearchResults([]);
      setIsSearchOpen(false);
      setMapsLink("");
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
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [isParsingMapsLink, setIsParsingMapsLink] = useState(false);
  const debouncedLocationQuery = useDebouncedValue(locationQuery.trim(), 400);

  const openGoogleMaps = useCallback(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      window.open(
        `https://www.google.com/maps?q=${lat},${lng}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }, [lat, lng]);

  useEffect(() => {
    if (!open) return;

    if (debouncedLocationQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();

    async function searchLocations() {
      setIsSearching(true);
      setHasSearched(false);

      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(debouncedLocationQuery)}&limit=6`,
          { signal: controller.signal },
        );

        if (response.status === 404) {
          setSearchResults([]);
          setIsSearchOpen(true);
          setHasSearched(true);
          return;
        }

        if (!response.ok) {
          toast.error("Không thể tìm vị trí, vui lòng thử lại");
          return;
        }

        const data = (await response.json()) as {
          results?: GeocodeResult[];
        };

        setSearchResults(data.results ?? []);
        setIsSearchOpen(true);
        setHasSearched(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        toast.error("Không thể tìm vị trí, vui lòng thử lại");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }

    void searchLocations();

    return () => controller.abort();
  }, [debouncedLocationQuery, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const applyCoords = useCallback(
    (coords: { lat: number; lng: number }, message: string) => {
      form.setValue("lat", coords.lat, { shouldValidate: true });
      form.setValue("lng", coords.lng, { shouldValidate: true });
      setFlyToTarget(coords);
      setSearchResults([]);
      setIsSearchOpen(false);
      toast.success(message);
    },
    [form],
  );

  const applyLocationResult = useCallback(
    (result: GeocodeResult) => {
      if (result.address) {
        form.setValue("address", result.address, { shouldValidate: true });
      }
      if (result.district) {
        form.setValue("district", result.district, { shouldValidate: true });
      }
      if (result.city) {
        form.setValue("city", result.city, { shouldValidate: true });
      }

      setLocationQuery(result.displayName);
      applyCoords(
        { lat: result.lat, lng: result.lng },
        "Đã định vị địa chỉ trên bản đồ",
      );
    },
    [applyCoords, form],
  );

  const extractFromMapsLink = useCallback(async () => {
    const trimmed = mapsLink.trim();
    if (!trimmed) {
      toast.error("Vui lòng dán link Google Maps");
      return;
    }

    const localCoords = parseGoogleMapsCoords(trimmed);
    if (localCoords) {
      applyCoords(localCoords, "Đã lấy vị trí từ link Google Maps");
      return;
    }

    setIsParsingMapsLink(true);
    try {
      const response = await fetch("/api/parse-maps-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!response.ok) {
        toast.error("Không trích xuất được vị trí từ link này");
        return;
      }

      const data = (await response.json()) as { lat: number; lng: number };
      applyCoords(data, "Đã lấy vị trí từ link Google Maps");
    } catch {
      toast.error("Không thể đọc link Google Maps, vui lòng thử lại");
    } finally {
      setIsParsingMapsLink(false);
    }
  }, [applyCoords, mapsLink]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,920px)] w-[calc(100%-1.5rem)] max-w-[1400px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1400px]">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <DialogTitle>
            {isEditing ? "Chỉnh sửa Cửa hàng" : "Thêm Cửa hàng Mới"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
            <div className="min-h-0 space-y-4 overflow-y-auto border-b p-5 lg:border-r lg:border-b-0">
              <div className="space-y-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>

              <div className="space-y-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>

              <div className="space-y-2">
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

              <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div>
                  <Label>Vị trí trên bản đồ</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tìm địa chỉ hoặc dán link Google Maps — bản đồ bên phải cập
                    nhật theo lựa chọn
                  </p>
                </div>

                <div ref={searchContainerRef} className="space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={locationQuery}
                      onChange={(event) => {
                        setLocationQuery(event.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0 || hasSearched) {
                          setIsSearchOpen(true);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setIsSearchOpen(false);
                        }
                      }}
                      placeholder="Tìm địa chỉ, phường, quận..."
                      className="pl-9 pr-9"
                      autoComplete="off"
                    />
                    {isSearching ? (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    ) : locationQuery ? (
                      <button
                        type="button"
                        aria-label="Xoá tìm kiếm"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setLocationQuery("");
                          setSearchResults([]);
                          setIsSearchOpen(false);
                          setHasSearched(false);
                        }}
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  {isSearchOpen &&
                    (searchResults.length > 0 ||
                      (hasSearched && !isSearching)) && (
                      <div className="max-h-40 overflow-y-auto rounded-md border bg-background">
                        {searchResults.length > 0 ? (
                          <ul className="divide-y">
                            {searchResults.map((result) => (
                              <li
                                key={`${result.lat},${result.lng},${result.displayName}`}
                              >
                                <button
                                  type="button"
                                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => applyLocationResult(result)}
                                >
                                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                  <span className="line-clamp-2">
                                    {result.displayName}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="px-3 py-2.5 text-sm text-muted-foreground">
                            Không tìm thấy địa chỉ phù hợp
                          </p>
                        )}
                      </div>
                    )}
                </div>

                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={mapsLink}
                      onChange={(event) => setMapsLink(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void extractFromMapsLink();
                        }
                      }}
                      placeholder="Dán link Google Maps..."
                      className="pl-9"
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void extractFromMapsLink()}
                    disabled={isParsingMapsLink || !mapsLink.trim()}
                    className="shrink-0 gap-2"
                  >
                    {isParsingMapsLink ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    Lấy vị trí
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {Number.isFinite(Number(lat)) &&
                    Number.isFinite(Number(lng))
                      ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
                      : "Chưa chọn vị trí"}
                  </span>
                  {(form.formState.errors.lat ||
                    form.formState.errors.lng) && (
                    <span className="text-destructive">
                      {form.formState.errors.lat?.message ??
                        form.formState.errors.lng?.message}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={openGoogleMaps}
                    className="h-auto gap-1.5 px-0 text-xs"
                  >
                    <ExternalLink className="size-3.5" />
                    Mở Google Maps
                  </Button>
                </div>

                <input type="hidden" {...form.register("lat")} />
                <input type="hidden" {...form.register("lng")} />
              </div>

              <div className="flex flex-col gap-3">
                <Controller
                  name="isMainStore"
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
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
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
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
            </div>

            <div className="relative min-h-[360px] bg-muted/20 lg:min-h-0">
              <div className="absolute inset-3">
                <StoreLocationPicker
                  active={open}
                  lat={Number(lat) || 10.7769}
                  lng={Number(lng) || 106.7009}
                  flyTo={flyToTarget}
                  className="h-full rounded-lg"
                  onChange={(coords) => {
                    form.setValue("lat", coords.lat, { shouldValidate: true });
                    form.setValue("lng", coords.lng, { shouldValidate: true });
                  }}
                />
              </div>
              <p className="pointer-events-none absolute bottom-5 left-1/2 z-[500] -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
                Nhấp hoặc kéo ghim để chọn vị trí
              </p>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
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

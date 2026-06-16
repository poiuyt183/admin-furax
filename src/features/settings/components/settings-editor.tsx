"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  GripVertical,
  ImageIcon,
  LayoutList,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/features/products/components/image-upload";
import type { ContactSettings, NavItem } from "@/features/settings/site-settings.schema";
import { useTRPC } from "@/trpc/client";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function NavItemEditor({
  item,
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
  item: NavItem;
  index: number;
  isDragOver: boolean;
  dragOverPosition: "top" | "bottom" | null;
  onChange: (item: NavItem) => void;
  onRemove: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (event: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
        onDragStart(index);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver(event, index);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(index);
      }}
      className={[
        "relative rounded-lg border bg-card p-4 space-y-4 transition-all select-none",
        isDragging ? "opacity-40 scale-[0.98] shadow-none" : "shadow-sm",
        isDragOver ? "ring-2 ring-primary" : "",
      ].join(" ")}
    >
      {isDragOver && dragOverPosition === "top" && (
        <div className="absolute top-0 left-4 right-4 h-0.5 -translate-y-1 bg-primary rounded-full" />
      )}
      {isDragOver && dragOverPosition === "bottom" && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 translate-y-1 bg-primary rounded-full" />
      )}

      <div className="flex items-center gap-2">
        <GripVertical className="size-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
        <span className="text-sm font-medium flex-1">Menu {index + 1}</span>
        <div className="flex items-center gap-2">
          <Label htmlFor={`nav-active-${item.id}`} className="text-xs text-muted-foreground">
            Hiển thị
          </Label>
          <Switch
            id={`nav-active-${item.id}`}
            checked={item.isActive}
            onCheckedChange={(checked) => onChange({ ...item, isActive: checked })}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`nav-label-${item.id}`}>Tên menu</Label>
          <Input
            id={`nav-label-${item.id}`}
            value={item.label}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            placeholder="Trang chủ"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`nav-href-${item.id}`}>Đường dẫn</Label>
          <div className="relative">
            <Input
              id={`nav-href-${item.id}`}
              value={item.href}
              onChange={(event) => onChange({ ...item, href: event.target.value })}
              placeholder="/tin-tuc"
              className="pr-10"
            />
            {item.href && (
              <a
                href={item.href}
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
    </div>
  );
}

export function SettingsEditor() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(trpc.settings.get.queryOptions());

  const updateMutation = useMutation(
    trpc.settings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() });
        toast.success("Đã lưu cài đặt website");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [logoWhiteUrl, setLogoWhiteUrl] = useState(settings.logoWhiteUrl);
  const [description, setDescription] = useState(settings.description);
  const [navbar, setNavbar] = useState<NavItem[]>(settings.navbar);
  const [contact, setContact] = useState<ContactSettings>(settings.contact);

  useEffect(() => {
    setLogoUrl(settings.logoUrl);
    setLogoWhiteUrl(settings.logoWhiteUrl);
    setDescription(settings.description);
    setNavbar(settings.navbar);
    setContact(settings.contact);
  }, [settings]);

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"top" | "bottom" | null>(null);

  const handleDragStart = (index: number) => setDragFromIndex(index);

  const handleDragOver = (event: React.DragEvent, index: number) => {
    if (dragFromIndex === null || dragFromIndex === index) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverIndex(index);
    setDragOverPosition(event.clientY < midY ? "top" : "bottom");
  };

  const handleDrop = (toIndex: number) => {
    if (dragFromIndex === null || dragFromIndex === toIndex) return;
    setNavbar((prev) => {
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

  const addNavItem = () => {
    setNavbar((prev) => [
      ...prev,
      {
        id: generateId(),
        label: "Menu mới",
        href: "/",
        isActive: true,
      },
    ]);
  };

  const updateContact = (field: keyof ContactSettings, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      logoUrl,
      logoWhiteUrl,
      description,
      navbar,
      contact,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt website</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý logo, mô tả thương hiệu, menu và thông tin liên hệ hiển thị trên storefront.
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
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Logo</CardTitle>
              <CardDescription>
                Logo header và logo footer (nền tối)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Logo chính (header)</Label>
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                onRemove={() => setLogoUrl("")}
                aspectRatio="video"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo footer (nền tối)</Label>
              <ImageUpload
                value={logoWhiteUrl}
                onChange={setLogoWhiteUrl}
                onRemove={() => setLogoWhiteUrl("")}
                aspectRatio="video"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Type className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Mô tả thương hiệu</CardTitle>
              <CardDescription>
                Đoạn giới thiệu ngắn hiển thị ở footer website
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Thương hiệu thiết bị nhà bếp cao cấp..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <LayoutList className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Navbar</CardTitle>
              <CardDescription>
                Menu điều hướng chính trên header website
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addNavItem}>
              <Plus className="size-4" />
              Thêm menu
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {navbar.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
                <LayoutList className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chưa có menu nào</p>
                <Button type="button" variant="outline" size="sm" onClick={addNavItem}>
                  <Plus className="size-4" />
                  Thêm menu đầu tiên
                </Button>
              </div>
            ) : (
              navbar.map((item, index) => (
                <NavItemEditor
                  key={item.id}
                  item={item}
                  index={index}
                  isDragOver={dragOverIndex === index}
                  dragOverPosition={dragOverIndex === index ? dragOverPosition : null}
                  onChange={(updated) =>
                    setNavbar((prev) =>
                      prev.map((navItem, navIndex) =>
                        navIndex === index ? updated : navItem,
                      ),
                    )
                  }
                  onRemove={() =>
                    setNavbar((prev) => prev.filter((_, navIndex) => navIndex !== index))
                  }
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Phone className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Liên hệ</CardTitle>
              <CardDescription>
                Thông tin hiển thị ở topbar, footer và các liên kết mạng xã hội
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contact-address">Địa chỉ</Label>
              <Textarea
                id="contact-address"
                value={contact.address}
                onChange={(event) => updateContact("address", event.target.value)}
                rows={2}
                placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-hotline">Hotline</Label>
              <Input
                id="contact-hotline"
                value={contact.hotline}
                onChange={(event) => updateContact("hotline", event.target.value)}
                placeholder="1900 xxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-technical">Số kỹ thuật</Label>
              <Input
                id="contact-technical"
                value={contact.technicalPhone}
                onChange={(event) => updateContact("technicalPhone", event.target.value)}
                placeholder="1900 xxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contact.email}
                onChange={(event) => updateContact("email", event.target.value)}
                placeholder="info@furax.vn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-facebook">Fanpage Facebook</Label>
              <Input
                id="contact-facebook"
                value={contact.facebookUrl}
                onChange={(event) => updateContact("facebookUrl", event.target.value)}
                placeholder="https://facebook.com/furax"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contact-zalo">Link Zalo</Label>
              <Input
                id="contact-zalo"
                value={contact.zaloUrl}
                onChange={(event) => updateContact("zaloUrl", event.target.value)}
                placeholder="https://zalo.me/furax"
              />
            </div>

            <div className="sm:col-span-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground flex items-start gap-2">
              <Mail className="size-4 mt-0.5 shrink-0" />
              <p>
                Hotline và số kỹ thuật sẽ được dùng cho liên kết gọi điện (`tel:`). Facebook và Zalo dùng cho icon mạng xã hội ở footer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

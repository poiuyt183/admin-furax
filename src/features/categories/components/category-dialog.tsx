"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createCategorySchema, type CreateCategoryInput } from "../category.schema"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useCloudinaryUpload } from "@/components/editor/hooks/useCloudinaryUpload"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateCategoryInput) => void
  defaultValues?: Partial<CreateCategoryInput & { id: string }>
  isLoading?: boolean
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
    .replace(/^-|-$/g, "")
}

export function CategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading,
}: CategoryDialogProps) {
  const isEditing = !!defaultValues?.id
  const { upload, uploading, progress } = useCloudinaryUpload()
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: defaultValues?.name ?? "",
        slug: defaultValues?.slug ?? "",
        description: defaultValues?.description ?? "",
        image: defaultValues?.image ?? "",
      })
      setImagePreview(defaultValues?.image ?? null)
    }
  }, [open, defaultValues, form])

  const watchName = form.watch("name")
  useEffect(() => {
    if (!isEditing && watchName) {
      form.setValue("slug", slugify(watchName))
    }
  }, [watchName, isEditing, form])

  const handleImageUpload = useCallback(async (file: File) => {
    const result = await upload(file)
    if (result) {
      form.setValue("image", result.url)
      setImagePreview(result.url)
    }
  }, [upload, form])

  const handleRemoveImage = useCallback(() => {
    form.setValue("image", "")
    setImagePreview(null)
  }, [form])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith("image/")) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa Danh mục" : "Thêm Danh mục Mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Tên danh mục</Label>
            <Input id="cat-name" placeholder="e.g. Refrigerators" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-slug">Đường dẫn (Slug)</Label>
            <Input id="cat-slug" placeholder="e.g. refrigerators" {...form.register("slug")} />
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Mô tả</Label>
            <Textarea
              id="cat-desc"
              placeholder="Mô tả tuỳ chọn..."
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Hình ảnh</Label>
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                <img src={imagePreview} alt="Category" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleImageUpload(file)
                  }
                  input.click()
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-8 text-muted-foreground animate-spin" />
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Nhấp hoặc kéo thả để tải lên
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isLoading || uploading}>
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Lưu thay đổi" : "Tạo danh mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useCallback, useState } from "react"
import { ImagePlus, Loader2, X, GripVertical } from "lucide-react"
import { useCloudinaryUpload } from "@/components/editor/hooks/useCloudinaryUpload"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  className?: string
  aspectRatio?: "square" | "video"
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  aspectRatio = "video",
}: ImageUploadProps) {
  const { upload, uploading, progress } = useCloudinaryUpload()

  const handleUpload = useCallback(
    async (file: File) => {
      const result = await upload(file)
      if (result) {
        onChange(result.url)
      }
    },
    [upload, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith("image/")) {
        handleUpload(file)
      }
    },
    [handleUpload]
  )

  const openFilePicker = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleUpload(file)
    }
    input.click()
  }, [handleUpload])

  if (value) {
    return (
      <div
        className={cn(
          "relative rounded-lg overflow-hidden border bg-muted group",
          aspectRatio === "square" ? "aspect-square" : "aspect-video",
          className
        )}
      >
        <img src={value} alt="Upload" className="size-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="size-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={openFilePicker}
      className={cn(
        "relative rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer",
        aspectRatio === "square" ? "aspect-square" : "aspect-video",
        className
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="size-8 text-muted-foreground animate-spin" />
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </>
      ) : (
        <>
          <ImagePlus className="size-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click or drag to upload</span>
        </>
      )}
    </div>
  )
}

interface MultiImageUploadProps {
  value: { url: string; alt?: string }[]
  onChange: (images: { url: string; alt?: string }[]) => void
  maxImages?: number
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 10,
}: MultiImageUploadProps) {
  const { upload, uploading, progress } = useCloudinaryUpload()

  const handleUpload = useCallback(
    async (file: File) => {
      const result = await upload(file)
      if (result) {
        onChange([...value, { url: result.url }])
      }
    },
    [upload, onChange, value]
  )

  const handleMultiUpload = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          const result = await upload(file)
          if (result) {
            value = [...value, { url: result.url }]
            onChange(value)
          }
        }
      }
    },
    [upload, onChange, value]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length > 0) {
        handleMultiUpload(e.dataTransfer.files)
      }
    },
    [handleMultiUpload]
  )

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [onChange, value]
  )

  const openFilePicker = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) handleMultiUpload(files)
    }
    input.click()
  }, [handleMultiUpload])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {value.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
          >
            <img src={image.url} alt={image.alt ?? ""} className="size-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {value.length < maxImages && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={openFilePicker}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="size-6 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </>
            ) : (
              <>
                <ImagePlus className="size-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add image</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

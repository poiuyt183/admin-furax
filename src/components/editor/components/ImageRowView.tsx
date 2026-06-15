"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useRef, useCallback, type DragEvent } from "react";
import { useCloudinaryUpload } from "../hooks/useCloudinaryUpload";
import {
  ImagePlus,
  X,
  Loader2,
  GripVertical,
  Columns2,
  Columns3,
  Link,
} from "lucide-react";
import type { ImageRowImage } from "../extensions/ImageRow";

export default function ImageRowView({
  node,
  updateAttributes,
  selected,
  deleteNode,
  editor,
}: NodeViewProps) {
  const {
    images,
    columns,
    height = 192,
  } = node.attrs as {
    images: ImageRowImage[];
    columns: number;
    height: number;
  };

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <NodeViewWrapper
      className="relative my-4 group"
      draggable="true"
      data-drag-handle
    >
      {/* Drag handle */}
      {editor.isEditable && (
        <div
          className={`absolute -left-8 top-1/2 -translate-y-1/2 p-1 rounded-md bg-gray-100 text-gray-400 cursor-grab active:cursor-grabbing transition-opacity ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-70"
          }`}
          contentEditable={false}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Column switcher — visible on hover/select */}
      {selected && editor.isEditable && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-gray-200 p-0.5 z-20">
          <button
            onClick={() => {
              const newImages = images.slice(0, 2);
              while (newImages.length < 2) newImages.push({ src: "", alt: "" });
              updateAttributes({ columns: 2, images: newImages });
            }}
            className={`p-1.5 rounded-md transition-colors text-xs font-medium ${
              columns === 2
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            title="2 columns"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const newImages = [...images];
              while (newImages.length < 3) newImages.push({ src: "", alt: "" });
              updateAttributes({ columns: 3, images: newImages.slice(0, 3) });
            }}
            className={`p-1.5 rounded-md transition-colors text-xs font-medium ${
              columns === 3
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            title="3 columns"
          >
            <Columns3 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          <button
            onClick={() => deleteNode()}
            className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Remove row"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid */}
      <div
        ref={containerRef}
        className={`flex gap-2 rounded-xl p-1 transition-all ${
          selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
        }`}
        style={{ height: `${height}px` }}
      >
        {images.slice(0, columns).map((img: ImageRowImage, index: number) => (
          <ImageCell
            key={index}
            image={img}
            index={index}
            allImages={images}
            updateAttributes={updateAttributes}
            isEditable={editor.isEditable}
            rowHeight={height}
            containerRef={containerRef}
          />
        ))}
      </div>
    </NodeViewWrapper>
  );
}

/* ─── Individual cell ─── */

function ImageCell({
  image,
  index,
  allImages,
  updateAttributes,
  isEditable,
  rowHeight,
  containerRef,
}: {
  image: ImageRowImage;
  index: number;
  allImages: ImageRowImage[];
  updateAttributes: (attrs: Record<string, unknown>) => void;
  isEditable: boolean;
  rowHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const { upload, uploading, progress } = useCloudinaryUpload();

  const updateImage = useCallback(
    (src: string, alt?: string) => {
      const newImages = [...allImages];
      newImages[index] = { src, alt: alt || newImages[index]?.alt || "" };
      updateAttributes({ images: newImages });
    },
    [allImages, index, updateAttributes],
  );

  const removeImage = useCallback(() => {
    const newImages = [...allImages];
    newImages[index] = { src: "", alt: "" };
    updateAttributes({ images: newImages });
  }, [allImages, index, updateAttributes]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const result = await upload(file);
      if (result) {
        updateImage(result.url);
      }
    },
    [upload, updateImage],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload],
  );

  const handleUrlSubmit = useCallback(() => {
    if (urlValue.trim()) {
      updateImage(urlValue.trim());
      setUrlValue("");
      setShowUrlInput(false);
    }
  }, [urlValue, updateImage]);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = cellRef.current?.offsetWidth || 0;
      const startHeight = rowHeight;
      const parentWidth = containerRef.current?.offsetWidth || 1;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const diffX = moveEvent.clientX - startX;
        const diffY = moveEvent.clientY - startY;

        const newWidthPercent = Math.max(
          10,
          Math.min(90, ((startWidth + diffX) / parentWidth) * 100),
        );
        const newHeight = Math.max(80, Math.min(800, startHeight + diffY));

        if (cellRef.current) {
          cellRef.current.style.flex = `0 0 ${newWidthPercent}%`;
        }
        if (containerRef.current) {
          containerRef.current.style.height = `${newHeight}px`;
        }
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        const diffX = upEvent.clientX - startX;
        const diffY = upEvent.clientY - startY;

        const newWidthPercent = Math.max(
          10,
          Math.min(90, ((startWidth + diffX) / parentWidth) * 100),
        );
        const newHeight = Math.max(80, Math.min(800, startHeight + diffY));

        const newImages = [...allImages];
        newImages[index] = { ...newImages[index], width: newWidthPercent };

        updateAttributes({ height: newHeight, images: newImages });

        if (cellRef.current) cellRef.current.style.flex = "";
        if (containerRef.current) containerRef.current.style.height = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [rowHeight, allImages, index, updateAttributes, containerRef],
  );

  const cellStyle = image.width
    ? { flex: `0 0 ${image.width}%` }
    : { flex: "1 1 0%" };

  // Image is set — show it
  if (image.src) {
    return (
      <div
        ref={cellRef}
        style={cellStyle}
        className={`relative group/cell min-w-0 rounded-lg overflow-visible bg-gray-50 ${
          isResizing ? "select-none z-10" : "z-0"
        }`}
      >
        <img
          src={image.src}
          alt={image.alt || ""}
          className="w-full h-full object-cover rounded-lg"
          draggable={false}
        />
        {/* Remove button */}
        {isEditable && (
          <button
            onClick={removeImage}
            className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-md opacity-0 group-hover/cell:opacity-100 hover:bg-black/70 transition-all"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Resize handle */}
        {isEditable && (
          <div
            onMouseDown={startResize}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform z-20 opacity-0 group-hover/cell:opacity-100"
          />
        )}
      </div>
    );
  }

  // If not editable and empty, just render a blank space or nothing
  if (!isEditable) {
    return (
      <div style={cellStyle} className="min-w-0 bg-gray-50/50 rounded-lg" />
    );
  }

  // Empty slot — show drop zone
  return (
    <div ref={cellRef} style={cellStyle} className="min-w-0 h-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 h-full border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-gray-500">{progress}%</span>
          </div>
        ) : (
          <>
            <ImagePlus className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 text-center px-2">
              Drop image or click
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      </div>

      {/* URL input toggle */}
      {!showUrlInput ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowUrlInput(true);
          }}
          className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-500 transition-colors mx-auto"
        >
          <Link className="w-3 h-3" />
          or paste URL
        </button>
      ) : (
        <div className="mt-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://..."
            className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUrlSubmit();
              if (e.key === "Escape") setShowUrlInput(false);
            }}
            autoFocus
          />
          <button
            onClick={handleUrlSubmit}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 shrink-0"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

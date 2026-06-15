"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useRef, useCallback, useMemo } from "react";
import { GripVertical, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

type Align = "left" | "center" | "right";

function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/embed/")) return url;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return url;
}

const WRAPPER_CLASSES: Record<Align, string> = {
  left: "flex justify-start",
  center: "flex justify-center",
  right: "flex justify-end",
};

export default function YoutubeNodeView({
  node,
  updateAttributes,
  selected,
  editor,
}: NodeViewProps) {
  const { src, width, height, align = "center" } = node.attrs;
  const embedUrl = useMemo(() => toEmbedUrl(src), [src]);

  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback(
    (corner: "se" | "sw") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = containerRef.current?.offsetWidth || 640;
      const startHeight = containerRef.current?.offsetHeight || 360;
      const ratio = startHeight / startWidth;
      const direction = corner === "se" ? 1 : -1;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const diffX = (moveEvent.clientX - startX) * direction;
        const newWidth = Math.max(200, Math.min(800, startWidth + diffX));
        const newHeight = Math.round(newWidth * ratio);

        if (containerRef.current) {
          containerRef.current.style.width = `${newWidth}px`;
          containerRef.current.style.height = `${newHeight}px`;
        }
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        if (containerRef.current) {
          updateAttributes({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [updateAttributes],
  );

  return (
    <NodeViewWrapper
      className={`relative my-4 ${WRAPPER_CLASSES[(align as Align) || "center"]}`}
      draggable="true"
      data-drag-handle
    >
      <div
        ref={containerRef}
        className={`relative inline-block group overflow-hidden rounded-xl transition-shadow duration-150 ${
          selected
            ? "ring-2 ring-red-500 ring-offset-2 shadow-lg"
            : "hover:ring-1 hover:ring-gray-300"
        } ${isResizing ? "select-none" : ""}`}
        style={{
          width: width || 640,
          height: height || 360,
          maxWidth: "100%",
        }}
      >
        {/* Drag handle */}
        {editor.isEditable && (
          <div
            className={`absolute -left-8 top-1/2 -translate-y-1/2 p-1 rounded-md bg-gray-100 text-gray-400 cursor-grab active:cursor-grabbing transition-opacity z-10 ${
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-70"
            }`}
            contentEditable={false}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* YouTube iframe */}
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          style={{ pointerEvents: selected || isResizing ? "none" : "auto" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Controls — visible on selection */}
        {selected && editor.isEditable && (
          <>
            {/* Alignment toolbar */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-gray-200 p-0.5 z-20">
              <button
                onClick={() => updateAttributes({ align: "left" })}
                className={`p-1.5 rounded-md transition-colors ${
                  align === "left"
                    ? "bg-red-100 text-red-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateAttributes({ align: "center" })}
                className={`p-1.5 rounded-md transition-colors ${
                  align === "center" || !align
                    ? "bg-red-100 text-red-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateAttributes({ align: "right" })}
                className={`p-1.5 rounded-md transition-colors ${
                  align === "right"
                    ? "bg-red-100 text-red-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Resize handles */}
            <div
              onMouseDown={startResize("sw")}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full cursor-sw-resize shadow-md hover:scale-125 transition-transform z-10"
            />
            <div
              onMouseDown={startResize("se")}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform z-10"
            />

            {/* Size indicator */}
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
              {containerRef.current?.offsetWidth || width} ×{" "}
              {containerRef.current?.offsetHeight || height}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

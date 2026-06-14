"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useRef, useCallback } from "react";
import {
  Pencil,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

type Align = "left" | "center" | "right";

const WRAPPER_CLASSES: Record<Align, string> = {
  left: "flex justify-start",
  center: "flex justify-center",
  right: "flex justify-end",
};

export default function ImageNodeView({
  node,
  updateAttributes,
  selected,
  editor,
}: NodeViewProps) {
  const { src, alt, width, height, align = "center" } = node.attrs;

  const [isResizing, setIsResizing] = useState(false);
  const [showAltInput, setShowAltInput] = useState(false);
  const [altValue, setAltValue] = useState(alt || "");
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback(
    (corner: "se" | "sw") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = containerRef.current?.offsetWidth || 300;
      const startHeight = containerRef.current?.offsetHeight || 200;
      const ratio = startHeight / startWidth;
      const direction = corner === "se" ? 1 : -1;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const diffX = (moveEvent.clientX - startX) * direction;
        const newWidth = Math.max(80, Math.min(800, startWidth + diffX));
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
    [updateAttributes]
  );

  const handleSaveAlt = useCallback(() => {
    updateAttributes({ alt: altValue });
    setShowAltInput(false);
  }, [altValue, updateAttributes]);

  return (
    <NodeViewWrapper
      className={`relative my-3 ${WRAPPER_CLASSES[(align as Align) || "center"]}`}
      draggable="true"
      data-drag-handle
    >
      <div
        ref={containerRef}
        className={`relative inline-block group cursor-default transition-shadow duration-150 ${
          selected
            ? "ring-2 ring-blue-500 ring-offset-2 rounded-lg shadow-lg"
            : "hover:ring-1 hover:ring-gray-300 rounded-lg"
        } ${isResizing ? "select-none" : ""}`}
        style={{
          width: width ? `${width}px` : "auto",
          height: height ? `${height}px` : "auto",
          maxWidth: "100%",
        }}
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

        {/* Image */}
        <img
          src={src}
          alt={alt || ""}
          className="block w-full h-full object-contain rounded-lg"
          draggable={false}
        />

        {/* Controls — visible on selection */}
        {selected && editor.isEditable && (
          <>
            {/* Toolbar: align + alt */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-gray-200 p-0.5 z-20">
              <button
                onClick={() => updateAttributes({ align: "left" })}
                className={`p-1.5 rounded-md transition-colors ${
                  align === "left" ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateAttributes({ align: "center" })}
                className={`p-1.5 rounded-md transition-colors ${
                  (align === "center" || !align) ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateAttributes({ align: "right" })}
                className={`p-1.5 rounded-md transition-colors ${
                  align === "right" ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-5 bg-gray-200 mx-0.5" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAltValue(alt || "");
                  setShowAltInput(!showAltInput);
                }}
                className={`p-1.5 rounded-md transition-colors text-xs font-medium ${
                  alt ? "text-green-600 hover:bg-green-50" : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Edit Alt Text"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Resize handles */}
            <div
              onMouseDown={startResize("sw")}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize shadow-md hover:scale-125 transition-transform z-10"
            />
            <div
              onMouseDown={startResize("se")}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform z-10"
            />
          </>
        )}
      </div>

      {/* Alt text inline editor */}
      {showAltInput && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-72 animate-[slideUp_150ms_ease-out]"
          onClick={(e) => e.stopPropagation()}
          contentEditable={false}
        >
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Alt Text
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={altValue}
              onChange={(e) => setAltValue(e.target.value)}
              placeholder="Describe this image..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveAlt();
                if (e.key === "Escape") setShowAltInput(false);
              }}
              autoFocus
            />
            <button
              onClick={handleSaveAlt}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shrink-0"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

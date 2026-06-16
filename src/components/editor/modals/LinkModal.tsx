"use client";

import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { X, Link, Unlink } from "lucide-react";

interface LinkModalProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export default function LinkModal({ editor, isOpen, onClose }: LinkModalProps) {
  const [url, setUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const previousUrl = editor.getAttributes("link").href ?? "";
      setUrl(previousUrl);
      setOpenInNewTab(true);
    }
  }, [isOpen, editor]);

  const handleClose = useCallback(() => {
    setUrl("");
    onClose();
  }, [onClose]);

  const handleApply = useCallback(() => {
    const trimmed = url.trim();

    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      handleClose();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: trimmed,
        target: openInNewTab ? "_blank" : null,
      })
      .run();

    handleClose();
  }, [editor, url, openInNewTab, handleClose]);

  const handleRemove = useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    handleClose();
  }, [editor, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-[slideUp_200ms_ease-out] border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-500" />
            Insert Link
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApply();
                }
                if (e.key === "Escape") handleClose();
              }}
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Open in new tab
          </label>

          <div className="flex gap-2">
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex-1 py-2.5 px-4 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              {url.trim() ? "Apply Link" : "Remove Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

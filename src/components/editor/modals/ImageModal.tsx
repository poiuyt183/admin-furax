"use client";

import { useState, useCallback, useRef, type DragEvent } from "react";
import type { Editor } from "@tiptap/react";
import { useCloudinaryUpload } from "../hooks/useCloudinaryUpload";
import {
  Upload,
  Link,
  X,
  ImageIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ImageModalProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "upload" | "url";

export default function ImageModal({ editor, isOpen, onClose }: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, error, reset } = useCloudinaryUpload();

  const handleClose = useCallback(() => {
    setImageUrl("");
    setPreviewUrl("");
    setIsDragging(false);
    reset();
    onClose();
  }, [onClose, reset]);

  const insertImage = useCallback(
    (url: string) => {
      editor.chain().focus().setImage({ src: url }).run();
      handleClose();
    },
    [editor, handleClose]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const result = await upload(file);
      if (result) {
        insertImage(result.url);
      }
    },
    [upload, insertImage]
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
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleUrlSubmit = useCallback(() => {
    if (imageUrl.trim()) {
      insertImage(imageUrl.trim());
    }
  }, [imageUrl, insertImage]);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setImageUrl(url);
      if (url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i)) {
        setPreviewUrl(url);
      } else {
        setPreviewUrl("");
      }
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl animate-[slideUp_200ms_ease-out] border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Insert Image
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "upload"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </span>
            {activeTab === "upload" && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "url"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Link className="w-4 h-4" />
              Image URL
            </span>
            {activeTab === "url" && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "upload" && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.02]"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                } ${uploading ? "pointer-events-none" : ""}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-sm font-medium text-gray-700">
                      Uploading...
                    </p>
                    <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{progress}%</p>
                  </div>
                ) : progress === 100 ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-medium text-green-600">
                      Upload complete!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Drop image here or{" "}
                        <span className="text-blue-600">click to upload</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WebP or GIF
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              {error && (
                <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          )}

          {activeTab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUrlSubmit();
                  }}
                />
              </div>

              {previewUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-40 object-contain"
                    onError={() => setPreviewUrl("")}
                  />
                </div>
              )}

              <button
                onClick={handleUrlSubmit}
                disabled={!imageUrl.trim()}
                className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Insert Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

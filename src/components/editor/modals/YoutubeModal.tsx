"use client";

import { useState, useCallback, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import { X, Video, Play } from "lucide-react";

interface YoutubeModalProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

function parseYoutubeUrl(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export default function YoutubeModal({
  editor,
  isOpen,
  onClose,
}: YoutubeModalProps) {
  const [url, setUrl] = useState("");
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);

  const videoId = useMemo(() => parseYoutubeUrl(url), [url]);

  const handleClose = useCallback(() => {
    setUrl("");
    setWidth(640);
    setHeight(480);
    onClose();
  }, [onClose]);

  const handleInsert = useCallback(() => {
    if (url.trim()) {
      editor
        .chain()
        .focus()
        .setYoutubeVideo({
          src: url.trim(),
          width: Math.max(320, Math.min(1024, width)),
          height: Math.max(180, Math.min(720, height)),
        })
        .run();
      handleClose();
    }
  }, [editor, url, width, height, handleClose]);

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
            <Video className="w-5 h-5 text-red-500" />
            Embed YouTube Video
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* URL input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInsert();
              }}
            />
          </div>

          {/* Dimensions */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={320}
                max={1024}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={180}
                max={720}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
          </div>

          {/* Preview */}
          {videoId && (
            <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-900">
              <div className="relative aspect-video flex items-center justify-center">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Video preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleInsert}
            disabled={!url.trim() || !videoId}
            className="w-full py-2.5 px-4 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            Embed Video
          </button>
        </div>
      </div>
    </div>
  );
}

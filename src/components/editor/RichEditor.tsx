"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import { ResizableImage } from "./extensions/ResizableImage";
import { Link as LinkExtension } from "@tiptap/extension-link";
import { ResizableYoutube } from "./extensions/ResizableYoutube";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Underline as UnderlineExtension } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import {
  Table as TableExtension,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { CharacterCount } from "@tiptap/extension-character-count";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { ImageRow } from "./extensions/ImageRow";

import Toolbar from "./Toolbar";
import BubbleMenuBar from "./BubbleMenuBar";
import ImageModal from "./modals/ImageModal";
import YoutubeModal from "./modals/YoutubeModal";

import { useState, useCallback, useEffect } from "react";

interface RichEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  placeholder?: string;
  maxCharacters?: number;
  className?: string;
}

export default function RichEditor({
  initialContent = "",
  onChange,
  onBlur,
  placeholder = "Start writing something amazing...",
  maxCharacters,
  className = "",
}: RichEditorProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      UnderlineExtension,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ResizableImage.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "editor-link",
          rel: "noopener noreferrer",
        },
      }),
      ResizableYoutube.configure({
        HTMLAttributes: {
          class: "editor-youtube",
        },
        inline: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TableExtension.configure({
        resizable: true,
        HTMLAttributes: {
          class: "editor-table",
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount.configure({
        limit: maxCharacters,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "editor-task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
      }),
      // ImageRow,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onBlur: ({ editor }) => {
      onBlur?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isPreview);
    }
  }, [isPreview, editor]);

  const handleOpenImageModal = useCallback(() => setImageModalOpen(true), []);
  const handleCloseImageModal = useCallback(() => setImageModalOpen(false), []);
  const handleOpenYoutubeModal = useCallback(
    () => setYoutubeModalOpen(true),
    [],
  );
  const handleCloseYoutubeModal = useCallback(
    () => setYoutubeModalOpen(false),
    [],
  );

  if (!editor) {
    return (
      <div
        className={`w-full max-w-[860px] mx-auto rounded-2xl border border-gray-200 bg-white overflow-hidden ${className}`}
      >
        <div className="h-14 bg-gray-50 border-b border-gray-200 animate-pulse" />
        <div className="min-h-[400px] p-8">
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const characterCount = editor.storage.characterCount;
  const characters = characterCount?.characters() ?? 0;
  const words = characterCount?.words() ?? 0;

  return (
    <div
      className={`w-full max-w-[860px] mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-shadow duration-200 focus-within:shadow-md focus-within:border-gray-300 ${className}`}
    >
      {/* Toolbar */}
      {!isPreview && (
        <Toolbar
          editor={editor}
          onOpenImageModal={handleOpenImageModal}
          onOpenYoutubeModal={handleOpenYoutubeModal}
        />
      )}

      {/* Bubble Menu */}
      {!isPreview && <BubbleMenuBar editor={editor} />}

      {/* Editor Content */}
      <div className={isPreview ? "hidden" : "block"}>
        <EditorContent editor={editor} className="tiptap-wrapper" />
      </div>

      {/* HTML Output Preview */}
      {isPreview && (
        <div className="p-6 bg-[#0d1117] text-[#c9d1d9] font-mono text-sm whitespace-pre-wrap break-words min-h-[400px] max-h-[600px] overflow-auto rounded-b-2xl tiptap-html-preview">
          {editor.getHTML()}
        </div>
      )}

      {/* Footer — Character Count */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>
            characters:{" "}
            <span className="text-gray-600 font-medium tabular-nums">
              {characters.toLocaleString()}
            </span>
            {maxCharacters && (
              <span className="text-gray-400">
                {" "}
                / {maxCharacters.toLocaleString()}
              </span>
            )}
          </span>
          <span>
            words:{" "}
            <span className="text-gray-600 font-medium tabular-nums">
              {words.toLocaleString()}
            </span>
          </span>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-200/50 p-0.5 rounded-lg border border-gray-200/60">
          <button
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              !isPreview
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              isPreview
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            HTML
          </button>
        </div>
      </div>

      {/* Modals */}
      <ImageModal
        editor={editor}
        isOpen={imageModalOpen}
        onClose={handleCloseImageModal}
      />
      <YoutubeModal
        editor={editor}
        isOpen={youtubeModalOpen}
        onClose={handleCloseYoutubeModal}
      />
    </div>
  );
}

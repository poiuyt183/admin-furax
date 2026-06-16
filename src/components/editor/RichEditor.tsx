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
import LinkModal from "./modals/LinkModal";

import { useState, useCallback, useEffect } from "react";

type EditorMode = "edit" | "preview" | "html";

interface RichEditorProps {
  /** Initial HTML content (uncontrolled) */
  initialContent?: string;
  /** Controlled HTML content — takes precedence over initialContent */
  value?: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  placeholder?: string;
  maxCharacters?: number;
  disabled?: boolean;
  className?: string;
  showModeToggle?: boolean;
}

function normalizeHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>" || trimmed === "<p><br></p>") {
    return "";
  }
  return trimmed;
}

export default function RichEditor({
  initialContent = "",
  value,
  onChange,
  onBlur,
  placeholder = "Start writing something amazing...",
  maxCharacters,
  disabled = false,
  className = "",
  showModeToggle = true,
}: RichEditorProps) {
  const content = value ?? initialContent;

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [mode, setMode] = useState<EditorMode>("edit");

  const editor = useEditor({
    immediatelyRender: false,
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
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    onBlur: ({ editor: ed }) => {
      onBlur?.(ed.getHTML());
    },
  });

  // Sync external content changes (e.g. form reset when editing existing record)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.isFocused) return;

    const incoming = normalizeHtml(content);
    const current = normalizeHtml(editor.getHTML());

    if (incoming !== current) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && mode === "edit");
    }
  }, [disabled, mode, editor]);

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
  const handleOpenLinkModal = useCallback(() => setLinkModalOpen(true), []);
  const handleCloseLinkModal = useCallback(() => setLinkModalOpen(false), []);

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
  const isEditing = mode === "edit" && !disabled;

  return (
    <div
      className={`w-full max-w-[860px] mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-shadow duration-200 focus-within:shadow-md focus-within:border-gray-300 ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}
    >
      {isEditing && (
        <Toolbar
          editor={editor}
          onOpenImageModal={handleOpenImageModal}
          onOpenYoutubeModal={handleOpenYoutubeModal}
          onOpenLinkModal={handleOpenLinkModal}
        />
      )}

      {isEditing && <BubbleMenuBar editor={editor} />}

      {mode === "edit" && (
        <EditorContent editor={editor} className="tiptap-wrapper" />
      )}

      {mode === "preview" && (
        <div
          className="tiptap-wrapper tiptap min-h-[400px] p-8 prose-editor-preview"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered preview of editor HTML
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      )}

      {mode === "html" && (
        <div className="p-6 bg-[#0d1117] text-[#c9d1d9] font-mono text-sm whitespace-pre-wrap break-words min-h-[400px] max-h-[600px] overflow-auto rounded-b-2xl tiptap-html-preview">
          {editor.getHTML()}
        </div>
      )}

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

        {showModeToggle && (
          <div className="flex bg-gray-200/50 p-0.5 rounded-lg border border-gray-200/60">
            {(
              [
                { key: "edit", label: "Editor" },
                { key: "preview", label: "Preview" },
                { key: "html", label: "HTML" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  mode === key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

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
      <LinkModal
        editor={editor}
        isOpen={linkModalOpen}
        onClose={handleCloseLinkModal}
      />
    </div>
  );
}

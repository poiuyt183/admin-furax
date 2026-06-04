"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Unlink,
  ExternalLink,
} from "lucide-react";

interface BubbleMenuBarProps {
  editor: Editor;
}

export default function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const handleSetLink = useCallback(() => {
    if (linkUrl.trim()) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl.trim(), target: "_blank" })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleUnlink = useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor]);

  const toggleLinkInput = useCallback(() => {
    if (showLinkInput) {
      setShowLinkInput(false);
      setLinkUrl("");
    } else {
      const existingHref = editor.getAttributes("link").href;
      setLinkUrl(existingHref || "");
      setShowLinkInput(true);
    }
  }, [showLinkInput, editor]);

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden animate-[fadeIn_150ms_ease-out]"
    >
      {showLinkInput ? (
        <div className="flex items-center gap-1 px-2 py-1.5">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL..."
            className="w-48 px-2.5 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSetLink();
              }
              if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            autoFocus
          />
          <button
            onClick={handleSetLink}
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Apply link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          {editor.isActive("link") && (
            <button
              onClick={handleUnlink}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              title="Remove link"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
              editor.isActive("bold") ? "bg-gray-100 text-blue-600" : ""
            }`}
            title="Bold (Cmd+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
              editor.isActive("italic") ? "bg-gray-100 text-blue-600" : ""
            }`}
            title="Italic (Cmd+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
              editor.isActive("underline") ? "bg-gray-100 text-blue-600" : ""
            }`}
            title="Underline (Cmd+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
              editor.isActive("strike") ? "bg-gray-100 text-blue-600" : ""
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-0.5" />

          <button
            onClick={toggleLinkInput}
            className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
              editor.isActive("link") ? "bg-gray-100 text-blue-600" : ""
            }`}
            title="Insert link"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>
      )}
    </BubbleMenu>
  );
}

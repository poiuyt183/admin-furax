"use client";

import RichEditor from "@/components/editor/RichEditor";
import { useState } from "react";

export default function NewPostPage() {
  const [content, setContent] = useState("");

  return (
    <div className="py-8 px-2">
      <div className="max-w-[860px] mx-auto mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new post using the rich text editor below.
        </p>
      </div>

      <RichEditor
        placeholder="Write your post..."
        onChange={(html) => setContent(html)}
      />

      {content && (
        <div className="max-w-[860px] mx-auto mt-6">
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors">
              HTML Output Preview
            </summary>
            <pre className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 overflow-x-auto max-h-48 overflow-y-auto">
              {content}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

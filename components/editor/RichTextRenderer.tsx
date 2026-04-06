"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { tiptapRendererExtensions } from "./tiptap-renderer-extensions";

export function RichTextRenderer({ content }: { content: JSONContent }) {
  const editor = useEditor({
    extensions: tiptapRendererExtensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "focus:outline-none tiptap-content",
      },
    },
  });

  if (!editor) return null;
  return (
    <div className="tiptap-renderer">
      <EditorContent editor={editor} />
    </div>
  );
}

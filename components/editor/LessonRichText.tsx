"use client";

import * as React from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { tiptapExtensions } from "./tiptap-extensions";

type Props = {
  value: JSONContent;
  onChange?: (json: JSONContent) => void; // if provided => editable
  editable?: boolean; // optional override
};

export function LessonRichText({ value, onChange, editable }: Props) {
  const isEditable = editable ?? Boolean(onChange);

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value,
    editable: isEditable,
    onUpdate: ({ editor }) => {
      if (!isEditable) return;
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none dark:prose-invert focus:outline-none " +
          "prose-headings:scroll-mt-28 " +
          "prose-p:leading-relaxed prose-p:my-4 " +
          "prose-ul:my-4 prose-ol:my-4 prose-li:my-1 " +
          "prose-code:before:content-[''] prose-code:after:content-['']",
      },
    },
  });

  // ✅ keep editor content in sync when you open Edit dialog
  React.useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, JSON.stringify(value)]);

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}

"use client";

import * as React from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { tiptapExtensions } from "./tiptap-extensions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
} from "lucide-react";

type Props = {
  value: JSONContent | null;
  onChange: (json: JSONContent) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value ?? { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none dark:prose-invert focus:outline-none " +
          "prose-headings:scroll-mt-24 prose-p:leading-relaxed " +
          "prose-code:before:content-[''] prose-code:after:content-['']",
      },
    },
  });

  const [link, setLink] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");

  if (!editor) return null;

  const applyLink = () => {
    const url = link.trim();
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLink("");
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl("");
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="rounded-2xl border bg-card/60 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 p-3">
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {"</>"}
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={insertTable}>
          <TableIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Link / Image */}
      <div className="grid gap-2 border-b bg-muted/10 p-3 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https:// link"
            className="h-9"
          />
          <Button size="sm" type="button" variant="outline" onClick={applyLink}>
            Apply
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="h-9"
          />
          <Button size="sm" type="button" variant="outline" onClick={addImage}>
            Add
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="p-5 sm:p-7">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

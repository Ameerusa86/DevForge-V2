"use client";

import * as React from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { tiptapExtensions } from "./tiptap-extensions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Info,
  Lightbulb,
  ChevronDown,
  FileCode,
  PanelTop,
  Minus,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  value: string | JSONContent;
  onChange: (content: string) => void;
};

export function LessonEditor({ value, onChange }: Props) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [link, setLink] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = React.useState(false);
  const [isImagePopoverOpen, setIsImagePopoverOpen] = React.useState(false);
  const [headingLevel, setHeadingLevel] = React.useState<string>("paragraph");
  const [textColor, setTextColor] = React.useState("#000000");

  // Parse value if it's a string
  const initialContent = React.useMemo(() => {
    if (!value) return { type: "doc", content: [] };
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        // If it's HTML or plain text, wrap it
        return {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: value }] },
          ],
        };
      }
    }
    return value;
  }, []);

  const editor = useEditor({
    // @ts-ignore - Version mismatch between extensions but works at runtime
    extensions: tiptapExtensions,
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Store as JSON string
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[400px] " +
          "prose-headings:scroll-mt-24 prose-p:leading-relaxed " +
          "prose-code:before:content-[''] prose-code:after:content-[''] " +
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded " +
          "prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-lg " +
          "prose-img:rounded-lg prose-img:border " +
          "prose-table:border prose-table:border-collapse " +
          "prose-th:border prose-th:bg-muted prose-th:p-2 " +
          "prose-td:border prose-td:p-2 " +
          "prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6",
      },
    },
  });

  // Sync heading level dropdown with editor state
  React.useEffect(() => {
    if (!editor) return;

    const updateHeadingLevel = () => {
      if (editor.isActive("heading", { level: 1 })) {
        setHeadingLevel("1");
      } else if (editor.isActive("heading", { level: 2 })) {
        setHeadingLevel("2");
      } else if (editor.isActive("heading", { level: 3 })) {
        setHeadingLevel("3");
      } else if (editor.isActive("heading", { level: 4 })) {
        setHeadingLevel("4");
      } else if (editor.isActive("heading", { level: 5 })) {
        setHeadingLevel("5");
      } else if (editor.isActive("heading", { level: 6 })) {
        setHeadingLevel("6");
      } else {
        setHeadingLevel("paragraph");
      }
    };

    // Update on selection change
    editor.on("selectionUpdate", updateHeadingLevel);
    editor.on("update", updateHeadingLevel);

    // Initial update
    updateHeadingLevel();

    return () => {
      editor.off("selectionUpdate", updateHeadingLevel);
      editor.off("update", updateHeadingLevel);
    };
  }, [editor]);

  if (!editor) return null;

  const applyLink = () => {
    const url = link.trim();
    if (!url) return;
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">Link</a>`).run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setLink("");
    setIsLinkPopoverOpen(false);
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl("");
    setIsImagePopoverOpen(false);
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const insertInfoPanel = (type: string) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "infoPanel",
        attrs: { type },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `This is a ${type} panel. Edit this text.`,
              },
            ],
          },
        ],
      })
      .run();
  };

  const insertCallout = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "callout",
        attrs: { emoji: "💡" },
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Add your important note here..." },
            ],
          },
        ],
      })
      .run();
  };

  const insertExpandSection = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "expandSection",
        attrs: { title: "Click to expand..." },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hidden content goes here..." }],
          },
        ],
      })
      .run();
  };

  const applyHeading = (level: string) => {
    setHeadingLevel(level);
    if (level === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .setHeading({ level: parseInt(level) as 1 | 2 | 3 | 4 | 5 | 6 })
        .run();
    }
  };

  const applyTextColor = (color: string) => {
    setTextColor(color);
    editor.chain().focus().setColor(color).run();
  };

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card overflow-hidden flex flex-col h-full shadow-sm">
        {/* Main Toolbar - Confluence Style */}
        <div className="flex flex-wrap items-center gap-1.5 border-b bg-gradient-to-b from-muted/30 to-muted/10 p-2.5">
          {/* Text Style Dropdown */}
          <Select value={headingLevel} onValueChange={applyHeading}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="1">Heading 1</SelectItem>
              <SelectItem value="2">Heading 2</SelectItem>
              <SelectItem value="3">Heading 3</SelectItem>
              <SelectItem value="4">Heading 4</SelectItem>
              <SelectItem value="5">Heading 5</SelectItem>
              <SelectItem value="6">Heading 6</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("bold") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="h-9 w-9 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("italic") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="h-9 w-9 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("underline") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className="h-9 w-9 p-0"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline (Ctrl+U)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("strike") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className="h-9 w-9 p-0"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-9 w-9 p-0"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => applyTextColor(e.target.value)}
                    className="h-9 w-full rounded border cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {[
                    "#000000",
                    "#374151",
                    "#DC2626",
                    "#EA580C",
                    "#CA8A04",
                    "#65A30D",
                    "#059669",
                    "#0891B2",
                    "#2563EB",
                    "#7C3AED",
                    "#C026D3",
                    "#DB2777",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => applyTextColor(color)}
                      className="h-8 w-8 rounded border-2 hover:border-primary"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("code") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleCode().run()}
                className="h-9 w-9 p-0"
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inline Code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("highlight") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className="h-9 w-9 p-0"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Highlight</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("bulletList") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="h-9 w-9 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("orderedList") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="h-9 w-9 p-0"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("taskList") ? "default" : "ghost"}
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className="h-9 w-9 p-0"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Task List</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Alignment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={
                  editor.isActive({ textAlign: "left" }) ? "default" : "ghost"
                }
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
                className="h-9 w-9 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={
                  editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
                }
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                className="h-9 w-9 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={
                  editor.isActive({ textAlign: "right" }) ? "default" : "ghost"
                }
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
                className="h-9 w-9 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Insert Elements - Confluence Style */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-9 gap-1"
              >
                <PanelTop className="h-4 w-4" />
                <span className="text-xs">Insert</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Content Blocks</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => insertInfoPanel("info")}>
                <Info className="mr-2 h-4 w-4 text-blue-500" />
                Info Panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertInfoPanel("success")}>
                <Info className="mr-2 h-4 w-4 text-green-500" />
                Success Panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertInfoPanel("warning")}>
                <Info className="mr-2 h-4 w-4 text-amber-500" />
                Warning Panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertInfoPanel("error")}>
                <Info className="mr-2 h-4 w-4 text-red-500" />
                Error Panel
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={insertCallout}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Callout Box
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertExpandSection}>
                <ChevronDown className="mr-2 h-4 w-4" />
                Expand Section
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Media</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <FileCode className="mr-2 h-4 w-4" />
                Code Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertTable}>
                <TableIcon className="mr-2 h-4 w-4" />
                Table
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="mr-2 h-4 w-4" />
                Quote
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="mr-2 h-4 w-4" />
                Horizontal Rule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Link */}
          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant={editor.isActive("link") ? "default" : "ghost"}
                className="h-9 w-9 p-0"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label htmlFor="link-url">Link URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyLink()}
                    placeholder="https://example.com"
                    className="h-9"
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={applyLink}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select text first, then add a link
                </p>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Popover
            open={isImagePopoverOpen}
            onOpenChange={setIsImagePopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-9 w-9 p-0"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addImage()}
                    placeholder="https://example.com/image.jpg"
                    className="h-9"
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={addImage}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-9 w-9 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-9 w-9 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* Editor Content */}
        <div
          ref={editorRef}
          className="flex-1 overflow-y-auto p-6 sm:p-10 bg-background"
          onClick={() => editor.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </TooltipProvider>
  );
}

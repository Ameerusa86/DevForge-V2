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
import { cn } from "@/lib/utils";

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
  }, [value]);

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[400px] " +
          "prose-headings:scroll-mt-24 prose-p:leading-relaxed " +
          "prose-code:before:content-[''] prose-code:after:content-[''] " +
          "prose-code:bg-muted/65 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[#ff6636] " +
          "prose-pre:bg-muted/40 prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-xl " +
          "prose-img:rounded-xl prose-img:border " +
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

    editor.on("selectionUpdate", updateHeadingLevel);
    editor.on("update", updateHeadingLevel);

    updateHeadingLevel();

    return () => {
      editor.off("selectionUpdate", updateHeadingLevel);
      editor.off("update", updateHeadingLevel);
    };
  }, [editor]);

  // Sync external value resets (e.g. form reset or next lesson selection)
  React.useEffect(() => {
    if (!editor) return;

    let parsedValue: any = value;
    if (typeof value === "string") {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }
    }

    const currentJSONString = JSON.stringify(editor.getJSON());
    const targetJSONString = typeof value === "string" ? value : JSON.stringify(value);

    if (currentJSONString !== targetJSONString) {
      editor.commands.setContent(parsedValue);
    }
  }, [value, editor]);

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
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full shadow-sm focus-within:border-[#ff6636]/50 transition-all duration-200">
        
        {/* Sleek unified Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/20 p-2">
          
          {/* Style Selector */}
          <Select value={headingLevel} onValueChange={applyHeading}>
            <SelectTrigger className="h-8 w-[125px] rounded-lg border-border text-[11px] font-bold focus:ring-0">
              <SelectValue placeholder="Text Style" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="paragraph" className="text-xs font-semibold">Paragraph</SelectItem>
              <SelectItem value="1" className="text-xs font-semibold">Heading 1</SelectItem>
              <SelectItem value="2" className="text-xs font-semibold">Heading 2</SelectItem>
              <SelectItem value="3" className="text-xs font-semibold">Heading 3</SelectItem>
              <SelectItem value="4" className="text-xs font-semibold">Heading 4</SelectItem>
              <SelectItem value="5" className="text-xs font-semibold">Heading 5</SelectItem>
              <SelectItem value="6" className="text-xs font-semibold">Heading 6</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

          {/* Formatting Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("bold") 
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]" 
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("italic")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("underline")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("strike")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

          {/* Palette popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 rounded-xl border-border bg-card p-3 shadow-md">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Text Color</Label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => applyTextColor(e.target.value)}
                    className="h-7 w-full rounded border border-border cursor-pointer bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-6 gap-1.5 mt-1.5">
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
                      className="h-6 w-6 rounded-md border border-border/80 hover:scale-105 transition-transform"
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
                variant="ghost"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("code")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("highlight")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Highlight Selection</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

          {/* Lists */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("bulletList")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("orderedList")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("taskList")
                    ? "bg-[#ff6636]/10 text-[#ff6636] hover:bg-[#ff6636]/15 hover:text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Task List</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

          {/* Alignment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive({ textAlign: "left" })
                    ? "bg-[#ff6636]/10 text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive({ textAlign: "center" })
                    ? "bg-[#ff6636]/10 text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant="ghost"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive({ textAlign: "right" })
                    ? "bg-[#ff6636]/10 text-[#ff6636]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

          {/* Insert Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-8 gap-1 text-muted-foreground hover:text-foreground px-2 rounded-lg"
              >
                <PanelTop className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Insert</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl border-border bg-popover">
              <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3.5 py-2">Blocks</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => insertInfoPanel("info")} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <Info className="h-4 w-4 text-blue-500" /> Info Panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertInfoPanel("success")} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <Info className="h-4 w-4 text-green-500" /> Success Panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertInfoPanel("warning")} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <Info className="h-4 w-4 text-amber-500" /> Warning Panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertInfoPanel("error")} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <Info className="h-4 w-4 text-red-500" /> Error Panel
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={insertCallout} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" /> Callout Box
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertExpandSection} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <ChevronDown className="h-4 w-4" /> Expand Section
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <FileCode className="h-4 w-4" /> Code Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertTable} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <TableIcon className="h-4 w-4" /> Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <Quote className="h-4 w-4" /> Quote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                <Minus className="h-4 w-4" /> Horizontal Rule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

          {/* Link */}
          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all",
                  editor.isActive("link") ? "bg-[#ff6636]/10 text-[#ff6636]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-xl border-border bg-card p-3 shadow-md">
              <div className="space-y-2">
                <Label htmlFor="link-url" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Link URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyLink()}
                    placeholder="https://example.com"
                    className="h-9 rounded-xl text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={applyLink}
                    className="shrink-0 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image URL */}
          <Popover
            open={isImagePopoverOpen}
            onOpenChange={setIsImagePopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-xl border-border bg-card p-3 shadow-md">
              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addImage()}
                    placeholder="https://example.com/cover.jpg"
                    className="h-9 rounded-xl text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={addImage}
                    className="shrink-0 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
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
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* Editor Writing Area */}
        <div
          ref={editorRef}
          className="flex-1 overflow-y-auto p-6 sm:p-8 bg-card text-foreground cursor-text"
          onClick={() => editor.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </TooltipProvider>
  );
}

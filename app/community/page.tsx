"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  Search,
  MessageCircle,
  ThumbsUp,
  Plus,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  name: string;
  image?: string | null;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  tag: string;
  upvotes: number;
  createdAt: string;
  author: Author;
  _count: {
    comments: number;
  };
  comments?: Comment[];
}

const communityTags = [
  "All",
  "React",
  "Next.js",
  "Backend",
  "System Design",
  "Showcase",
  "Career",
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Post Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("React");
  const [submitting, setSubmitting] = useState(false);

  // Expanded replies state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTag && selectedTag !== "All") params.set("tag", selectedTag);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/community/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch community posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedTag, searchQuery]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please fill in both title and content.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          tag: newTag,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please log in to start a discussion.");
          return;
        }
        throw new Error("Failed to create post");
      }

      const created = await res.json();
      setPosts((prev) => [created, ...prev]);
      setIsDialogOpen(false);
      setNewTitle("");
      setNewContent("");
      toast.success("Discussion started! 🚀");
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish your discussion.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST",
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please log in to upvote.");
          return;
        }
        throw new Error("Vote failed");
      }

      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, upvotes: data.upvotes } : p))
      );
      toast.success(data.voted ? "Upvoted!" : "Vote removed");
    } catch (err) {
      console.error(err);
      toast.error("Could not register vote.");
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;

    setCommenting(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to reply.");
          return;
        }
        throw new Error("Failed to post comment");
      }

      const newComment = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                _count: { comments: p._count.comments + 1 },
                comments: [newComment, ...(p.comments || [])],
              }
            : p
        )
      );
      setCommentText("");
      toast.success("Reply added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post reply.");
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/community" />

      <main>
        {/* ── Hero section ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-16 lg:py-20">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <Users className="size-3.5" /> DevForge Community
                </span>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Build with peers,<br />
                  <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                    learn in production.
                  </span>
                </h1>
                <p className="text-base text-muted-foreground font-semibold leading-relaxed">
                  Ask architecture questions, discuss courses, share real code, and connect with developers worldwide.
                </p>
              </div>

              {/* Start Discussion Dialog */}
              <div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-extrabold text-xs px-6 py-5 shadow-lg shadow-[#ff6636]/20 gap-2 uppercase tracking-wider">
                      <Plus className="size-4" /> Start Discussion
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[540px] rounded-2xl bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">New Discussion</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Share a project, ask an architecture question, or start a discussion.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreatePost} className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Topic / Category
                        </label>
                        <select
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:border-[#ff6636]"
                        >
                          {communityTags.filter((t) => t !== "All").map((tag) => (
                            <option key={tag} value={tag}>
                              {tag}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Discussion Title
                        </label>
                        <Input
                          placeholder="e.g. Best patterns for Server Actions in Next.js 16"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="h-10 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Details & Context
                        </label>
                        <Textarea
                          placeholder="Provide enough context or code snippets so others can help or discuss..."
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          rows={5}
                          className="rounded-xl text-xs font-medium"
                          required
                        />
                      </div>

                      <DialogFooter className="pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsDialogOpen(false)}
                          className="rounded-xl text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs"
                        >
                          {submitting ? "Publishing..." : "Post Discussion"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {communityTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border",
                      selectedTag === tag
                        ? "bg-[#ff6636] text-white border-[#ff6636] shadow-sm"
                        : "bg-card text-muted-foreground hover:text-foreground border-border"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 rounded-xl text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content grid ──────────────────────────────────────── */}
        <section className="px-4 py-12 sm:px-6 lg:px-8 bg-background">
          <div className="mx-auto max-w-[1320px]">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="size-8 rounded-full border-2 border-[#ff6636] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground font-semibold">Loading discussions from database...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center max-w-lg mx-auto space-y-4">
                <MessageSquare className="size-10 text-muted-foreground mx-auto opacity-50" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">No discussions found</h3>
                  <p className="text-xs text-muted-foreground">
                    Be the first to start a conversation in this category!
                  </p>
                </div>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="rounded-xl bg-[#ff6636] text-white font-bold text-xs"
                >
                  Start Discussion
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {posts.map((post) => {
                  const isExpanded = expandedPostId === post.id;
                  return (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-[#ff6636]/40 transition-all space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 items-center justify-center rounded-full bg-[#ff6636]/15 text-[#ff6636] font-extrabold text-xs">
                            {post.author.name?.charAt(0) || "U"}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-foreground">
                              {post.author.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {new Date(post.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <span className="rounded-full bg-[#ff6636]/10 text-[#ff6636] border border-[#ff6636]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                          {post.tag}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-foreground hover:text-[#ff6636] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleVote(post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:border-[#ff6636] text-muted-foreground hover:text-foreground font-bold text-xs transition-colors"
                          >
                            <ThumbsUp className="size-3.5 text-[#ff6636]" />
                            <span>{post.upvotes}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPostId(isExpanded ? null : post.id)
                            }
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors"
                          >
                            <MessageCircle className="size-3.5 text-[#ff6636]" />
                            <span>{post._count.comments} replies</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="text-[11px] font-bold text-[#ff6636] hover:underline"
                        >
                          {isExpanded ? "Hide Replies" : "Reply / View"}
                        </button>
                      </div>

                      {/* Expanded Comments Thread */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4 bg-muted/20 p-4 rounded-xl">
                          <div className="space-y-3">
                            {(post.comments || []).length > 0 ? (
                              (post.comments || []).map((c) => (
                                <div
                                  key={c.id}
                                  className="rounded-xl border border-border/60 bg-background p-3.5 text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-foreground">
                                      {c.author.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {new Date(c.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {c.content}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic">
                                No replies yet. Start the conversation below!
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Write a constructive reply..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="h-9 text-xs rounded-xl"
                            />
                            <Button
                              onClick={() => handleAddComment(post.id)}
                              disabled={commenting}
                              size="sm"
                              className="rounded-xl bg-[#ff6636] text-white font-bold text-xs px-4 shrink-0"
                            >
                              <Send className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

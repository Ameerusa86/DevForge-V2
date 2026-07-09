"use client";

import { useState, useRef, useEffect } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Search, CheckCheck, MessageSquarePlus, UserCheck, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "student" | "admin";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  user: string;
  email: string;
  lastMessage: string;
  time: string;
  unread: number;
  active: boolean;
  avatarFallback: string;
}

export default function MessagesPage() {
  // Conversation List State
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "c-1",
      user: "Sarah Johnson",
      email: "sarah.j@devforge.com",
      lastMessage: "Thank you for the help! I succeeded with the API route.",
      time: "5m ago",
      unread: 2,
      active: true,
      avatarFallback: "SJ",
    },
    {
      id: "c-2",
      user: "Michael Chen",
      email: "m.chen@devforge.com",
      lastMessage: "Can you review my course submission for unit 4?",
      time: "1h ago",
      unread: 0,
      active: true,
      avatarFallback: "MC",
    },
    {
      id: "c-3",
      user: "Emma Wilson",
      email: "emma.w@devforge.com",
      lastMessage: "I have a question about the Enterprise pricing plan.",
      time: "3h ago",
      unread: 1,
      active: false,
      avatarFallback: "EW",
    },
    {
      id: "c-4",
      user: "Ethan Hunt",
      email: "ethan@devforge.com",
      lastMessage: "Is there a downloadable blueprint for ASP.NET?",
      time: "1d ago",
      unread: 0,
      active: false,
      avatarFallback: "EH",
    },
  ]);

  // Selected Conversation ID
  const [selectedConvId, setSelectedConvId] = useState<string>("c-1");
  
  // Search query filter
  const [searchQuery, setSearchQuery] = useState("");

  // Input message state
  const [messageInput, setMessageInput] = useState("");

  // Map of conversation histories
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    "c-1": [
      {
        id: "m1-1",
        sender: "student",
        text: "Hi! I'm having trouble accessing the course materials for the React Bootcamp.",
        time: "10:30 AM",
      },
      {
        id: "m1-2",
        sender: "admin",
        text: "Hi Sarah! I can certainly check that. Which module is giving you the access issue?",
        time: "10:32 AM",
      },
      {
        id: "m1-3",
        sender: "student",
        text: "It is the Next.js App Router sub-module. The video player shows a loading spinner.",
        time: "10:33 AM",
      },
      {
        id: "m1-4",
        sender: "admin",
        text: "Got it. I've cleared the session locks on your subscription. Try refreshing the browser tab now.",
        time: "10:35 AM",
      },
      {
        id: "m1-5",
        sender: "student",
        text: "Thank you for the help! I succeeded with the API route.",
        time: "10:37 AM",
      },
    ],
    "c-2": [
      {
        id: "m2-1",
        sender: "student",
        text: "Hi instructor! I completed the final project for CSS layout module.",
        time: "Yesterday",
      },
      {
        id: "m2-2",
        sender: "admin",
        text: "Excellent! I'll pull up the code on GitHub and review it today.",
        time: "Yesterday",
      },
      {
        id: "m2-3",
        sender: "student",
        text: "Can you review my course submission for unit 4?",
        time: "1h ago",
      },
    ],
    "c-3": [
      {
        id: "m3-1",
        sender: "student",
        text: "Hello! Our business team wants to enroll 10 developers.",
        time: "2h ago",
      },
      {
        id: "m3-2",
        sender: "student",
        text: "I have a question about the Enterprise pricing plan.",
        time: "1h ago",
      },
    ],
    "c-4": [
      {
        id: "m4-1",
        sender: "admin",
        text: "Hi Ethan, let me know if you finished the C# modules.",
        time: "2d ago",
      },
      {
        id: "m4-2",
        sender: "student",
        text: "Is there a downloadable blueprint for ASP.NET?",
        time: "1d ago",
      },
    ],
  });

  // Scroll to bottom helper
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesMap, selectedConvId]);

  // Mark selected conversation as read
  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, unread: 0 } : c))
    );
  }, [selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const activeMessages = messagesMap[selectedConvId] || [];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "admin",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    // Add message to state history
    setMessagesMap((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMessage],
    }));

    // Update conversation lastMessage text
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? {
              ...c,
              lastMessage: messageInput.trim(),
              time: "Just now",
            }
          : c
      )
    );

    setMessageInput("");

    // Trigger mock response after 1.5s
    setTimeout(() => {
      const responses = [
        "Got it! Thanks for checking on this.",
        "Perfect, that makes absolute sense. I'll test it out now.",
        "Okay, I will review the changes and submit the next assignment.",
        "Understood, thank you for the speedy response!",
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      
      const mockReply: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "student",
        text: randomReply,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [selectedConvId]: [...(prev[selectedConvId] || []), mockReply],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                lastMessage: randomReply,
                time: "Just now",
              }
            : c
        )
      );

      toast.info(`New message from ${activeConv.user}`);
    }, 1500);
  };

  const filteredConversations = conversations.filter((c) =>
    c.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Learner Support & Communications"
        title="Inbox"
        description="Interact directly with active developers, review submissions, and manage support tickets."
      />

      {/* Messages Interface Layout */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6 items-start">
        
        {/* Left Side: Conversations List */}
        <Card className="lg:col-span-1 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-[600px]">
          <CardHeader className="border-b border-border/50 p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <UserCheck className="size-4 text-[#ff6636]" />
                Direct Messages
              </CardTitle>
              <button
                onClick={() => toast.success("Create new message thread")}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="New Chat"
              >
                <MessageSquarePlus className="size-4" />
              </button>
            </div>
            
            {/* Search messages */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search students, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-2 bg-muted/5">
            <div className="space-y-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedConvId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-150 select-none",
                        isSelected
                          ? "border-[#ff6636]/40 bg-[#ff6636]/5"
                          : "border-transparent hover:bg-muted/40"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="size-9 border border-border/80">
                          <AvatarFallback className={cn("bg-muted text-xs font-black text-foreground", isSelected && "bg-[#ff6636]/10 text-[#ff6636]")}>
                            {conv.avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                        {/* Status light */}
                        <span className={cn(
                          "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card",
                          conv.active ? "bg-emerald-500" : "bg-muted-foreground/40"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-bold text-foreground truncate">{conv.user}</p>
                          <span className="text-[9px] font-semibold text-muted-foreground/75 whitespace-nowrap">{conv.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {conv.unread > 0 && (
                        <Badge
                          variant="destructive"
                          className="size-5 p-0 flex items-center justify-center text-[9px] font-black rounded-full shrink-0 bg-[#ff6636] hover:bg-[#ff6636] text-white"
                        >
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
                  No active chats found.
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right Side: Active Message Thread Area */}
        <Card className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Header */}
          <CardHeader className="border-b border-border/50 p-4 shrink-0 flex flex-row items-center justify-between bg-[#ff6636]/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="size-10 border border-border/60">
                  <AvatarFallback className="bg-[#ff6636]/10 text-xs font-black text-[#ff6636]">
                    {activeConv.avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card",
                  activeConv.active ? "bg-emerald-500" : "bg-muted-foreground/40"
                )} />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground">{activeConv.user}</CardTitle>
                <p className="text-[10px] font-semibold text-muted-foreground">
                  {activeConv.active ? "Active now" : "Offline"} • {activeConv.email}
                </p>
              </div>
            </div>
            
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground gap-1 flex items-center bg-card">
              <CheckCheck className="size-3 text-emerald-500" />
              verified account
            </Badge>
          </CardHeader>

          {/* Messages content area */}
          <ScrollArea className="flex-1 p-4 bg-muted/5">
            <div className="space-y-4">
              
              <div className="flex justify-center my-2">
                <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border border-border bg-card px-2.5 py-0.5 rounded-full">
                  Secure Workspace Conversation
                </span>
              </div>

              {activeMessages.map((msg) => {
                const isAdmin = msg.sender === "admin";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2 max-w-[75%]",
                      isAdmin ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {!isAdmin && (
                      <Avatar className="size-7 border border-border/80 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-muted text-[8px] font-black">
                          {activeConv.avatarFallback}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "rounded-2xl p-3 text-xs font-medium leading-relaxed shadow-sm",
                          isAdmin
                            ? "bg-[#ff6636] text-white rounded-tr-none"
                            : "bg-card border border-border/80 text-foreground rounded-tl-none"
                        )}
                      >
                        <p>{msg.text}</p>
                      </div>
                      <p className={cn("text-[8px] font-bold text-muted-foreground/80 leading-none", isAdmin && "text-right")}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Message Input Control Box */}
          <form onSubmit={handleSendMessage} className="border-t border-border/50 p-4 shrink-0 bg-background/50 flex gap-2">
            <Input
              type="text"
              placeholder={`Send message to ${activeConv.user}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 h-10 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
            />
            <button
              type="submit"
              className="flex size-10 items-center justify-center rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white transition-colors shadow-md shadow-[#ff6636]/10 shrink-0"
              title="Send message"
            >
              <Send className="size-4" />
            </button>
          </form>
        </Card>

      </div>
    </AdminPage>
  );
}

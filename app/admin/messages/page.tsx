"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Search, CheckCheck, UserCheck } from "lucide-react";
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
        if (data.length > 0 && !selectedConvId) {
          setSelectedConvId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedConvId]);

  const fetchThread = useCallback(async (convId: string) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/admin/messages/${convId}`);
      if (res.ok) {
        const msgs: Message[] = await res.json();
        setMessagesMap((prev) => ({ ...prev, [convId]: msgs }));

        // Mark as read in DB and locally
        await fetch(`/api/admin/messages/${convId}`, { method: "PATCH" });
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c))
        );
      }
    } catch (err) {
      console.error("Failed to load thread:", err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConvId) {
      fetchThread(selectedConvId);
    }
  }, [selectedConvId, fetchThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messagesMap, selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);
  const activeMessages = selectedConvId ? messagesMap[selectedConvId] || [] : [];

  const handleSelectConv = (convId: string) => {
    setSelectedConvId(convId);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;

    const textToSend = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/admin/messages/${selectedConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });

      if (!res.ok) throw new Error("Failed to send reply");

      const newMsg: Message = await res.json();

      setMessagesMap((prev) => ({
        ...prev,
        [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? { ...c, lastMessage: textToSend, time: newMsg.time }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Student Support & Direct Messages"
        description="Communicate with enrolled students, provide technical assistance, and review feedback in real time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] max-h-[80vh] items-stretch">
        {/* Left Column: Conversations List */}
        <Card className="lg:col-span-4 flex flex-col h-full rounded-2xl border-border/60 bg-card overflow-hidden">
          <CardHeader className="p-4 border-b border-border/50 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                Conversations
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] font-bold">
                  {conversations.length}
                </Badge>
              </CardTitle>
            </div>

            <div className="relative">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs rounded-xl bg-background border-border/70"
              />
            </div>
          </CardHeader>

          {/* Conversation List Items */}
          <ScrollArea className="flex-1 overflow-y-auto divide-y divide-border/30">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground font-semibold">
                Loading conversations...
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={cn(
                    "w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-muted/40",
                    selectedConvId === conv.id
                      ? "bg-[#ff6636]/10 border-l-4 border-[#ff6636]"
                      : "bg-transparent"
                  )}
                >
                  <Avatar className="size-9 shrink-0 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-black text-foreground">
                      {conv.avatarFallback}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-foreground truncate">{conv.user}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate leading-snug">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unread > 0 && (
                    <Badge className="size-5 p-0 rounded-full flex items-center justify-center bg-[#ff6636] text-white text-[10px] font-bold shrink-0">
                      {conv.unread}
                    </Badge>
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active conversations found.
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Column: Chat Window */}
        <Card className="lg:col-span-8 flex flex-col h-full rounded-2xl border-border/60 bg-card overflow-hidden">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-bold">
                      {activeConv.avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground">{activeConv.user}</h4>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-bold uppercase text-emerald-600 border-emerald-500/30">
                        Student
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{activeConv.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <UserCheck className="size-3.5 text-emerald-500" />
                  <span>Enrolled Student</span>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/5">
                {activeMessages.length > 0 ? (
                  activeMessages.map((msg) => {
                    const isAdmin = msg.sender === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex flex-col max-w-[80%]", isAdmin ? "ml-auto items-end" : "mr-auto items-start")}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-xs",
                            isAdmin
                              ? "bg-[#ff6636] text-white rounded-br-xs"
                              : "bg-muted text-foreground border border-border/60 rounded-bl-xs"
                          )}
                        >
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1 px-1">
                          {msg.time}
                          {isAdmin && <CheckCheck className="size-3 text-[#ff6636]" />}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">No message history</p>
                    <p className="text-[11px]">Send a reply below to initiate conversation with {activeConv.user}.</p>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border/50 bg-card flex items-center gap-2">
                <Input
                  placeholder={`Reply to ${activeConv.user}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-background border-border/70"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="size-10 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
              <p className="font-semibold text-foreground text-sm mb-1">Select a conversation</p>
              <p className="max-w-xs text-[11px]">Choose a student from the sidebar to view their message thread or send a direct reply.</p>
            </div>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}

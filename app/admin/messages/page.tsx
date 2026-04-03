"use client";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MessagesPage() {
  const conversations = [
    {
      id: 1,
      user: "Sarah Johnson",
      lastMessage: "Thank you for the help!",
      time: "5m ago",
      unread: 2,
      avatar: "",
    },
    {
      id: 2,
      user: "Michael Chen",
      lastMessage: "Can you review my course submission?",
      time: "1h ago",
      unread: 0,
      avatar: "",
    },
    {
      id: 3,
      user: "Emma Wilson",
      lastMessage: "I have a question about pricing",
      time: "3h ago",
      unread: 1,
      avatar: "",
    },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Communicate with learners and instructors without leaving the admin workspace."
      />

      {/* Messages Interface */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b border-border"
                >
                  <Avatar>
                    <AvatarImage src={conv.avatar} />
                    <AvatarFallback>
                      {conv.user
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{conv.user}</p>
                      {conv.unread > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.time}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Sarah Johnson</CardTitle>
                <p className="text-sm text-muted-foreground">Active now</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] mb-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">SJ</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                    <p className="text-sm">
                      Hi! I&rsquo;m having trouble accessing the course
                      materials.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      10:30 AM
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[70%]">
                    <p className="text-sm">
                      Hi Sarah! Let me help you with that. Can you tell me which
                      course?
                    </p>
                    <p className="text-xs text-primary-foreground/70 mt-1">
                      10:32 AM
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">SJ</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                    <p className="text-sm">
                      It&rsquo;s the Web Development Bootcamp course.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      10:33 AM
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input placeholder="Type your message..." />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}

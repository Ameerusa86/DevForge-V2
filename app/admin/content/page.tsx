"use client";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Image, Video, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ContentPage() {
  const contentItems = [
    {
      id: 1,
      title: "Introduction to React Hooks",
      type: "video",
      size: "245 MB",
      duration: "24:32",
      status: "published",
    },
    {
      id: 2,
      title: "Course Banner Image",
      type: "image",
      size: "2.4 MB",
      duration: "-",
      status: "published",
    },
    {
      id: 3,
      title: "Module 3 - Resources PDF",
      type: "document",
      size: "1.8 MB",
      duration: "-",
      status: "draft",
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "image":
        return Image;
      case "document":
        return File;
      default:
        return FileText;
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Asset management"
        title="Content Library"
        description="Review and organize the media, documents, and supporting assets used across your learning experience."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Content
          </Button>
        }
      />

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contentItems.map((item) => {
          const Icon = getIcon(item.type);
          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant={
                      item.status === "published" ? "default" : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Size: {item.size}</p>
                  {item.duration !== "-" && <p>Duration: {item.duration}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminPage>
  );
}

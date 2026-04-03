"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
} from "lucide-react";

interface ContactSettings {
  id: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  businessHoursLine1: string;
  businessHoursLine2: string;
  responseTime: string;
  heroTitle: string;
  heroSubtitle: string;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export default function AdminContactPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>({
    id: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    businessHoursLine1: "",
    businessHoursLine2: "",
    responseTime: "",
    heroTitle: "",
    heroSubtitle: "",
  });
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/admin/contact");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data.settings);
        setFaqs(data.data.faqs);
      } else {
        toast.error("Failed to load contact settings");
      }
    } catch (error) {
      toast.error("Failed to load contact settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Contact settings updated successfully");
        setSettings(data.data);
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    try {
      const response = await fetch("/api/admin/contact/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newFaq,
          order: faqs.length,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFaqs([...faqs, data.data]);
        setNewFaq({ question: "", answer: "" });
        toast.success("FAQ added successfully");
      } else {
        toast.error("Failed to add FAQ");
      }
    } catch (error) {
      toast.error("Failed to add FAQ");
    }
  };

  const handleUpdateFaq = async (faq: Faq) => {
    try {
      const response = await fetch("/api/admin/contact/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faq),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("FAQ updated successfully");
      } else {
        toast.error("Failed to update FAQ");
      }
    } catch (error) {
      toast.error("Failed to update FAQ");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const response = await fetch(`/api/admin/contact/faq?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setFaqs(faqs.filter((f) => f.id !== id));
        toast.success("FAQ deleted successfully");
      } else {
        toast.error("Failed to delete FAQ");
      }
    } catch (error) {
      toast.error("Failed to delete FAQ");
    }
  };

  const handleToggleFaqActive = async (faq: Faq) => {
    const updated = { ...faq, isActive: !faq.isActive };
    setFaqs(faqs.map((f) => (f.id === faq.id ? updated : f)));
    await handleUpdateFaq(updated);
  };

  const handleMoveFaq = async (index: number, direction: "up" | "down") => {
    const newFaqs = [...faqs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFaqs.length) return;

    // Swap positions
    [newFaqs[index], newFaqs[targetIndex]] = [
      newFaqs[targetIndex],
      newFaqs[index],
    ];

    // Update order values
    newFaqs.forEach((faq, idx) => {
      faq.order = idx;
    });

    setFaqs(newFaqs);

    // Update both FAQs in the database
    await handleUpdateFaq(newFaqs[index]);
    await handleUpdateFaq(newFaqs[targetIndex]);
  };

  const handleUpdateFaqField = (
    id: string,
    field: keyof Faq,
    value: string,
  ) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading contact settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Page Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage contact information and FAQs displayed on the public contact
            page
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Contact Information</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Main title and subtitle displayed at the top of the contact page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroTitle">Hero Title</Label>
                <Input
                  id="heroTitle"
                  value={settings.heroTitle}
                  onChange={(e) =>
                    setSettings({ ...settings, heroTitle: e.target.value })
                  }
                  placeholder="Contact Us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                <Textarea
                  id="heroSubtitle"
                  value={settings.heroSubtitle}
                  onChange={(e) =>
                    setSettings({ ...settings, heroSubtitle: e.target.value })
                  }
                  placeholder="Have questions? We'd love to hear from you..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                placeholder="support@devforge.com"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                placeholder="+1 (234) 567-890"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Physical Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={settings.addressLine1}
                  onChange={(e) =>
                    setSettings({ ...settings, addressLine1: e.target.value })
                  }
                  placeholder="123 Learning Street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={settings.addressLine2}
                  onChange={(e) =>
                    setSettings({ ...settings, addressLine2: e.target.value })
                  }
                  placeholder="Tech City, TC 12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine3">Address Line 3</Label>
                <Input
                  id="addressLine3"
                  value={settings.addressLine3}
                  onChange={(e) =>
                    setSettings({ ...settings, addressLine3: e.target.value })
                  }
                  placeholder="United States"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessHoursLine1">
                  Business Hours Line 1
                </Label>
                <Input
                  id="businessHoursLine1"
                  value={settings.businessHoursLine1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      businessHoursLine1: e.target.value,
                    })
                  }
                  placeholder="Monday - Friday"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessHoursLine2">
                  Business Hours Line 2
                </Label>
                <Input
                  id="businessHoursLine2"
                  value={settings.businessHoursLine2}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      businessHoursLine2: e.target.value,
                    })
                  }
                  placeholder="9:00 AM - 6:00 PM EST"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Information</CardTitle>
              <CardDescription>
                Message shown to users about expected response time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="responseTime">Response Time Text</Label>
              <Textarea
                id="responseTime"
                value={settings.responseTime}
                onChange={(e) =>
                  setSettings({ ...settings, responseTime: e.target.value })
                }
                placeholder="We typically respond within 24 hours..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              size="lg"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          {/* Add New FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New FAQ
              </CardTitle>
              <CardDescription>
                Create a new frequently asked question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newQuestion">Question</Label>
                <Input
                  id="newQuestion"
                  value={newFaq.question}
                  onChange={(e) =>
                    setNewFaq({ ...newFaq, question: e.target.value })
                  }
                  placeholder="How long does it take to get a response?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newAnswer">Answer</Label>
                <Textarea
                  id="newAnswer"
                  value={newFaq.answer}
                  onChange={(e) =>
                    setNewFaq({ ...newFaq, answer: e.target.value })
                  }
                  placeholder="We typically respond to all inquiries within 24 hours..."
                  rows={3}
                />
              </div>
              <Button onClick={handleAddFaq} className="gap-2">
                <Plus className="h-4 w-4" />
                Add FAQ
              </Button>
            </CardContent>
          </Card>

          {/* Existing FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Manage FAQs</CardTitle>
              <CardDescription>
                Edit, reorder, or delete existing FAQs. Inactive FAQs won&apos;t be
                shown on the public page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No FAQs yet. Add your first FAQ above.
                </p>
              ) : (
                faqs.map((faq, index) => (
                  <Card
                    key={faq.id}
                    className={!faq.isActive ? "opacity-60" : ""}
                  >
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) =>
                                handleUpdateFaqField(
                                  faq.id,
                                  "question",
                                  e.target.value,
                                )
                              }
                              onBlur={() => handleUpdateFaq(faq)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) =>
                                handleUpdateFaqField(
                                  faq.id,
                                  "answer",
                                  e.target.value,
                                )
                              }
                              onBlur={() => handleUpdateFaq(faq)}
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveFaq(index, "up")}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveFaq(index, "down")}
                            disabled={index === faqs.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteFaq(faq.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={faq.isActive}
                          onCheckedChange={() => handleToggleFaqActive(faq)}
                        />
                        <Label className="text-sm">
                          {faq.isActive ? "Active" : "Inactive"}
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

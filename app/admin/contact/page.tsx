"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
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
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { confirmWithToast } from "@/lib/confirm-toast";
import { cn } from "@/lib/utils";

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
  const [settingsDirty, setSettingsDirty] = useState(false);
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
  const [initialSettings, setInitialSettings] =
    useState<ContactSettings | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [faqSearchQuery, setFaqSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/admin/contact");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data.settings);
        setInitialSettings(data.data.settings);
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
        setInitialSettings(data.data);
        setSettingsDirty(false);
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
    const confirmed = await confirmWithToast(
      "Delete this FAQ?",
      "Delete",
      "Cancel",
    );
    if (!confirmed) return;

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

    [newFaqs[index], newFaqs[targetIndex]] = [
      newFaqs[targetIndex],
      newFaqs[index],
    ];

    newFaqs.forEach((faq, idx) => {
      faq.order = idx;
    });

    setFaqs(newFaqs);

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

  const handleSettingsChange = (
    field: keyof ContactSettings,
    value: string,
  ) => {
    const next = { ...settings, [field]: value };
    setSettings(next);

    if (!initialSettings) {
      setSettingsDirty(true);
      return;
    }

    const hasChanges = (
      Object.keys(initialSettings) as Array<keyof ContactSettings>
    )
      .filter((key) => key !== "id")
      .some((key) => next[key] !== initialSettings[key]);

    setSettingsDirty(hasChanges);
  };

  const filteredFaqs = faqs.filter((faq) => {
    if (!faqSearchQuery.trim()) return true;
    const q = faqSearchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="size-8 text-[#ff6636] animate-spin mb-3" />
        <p className="text-xs font-bold text-muted-foreground/80">Loading support portal settings...</p>
      </div>
    );
  }

  return (
    <AdminPage className="w-full p-6 space-y-6">
      <AdminPageHeader
        eyebrow="Public support surface"
        title="Contact Page Settings"
        description="Manage contact information, response expectations, and FAQ content displayed on the public support page."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/contact" target="_blank" rel="noreferrer">
              <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-9">
                <ExternalLink className="size-3.5" />
                Open Public Contact
              </button>
            </Link>
            {settingsDirty ? (
              <button
                className="flex items-center justify-center rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all h-9"
                onClick={() => {
                  if (initialSettings) {
                    setSettings(initialSettings);
                    setSettingsDirty(false);
                    toast.info("Unsaved changes discarded");
                  }
                }}
              >
                Discard Changes
              </button>
            ) : null}
          </div>
        }
      />

      {/* Modern Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total FAQs</p>
            <p className="text-2xl font-black text-foreground">{faqs.length}</p>
          </div>
          <div className="size-10 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground">
            <HelpCircle className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active FAQs</p>
            <p className="text-2xl font-black text-foreground">{faqs.filter((faq) => faq.isActive).length}</p>
          </div>
          <div className="size-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
            <CheckCircle className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inactive FAQs</p>
            <p className="text-2xl font-black text-foreground">{faqs.filter((faq) => !faq.isActive).length}</p>
          </div>
          <div className="size-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <XCircle className="size-5" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/20 border border-border/50 p-1 mb-6">
          <TabsTrigger value="general" className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-[#ff6636] data-[state=active]:text-white">
            Contact Information
          </TabsTrigger>
          <TabsTrigger value="faqs" className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-[#ff6636] data-[state=active]:text-white">
            FAQ content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Hero Section */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2 space-y-0">
                  <MessageSquare className="size-4.5 text-[#ff6636]" />
                  <CardTitle className="text-sm font-extrabold text-foreground">Hero Header Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="heroTitle" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Hero Title
                    </Label>
                    <Input
                      id="heroTitle"
                      value={settings.heroTitle}
                      onChange={(e) =>
                        handleSettingsChange("heroTitle", e.target.value)
                      }
                      placeholder="e.g., Help Center & FAQs"
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="heroSubtitle" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Hero Subtitle
                    </Label>
                    <Textarea
                      id="heroSubtitle"
                      value={settings.heroSubtitle}
                      onChange={(e) =>
                        handleSettingsChange("heroSubtitle", e.target.value)
                      }
                      placeholder="Browse common questions or ask our team a question directly..."
                      rows={3}
                      className="rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Physical Address */}
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2 space-y-0">
                  <MapPin className="size-4.5 text-[#ff6636]" />
                  <CardTitle className="text-sm font-extrabold text-foreground">Office Location Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="addressLine1" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Address Line 1
                    </Label>
                    <Input
                      id="addressLine1"
                      value={settings.addressLine1}
                      onChange={(e) =>
                        handleSettingsChange("addressLine1", e.target.value)
                      }
                      placeholder="123 Learning Street"
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="addressLine2" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Address Line 2
                      </Label>
                      <Input
                        id="addressLine2"
                        value={settings.addressLine2}
                        onChange={(e) =>
                          handleSettingsChange("addressLine2", e.target.value)
                        }
                        placeholder="Tech City, TC 12345"
                        className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addressLine3" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Address Line 3
                      </Label>
                      <Input
                        id="addressLine3"
                        value={settings.addressLine3}
                        onChange={(e) =>
                          handleSettingsChange("addressLine3", e.target.value)
                        }
                        placeholder="United States"
                        className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time Info */}
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2 space-y-0">
                  <ArrowRightLeft className="size-4.5 text-[#ff6636]" />
                  <CardTitle className="text-sm font-extrabold text-foreground">Response Expectations</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="responseTime" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Response Expectation Text
                    </Label>
                    <Textarea
                      id="responseTime"
                      value={settings.responseTime}
                      onChange={(e) =>
                        handleSettingsChange("responseTime", e.target.value)
                      }
                      placeholder="We typically respond within 24 hours during business days..."
                      rows={3}
                      className="rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* General Settings side cards */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* Email Card */}
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2 space-y-0">
                  <Mail className="size-4.5 text-[#ff6636]" />
                  <CardTitle className="text-sm font-extrabold text-foreground">Email Contact</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-2.5">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Support Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingsChange("email", e.target.value)}
                    placeholder="support@devforge.com"
                    className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                  />
                </CardContent>
              </Card>

              {/* Phone Card */}
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2 space-y-0">
                  <Phone className="size-4.5 text-[#ff6636]" />
                  <CardTitle className="text-sm font-extrabold text-foreground">Phone Contact</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-2.5">
                  <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Support Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleSettingsChange("phone", e.target.value)}
                    placeholder="+1 (234) 567-890"
                    className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                  />
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2 space-y-0">
                  <Clock className="size-4.5 text-[#ff6636]" />
                  <CardTitle className="text-sm font-extrabold text-foreground">Business Hours</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="businessHoursLine1" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Business Days
                    </Label>
                    <Input
                      id="businessHoursLine1"
                      value={settings.businessHoursLine1}
                      onChange={(e) =>
                        handleSettingsChange("businessHoursLine1", e.target.value)
                      }
                      placeholder="e.g., Monday - Friday"
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="businessHoursLine2" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Service Hours
                    </Label>
                    <Input
                      id="businessHoursLine2"
                      value={settings.businessHoursLine2}
                      onChange={(e) =>
                        handleSettingsChange("businessHoursLine2", e.target.value)
                      }
                      placeholder="e.g., 9:00 AM - 6:00 PM EST"
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sticky footer action triggers */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              disabled={saving || !settingsDirty}
              className={cn(
                "h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2",
                settingsDirty
                  ? "bg-[#ff6636] hover:bg-[#e95a2b] text-white shadow-[#ff6636]/15"
                  : "bg-muted text-muted-foreground border border-border/40 cursor-not-allowed shadow-none"
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {settingsDirty ? "Save Portal Settings" : "Settings Up to Date"}
                </>
              )}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Add New FAQ Column */}
            <div className="col-span-12 lg:col-span-4">
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden sticky top-6">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2 space-y-0">
                  <Plus className="size-4.5 text-[#ff6636]" />
                  <CardTitle className="text-sm font-extrabold text-foreground">Add New FAQ</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newQuestion" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Question Text
                    </Label>
                    <Input
                      id="newQuestion"
                      value={newFaq.question}
                      onChange={(e) =>
                        setNewFaq({ ...newFaq, question: e.target.value })
                      }
                      placeholder="e.g., How do I reset my password?"
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newAnswer" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Answer Text
                    </Label>
                    <Textarea
                      id="newAnswer"
                      value={newFaq.answer}
                      onChange={(e) =>
                        setNewFaq({ ...newFaq, answer: e.target.value })
                      }
                      placeholder="Provide a clear, detailed answer..."
                      rows={4}
                      className="rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>
                  <button
                    onClick={handleAddFaq}
                    className="w-full h-10 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    <Plus className="size-4" />
                    Add FAQ Unit
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Manage FAQs list Column */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="size-4.5 text-[#ff6636]" />
                    Syllabus FAQ Catalog ({faqs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      placeholder="Search FAQs by question title or answer text..."
                      value={faqSearchQuery}
                      onChange={(e) => setFaqSearchQuery(e.target.value)}
                      className="pl-10 h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
                    />
                  </div>

                  {faqs.length === 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground/80 py-10 text-center">
                      No FAQs constructed yet. Use the panel on the left to build your first FAQ.
                    </p>
                  ) : filteredFaqs.length === 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground/80 py-10 text-center">
                      No FAQs match your search parameter.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredFaqs.map((faq, index) => (
                        <div
                          key={faq.id}
                          className={cn(
                            "rounded-xl border p-4 transition-all space-y-4 bg-background",
                            !faq.isActive
                              ? "opacity-60 border-border/40"
                              : "border-border/60 hover:bg-muted/15"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Question</Label>
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
                                  className="h-9 rounded-lg border-border/80 text-xs font-semibold focus-visible:ring-0 bg-card"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Answer</Label>
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
                                  className="rounded-lg border-border/80 text-xs font-semibold focus-visible:ring-0 bg-card resize-none"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  const realIndex = faqs.findIndex(
                                    (f) => f.id === faq.id,
                                  );
                                  void handleMoveFaq(realIndex, "up");
                                }}
                                disabled={
                                  faqs.findIndex((f) => f.id === faq.id) === 0
                                }
                                className="size-8 rounded-lg border border-border/80 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                              >
                                <MoveUp className="size-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const realIndex = faqs.findIndex(
                                    (f) => f.id === faq.id,
                                  );
                                  void handleMoveFaq(realIndex, "down");
                                }}
                                disabled={
                                  faqs.findIndex((f) => f.id === faq.id) ===
                                  faqs.length - 1
                                }
                                className="size-8 rounded-lg border border-border/80 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                              >
                                <MoveDown className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="size-8 rounded-lg border border-border/80 bg-card flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 border-t border-border/40 pt-3">
                            <Switch
                              checked={faq.isActive}
                              onCheckedChange={() => handleToggleFaqActive(faq)}
                            />
                            <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                              {faq.isActive ? "Published Live" : "Draft (Hidden)"}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}

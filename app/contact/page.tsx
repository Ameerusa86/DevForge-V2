"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
  HelpCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { cn } from "@/lib/utils";

interface ContactSettings {
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
}

const fallbackFaqs: Faq[] = [
  {
    id: "getting-started",
    question: "How do I start learning on DevForge?",
    answer:
      "Create an account, browse the course catalog, and enroll in a path that matches your level. Your dashboard will keep track of progress from there.",
  },
  {
    id: "account-access",
    question: "Can I access my courses on multiple devices?",
    answer:
      "Yes. Your account syncs course access and progress across desktop and mobile browsers so you can continue from where you left off.",
  },
  {
    id: "billing",
    question: "Do paid plans include refunds?",
    answer:
      "Most paid plans include a refund window. If you need help with billing, contact support and include the email tied to your purchase.",
  },
  {
    id: "support",
    question: "How quickly does support reply?",
    answer:
      "We usually respond within one business day. More complex account or billing issues can take longer, but we will keep you updated.",
  },
];

function categorizeFaq(question: string) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("bill") ||
    normalized.includes("price") ||
    normalized.includes("refund") ||
    normalized.includes("payment")
  ) {
    return "Billing";
  }

  if (
    normalized.includes("account") ||
    normalized.includes("password") ||
    normalized.includes("login") ||
    normalized.includes("sign")
  ) {
    return "Account";
  }

  if (
    normalized.includes("course") ||
    normalized.includes("lesson") ||
    normalized.includes("learn") ||
    normalized.includes("certificate")
  ) {
    return "Courses";
  }

  if (
    normalized.includes("bug") ||
    normalized.includes("device") ||
    normalized.includes("technical") ||
    normalized.includes("browser")
  ) {
    return "Technical";
  }

  return "General";
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ContactSettings>({
    email: "support@devforge.com",
    phone: "+1 (234) 567-890",
    addressLine1: "123 Learning Street",
    addressLine2: "Tech City, TC 12345",
    addressLine3: "United States",
    businessHoursLine1: "Monday - Friday",
    businessHoursLine2: "9:00 AM - 6:00 PM EST",
    responseTime:
      "We typically respond within 24 hours during business days. For urgent matters, please call us directly.",
    heroTitle: "Help Center & FAQs",
    heroSubtitle:
      "Browse common questions, filter by topic, and contact the support team when you need a direct answer.",
  });
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [activeCategory, setActiveCategory] = useState("All topics");
  const [openFaqId, setOpenFaqId] = useState("");

  useEffect(() => {
    const loadContactData = async () => {
      try {
        const response = await fetch("/api/contact");
        const data = await response.json();

        if (data.success) {
          setSettings(data.data.settings);
          setFaqs(data.data.faqs);
        }
      } catch (error) {
        console.error("Failed to load contact data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContactData();
  }, []);

  const visibleFaqs = faqs.length > 0 ? faqs : fallbackFaqs;

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const faq of visibleFaqs) {
      const category = categorizeFaq(faq.question);
      counts.set(category, (counts.get(category) || 0) + 1);
    }

    return [
      { label: "All topics", count: visibleFaqs.length },
      ...Array.from(counts.entries()).map(([label, count]) => ({ label, count })),
    ];
  }, [visibleFaqs]);

  const filteredFaqs = useMemo(() => {
    if (activeCategory === "All topics") return visibleFaqs;
    return visibleFaqs.filter(
      (faq) => categorizeFaq(faq.question) === activeCategory,
    );
  }, [activeCategory, visibleFaqs]);

  useEffect(() => {
    if (filteredFaqs.length === 0) {
      setOpenFaqId("");
      return;
    }

    if (!filteredFaqs.some((faq) => faq.id === openFaqId)) {
      setOpenFaqId(filteredFaqs[0].id);
    }
  }, [filteredFaqs, openFaqId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Message sent successfully. We’ll get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <MarketingPublicHeader activePath="/contact" />

      <main className="flex-1">
        {/* Premium Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-[#ff6636]/5 via-transparent to-transparent py-16 sm:py-20">
          <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff6636]">
              <HelpCircle className="size-4" />
              Support Portal
            </div>
            <div className="mt-4 max-w-[800px] space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
                {settings.heroTitle}
              </h1>
              <p className="text-sm sm:text-base font-semibold leading-relaxed text-muted-foreground max-w-[640px]">
                {settings.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Support Grid Layout */}
        <section className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-12">
          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* Left Sidebar Category Filter */}
            <aside className="lg:col-span-3 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Browse Knowledgebase</p>
                <h2 className="text-lg font-black text-foreground">Topics</h2>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm p-1.5 space-y-1">
                {categories.map((category) => {
                  const active = category.label === activeCategory;

                  return (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => setActiveCategory(category.label)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-bold transition-all",
                        active
                          ? "bg-[#ff6636]/10 text-[#ff6636]"
                          : "text-muted-foreground hover:bg-muted/15 hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {category.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-[10px] font-bold rounded-full px-2 py-0.5",
                          active ? "bg-[#ff6636] text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {category.count}
                        </span>
                        {active && <ChevronRight className="size-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Center Accordion Component */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Common solutions</p>
                  <h2 className="text-lg font-black text-foreground">Frequently Asked Questions</h2>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {loading
                    ? "Updating catalog..."
                    : `${filteredFaqs.length} entries`}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 shadow-sm">
                  <Loader2 className="size-6 text-[#ff6636] animate-spin mb-2" />
                  <p className="text-xs font-bold text-muted-foreground/80">Updating help topics...</p>
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center text-xs font-bold text-muted-foreground/85 shadow-sm">
                  No solutions have been published for this topic yet.
                </div>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  value={openFaqId}
                  onValueChange={setOpenFaqId}
                  className="space-y-2"
                >
                  {filteredFaqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className={cn(
                        "rounded-xl border bg-card transition-all overflow-hidden border-border/60",
                        openFaqId === faq.id ? "shadow-sm border-[#ff6636]/40" : "hover:border-border/80"
                      )}
                    >
                      <AccordionTrigger className="py-4 px-5 text-left text-xs font-bold text-foreground hover:no-underline transition-all">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 px-5 text-xs font-semibold leading-relaxed text-muted-foreground border-t border-border/30 pt-3 bg-muted/5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            {/* Right Form & Contact Info Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              
              {/* Question submission form */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff6636]">Submit a request</p>
                  <h2 className="text-lg font-black text-foreground">Need More Help?</h2>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    Can&apos;t find what you need? Leave a ticket and our support engineers will review your request.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g., John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/85 bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/85 bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject Topic</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="e.g., Issue accessing lesson modules"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={isSubmitting}
                      className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/85 bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</Label>
                    <Textarea
                      id="message"
                      placeholder="Detail your question or specific technical bug..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSubmitting}
                      rows={4}
                      className="rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/85 bg-background resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-xs font-bold uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        Send Ticket
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Contact Details listing card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Direct Contacts</h3>

                <div className="space-y-4">
                  {[
                    {
                      label: "Support Mailbox",
                      value: settings.email,
                      icon: Mail,
                      href: `mailto:${settings.email}`,
                    },
                    {
                      label: "Phone Hotline",
                      value: settings.phone,
                      icon: Phone,
                      href: `tel:${settings.phone.replace(/\s/g, "")}`,
                    },
                    {
                      label: "Office Location",
                      value: `${settings.addressLine1}, ${settings.addressLine2}, ${settings.addressLine3}`,
                      icon: MapPin,
                    },
                    {
                      label: "Business Hours",
                      value: `${settings.businessHoursLine1} • ${settings.businessHoursLine2}`,
                      icon: Clock3,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="flex items-start gap-3 text-left">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                          <Icon className="size-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {item.label}
                          </p>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="block text-xs font-semibold text-foreground hover:text-[#ff6636] transition-colors"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-xs font-semibold text-foreground leading-relaxed">
                              {item.value}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-t border-border/40 pt-4">
                    <div className="flex items-start gap-3 text-left">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                        <MessageSquareText className="size-4.5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Expected Response Time
                        </p>
                        <p className="text-xs font-semibold text-foreground leading-relaxed">
                          {settings.responseTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

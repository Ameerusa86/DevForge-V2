"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";

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
    <div className="min-h-screen bg-white text-[#1d2026]">
      <MarketingPublicHeader activePath="/contact" />

      <main>
        <section className="border-b border-[#e9eaf0] bg-[#f5f7fa]">
          <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <p className="text-sm font-medium text-[#8c94a3]">
              Home / Support / FAQs
            </p>
            <div className="mt-4 max-w-[860px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
                Support Center
              </p>
              <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">
                {settings.heroTitle}
              </h1>
              <p className="mt-4 max-w-[720px] text-lg leading-8 text-[#6e7485]">
                {settings.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-[1320px] gap-8 xl:grid-cols-[256px_minmax(0,1fr)_336px]">
            <aside className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c94a3]">
                  Topics
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Browse by area</h2>
              </div>

              <div className="overflow-hidden border border-[#e9eaf0] bg-white">
                {categories.map((category) => {
                  const active = category.label === activeCategory;

                  return (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => setActiveCategory(category.label)}
                      className={`flex w-full items-center justify-between border-b border-[#e9eaf0] px-4 py-4 text-left text-sm font-medium transition last:border-b-0 ${
                        active
                          ? "bg-[#fff2e5] text-[#1d2026]"
                          : "bg-white text-[#4e5566] hover:bg-[#f5f7fa]"
                      }`}
                    >
                      <span>{category.label}</span>
                      <span className="text-xs font-semibold text-[#8c94a3]">
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c94a3]">
                    Common questions
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Frequently asked questions
                  </h2>
                </div>
                <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-3 text-sm text-[#6e7485]">
                  {loading
                    ? "Loading questions..."
                    : `${filteredFaqs.length} answers in ${activeCategory}`}
                </div>
              </div>

              {loading ? (
                <div className="border border-[#e9eaf0] bg-white px-6 py-10 text-center text-[#6e7485]">
                  Loading FAQs...
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className="border border-[#e9eaf0] bg-white px-6 py-10 text-center text-[#6e7485]">
                  No FAQs are available for this topic yet.
                </div>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  value={openFaqId}
                  onValueChange={setOpenFaqId}
                  className="border border-[#e9eaf0] bg-white"
                >
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border-b border-[#e9eaf0] px-6 last:border-b-0">
                      <AccordionTrigger className="py-5 text-left text-base font-semibold text-[#1d2026] hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 text-sm leading-7 text-[#6e7485]">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            <aside className="space-y-6">
              <div className="border border-[#e9eaf0] bg-[#fff2e5] p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ff6636]">
                    Need more help?
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Don’t find your answer?
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#6e7485]">
                    Write your question here and our support team will help you.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 rounded-none border-[#e9eaf0] bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 rounded-none border-[#e9eaf0] bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="How can we help?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 rounded-none border-[#e9eaf0] bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Question</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what you need help with..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSubmitting}
                      rows={6}
                      className="resize-none rounded-none border-[#e9eaf0] bg-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-none bg-[#ff6636] text-sm font-semibold text-white hover:bg-[#e95a2b]"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Question
                      </>
                    )}
                  </Button>
                </form>
              </div>

              <div className="space-y-4 border border-[#e9eaf0] bg-white p-5">
                <h3 className="text-lg font-semibold">Contact details</h3>

                {[
                  {
                    label: "Email",
                    value: settings.email,
                    icon: Mail,
                    href: `mailto:${settings.email}`,
                  },
                  {
                    label: "Phone",
                    value: settings.phone,
                    icon: Phone,
                    href: `tel:${settings.phone.replace(/\s/g, "")}`,
                  },
                  {
                    label: "Address",
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
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1d2026]">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="mt-1 block text-sm leading-6 text-[#6e7485] hover:text-[#ff6636]"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm leading-6 text-[#6e7485]">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-[#e9eaf0] pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center bg-[#ebebff] text-[#564ffd]">
                      <MessageSquareText className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1d2026]">
                        Response time
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#6e7485]">
                        {settings.responseTime}
                      </p>
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

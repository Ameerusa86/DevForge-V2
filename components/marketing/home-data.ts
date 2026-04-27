import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Code2,
  FileSpreadsheet,
  HeartPulse,
  Megaphone,
  MonitorSmartphone,
  Music4,
  Package,
  PenTool,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

export type CategoryItem = {
  title: string;
  courses: string;
  icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
};

export type CourseItem = {
  title: string;
  category: string;
  instructor: string;
  rating: string;
  students: string;
  price: string;
  salePrice?: string;
  tintClassName: string;
  badgeClassName: string;
  imagePosition: string;
};

export type InstructorItem = {
  name: string;
  role: string;
  students: string;
  rating: string;
  panelClassName: string;
  accentClassName: string;
};

export type FooterColumn = {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
};

export const topNavLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/my-courses", label: "My Learning" },
  { href: "/pricing", label: "Pricing" },
  { href: "/community", label: "Community" },
  { href: "/status", label: "Status" },
];

export const heroMetrics = [
  {
    label: "Courses",
    value: "6.3k+",
    icon: BookOpen,
    tone: "bg-[#ebebff] text-[#564ffd]",
  },
  {
    label: "Students",
    value: "67.1k",
    icon: Users,
    tone: "bg-[#e1f7e3] text-[#23bd33]",
  },
];

export const trustBullets = [
  { label: "Career-ready paths", icon: ShieldCheck, tone: "text-[#23bd33]" },
  { label: "67.1k active learners", icon: Users, tone: "text-[#564ffd]" },
];

export const categories: CategoryItem[] = [
  {
    title: "Label",
    courses: "63,476 Courses",
    icon: Code2,
    cardClassName: "bg-[#ebebff]",
    iconClassName: "bg-white text-[#564ffd]",
  },
  {
    title: "Business",
    courses: "52,822 Courses",
    icon: BriefcaseBusiness,
    cardClassName: "bg-[#e1f7e3]",
    iconClassName: "bg-white text-[#23bd33]",
  },
  {
    title: "IT & Software",
    courses: "22,649 Courses",
    icon: MonitorSmartphone,
    cardClassName: "bg-[#ffeee8]",
    iconClassName: "bg-white text-[#ff6636]",
  },
  {
    title: "Personal Development",
    courses: "20,126 Courses",
    icon: TrendingUp,
    cardClassName: "bg-[#fff2e5]",
    iconClassName: "bg-white text-[#fd8e1f]",
  },
  {
    title: "Finance & Accounting",
    courses: "33,841 Courses",
    icon: BarChart3,
    cardClassName: "bg-[#ffeee8]",
    iconClassName: "bg-white text-[#ff6636]",
  },
  {
    title: "Office Productivity",
    courses: "13,932 Courses",
    icon: FileSpreadsheet,
    cardClassName: "bg-[#f5f7fa]",
    iconClassName: "bg-white text-[#6e7485]",
  },
  {
    title: "Marketing",
    courses: "12,068 Courses",
    icon: Megaphone,
    cardClassName: "bg-[#ebebff]",
    iconClassName: "bg-white text-[#564ffd]",
  },
  {
    title: "Photography & Video",
    courses: "6,196 Courses",
    icon: Camera,
    cardClassName: "bg-[#f5f7fa]",
    iconClassName: "bg-white text-[#6e7485]",
  },
  {
    title: "Lifestyle",
    courses: "2,736 Courses",
    icon: Package,
    cardClassName: "bg-[#fff2e5]",
    iconClassName: "bg-white text-[#fd8e1f]",
  },
  {
    title: "Design",
    courses: "2,600 Courses",
    icon: PenTool,
    cardClassName: "bg-[#ffeee8]",
    iconClassName: "bg-white text-[#ff6636]",
  },
  {
    title: "Health & Fitness",
    courses: "1,678 Courses",
    icon: HeartPulse,
    cardClassName: "bg-[#e1f7e3]",
    iconClassName: "bg-white text-[#23bd33]",
  },
  {
    title: "Music",
    courses: "959 Courses",
    icon: Music4,
    cardClassName: "bg-[#fff2e5]",
    iconClassName: "bg-white text-[#fd8e1f]",
  },
];

export const bestSellingCourses: CourseItem[] = [
  {
    title: "Build Production-Ready React Apps With Modern Architecture",
    category: "Development",
    instructor: "Jacob Jones",
    rating: "4.8",
    students: "18.2k",
    price: "$57.00",
    salePrice: "$14.00",
    tintClassName: "bg-[#ebebff]/75",
    badgeClassName: "bg-[#ebebff] text-[#342f98]",
    imagePosition: "center 20%",
  },
  {
    title: "Master Product Thinking for SaaS Teams",
    category: "Business",
    instructor: "Floyd Miles",
    rating: "4.7",
    students: "10.7k",
    price: "$32.00",
    tintClassName: "bg-[#fff2e5]/80",
    badgeClassName: "bg-[#e1f7e3] text-[#15711f]",
    imagePosition: "center 42%",
  },
  {
    title: "Brand Systems and Visual Identity From Brief to Launch",
    category: "Design",
    instructor: "Brooklyn Simmons",
    rating: "4.9",
    students: "9.8k",
    price: "$49.00",
    salePrice: "$24.00",
    tintClassName: "bg-[#ffeee8]/80",
    badgeClassName: "bg-[#ffeee8] text-[#993d20]",
    imagePosition: "center 56%",
  },
  {
    title: "Data Fundamentals for Analysts and Operators",
    category: "Business",
    instructor: "Courtney Henry",
    rating: "4.6",
    students: "11.1k",
    price: "$19.00",
    tintClassName: "bg-[#f5f7fa]/80",
    badgeClassName: "bg-[#f5f7fa] text-[#4e5566]",
    imagePosition: "center 24%",
  },
  {
    title: "Designing Clear APIs for Growing Products",
    category: "IT & Software",
    instructor: "Wade Warren",
    rating: "4.8",
    students: "13.4k",
    price: "$36.00",
    tintClassName: "bg-[#ebebff]/75",
    badgeClassName: "bg-[#ffeee8] text-[#993d20]",
    imagePosition: "center 30%",
  },
  {
    title: "Leadership Habits for First-Time Managers",
    category: "Personal Development",
    instructor: "Dianne Russell",
    rating: "4.5",
    students: "7.3k",
    price: "$27.00",
    salePrice: "$17.00",
    tintClassName: "bg-[#fff2e5]/75",
    badgeClassName: "bg-[#fff2e5] text-[#65390c]",
    imagePosition: "center 54%",
  },
  {
    title: "Fullstack Foundations With Next.js and Postgres",
    category: "Development",
    instructor: "Jenny Wilson",
    rating: "4.9",
    students: "22.1k",
    price: "$61.00",
    salePrice: "$29.00",
    tintClassName: "bg-[#ebebff]/75",
    badgeClassName: "bg-[#ebebff] text-[#342f98]",
    imagePosition: "center 32%",
  },
  {
    title: "Practical Motion Design for Product Teams",
    category: "Design",
    instructor: "Cody Fisher",
    rating: "4.8",
    students: "8.4k",
    price: "$44.00",
    tintClassName: "bg-[#ffeee8]/75",
    badgeClassName: "bg-[#ffeee8] text-[#993d20]",
    imagePosition: "center 44%",
  },
  {
    title: "Cohort Marketing and Community-Led Growth",
    category: "Marketing",
    instructor: "Savannah Nguyen",
    rating: "4.7",
    students: "6.8k",
    price: "$26.00",
    tintClassName: "bg-[#e1f7e3]/75",
    badgeClassName: "bg-[#e1f7e3] text-[#15711f]",
    imagePosition: "center 18%",
  },
  {
    title: "Secure Cloud Infrastructure for Small Teams",
    category: "IT & Software",
    instructor: "Esther Howard",
    rating: "4.8",
    students: "12.3k",
    price: "$58.00",
    tintClassName: "bg-[#f5f7fa]/80",
    badgeClassName: "bg-[#f5f7fa] text-[#4e5566]",
    imagePosition: "center 62%",
  },
];

export const featuredCourses = bestSellingCourses.slice(0, 4);
export const recentCourses = bestSellingCourses.slice(5, 8);

export const instructors: InstructorItem[] = [
  {
    name: "Devon Lane",
    role: "Design Mentor",
    students: "38k Students",
    rating: "4.9",
    panelClassName: "bg-[#f7c948]",
    accentClassName: "bg-[#1d2026]",
  },
  {
    name: "Cameron Williamson",
    role: "Frontend Lead",
    students: "22k Students",
    rating: "4.8",
    panelClassName: "bg-[#e9eaf0]",
    accentClassName: "bg-[#564ffd]",
  },
  {
    name: "Leslie Alexander",
    role: "Data Instructor",
    students: "19k Students",
    rating: "4.8",
    panelClassName: "bg-[#f5f7fa]",
    accentClassName: "bg-[#23bd33]",
  },
  {
    name: "Marvin McKinney",
    role: "Growth Advisor",
    students: "14k Students",
    rating: "4.7",
    panelClassName: "bg-[#f2b95d]",
    accentClassName: "bg-[#ff6636]",
  },
  {
    name: "Kathryn Murphy",
    role: "Product Coach",
    students: "11k Students",
    rating: "4.8",
    panelClassName: "bg-[#a6d96a]",
    accentClassName: "bg-[#1d2026]",
  },
];

export const teachingSteps = [
  "Apply to become instructor",
  "Build your first cohort outline",
  "Record clear, practical lessons",
  "Start earning with every signup",
];

export const companyLogos = [
  "NETFLIX",
  "YouTube",
  "Google",
  "Lenovo",
  "Slack",
  "Verizon",
  "Microsoft",
  "Lexmark",
];

export const footerColumns: FooterColumn[] = [
  {
    title: "Top 4 Category",
    links: [
      { label: "Development", href: "/courses" },
      { label: "Finance & Accounting", href: "/courses" },
      { label: "Design", href: "/courses" },
      { label: "Business", href: "/courses" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "About", href: "/about" },
      { label: "Become Instructor", href: "/contact" },
      { label: "Contact", href: "/contact" },
      { label: "Career", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/contact" },
      { label: "System Status", href: "/status" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQs", href: "/contact" },
    ],
  },
];

export const footerStats = [
  { value: "6.3k", label: "Online courses" },
  { value: "26k", label: "Certified instructors" },
  { value: "99.9%", label: "Success rate" },
];

export const recentPlanBullets = [
  {
    label: "30-day money-back guarantee",
    icon: ShieldCheck,
    tone: "text-[#23bd33]",
  },
  { label: "New courses every week", icon: BookOpen, tone: "text-[#564ffd]" },
  { label: "Members-only peer feedback", icon: Users, tone: "text-[#ff6636]" },
];

export const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ameerdev/",
  },
  {
    label: "GitHub",
    href: "https://github.com/Ameerusa86",
  },
];

export const browseCta = { label: "Browse All", href: "/courses" };

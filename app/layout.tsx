import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Figtree } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { PasswordChangeGuard } from "@/components/auth/password-change-guard";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "DevForge - Your Gateway to Knowledge and Learning",
  description: "Your Gateway to Knowledge and Learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressContentEditableWarning suppressHydrationWarning>
      <body className={`${figtree.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PasswordChangeGuard />
          <Toaster theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}

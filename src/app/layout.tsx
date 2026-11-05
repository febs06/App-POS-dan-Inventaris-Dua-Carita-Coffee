import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dua Carita Coffee - Web Kasir POS, Pre-Order & Booth Event",
  description: "Sistem kasir cerdas, manajemen pre-order WhatsApp, dan booth bazaar event terpadu.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full ${plusJakartaSans.variable}`}>
      <body className="min-h-full antialiased bg-[#faf8f5] text-[#1c1512] font-sans">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

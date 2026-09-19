import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Dua Carita Coffee - Web Kasir POS, Pre-Order & Booth Event",
  description: "Sistem kasir cerdas, manajemen pre-order WhatsApp, dan booth bazaar event terpadu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full antialiased bg-slate-50 text-slate-900">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NEXUS MLBB Marketplace",
    template: "%s | NEXUS MLBB Marketplace",
  },
  description: "A secure Mobile Legends account marketplace with verified sellers, manual KYC, private midman trades, and admin-controlled bank-transfer subscriptions.",
  keywords: ["Mobile Legends", "MLBB", "account marketplace", "gaming escrow", "midman", "verified seller"],
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  openGraph: {
    title: "NEXUS MLBB Marketplace",
    description: "Secure verified-seller MLBB account marketplace with moderator-managed private trade rooms.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-100 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(214,165,52,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,#050505,#0a0a0b)]" />
        <Header />
        {children}
      </body>
    </html>
  );
}

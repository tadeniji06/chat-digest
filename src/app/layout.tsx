import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chatdigest.app"),
  title: {
    default: "ChatDigest | WhatsApp Group Summarization & Keyword Alerts Bot",
    template: "%s | ChatDigest",
  },
  description:
    "ChatDigest connects to your WhatsApp account to deliver AI-powered executive bullet summaries, action item tracking, and instant keyword alerts for busy groups.",
  keywords: [
    "WhatsApp Summaries",
    "WhatsApp AI Bot",
    "WhatsApp Group Digest",
    "ChatDigest",
    "WhatsApp Keyword Alerts",
    "AI Meeting Summarizer",
    "WhatsApp Business Automation",
    "WhatsApp Web Summaries",
  ],
  authors: [{ name: "ChatDigest Team" }],
  creator: "ChatDigest",
  publisher: "ChatDigest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chatdigest.app",
    siteName: "ChatDigest",
    title: "ChatDigest | WhatsApp Group Summarization & Keyword Alert Bot",
    description:
      "Transform high-volume WhatsApp group chats into concise AI digests and instant keyword notifications.",
    images: [
      {
        url: "/logo.png",
        width: 348,
        height: 92,
        alt: "ChatDigest Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatDigest | WhatsApp Group Summarization & AI Alerts",
    description:
      "Never miss important WhatsApp updates. Get automated AI bullet summaries and real-time keyword triggers.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favico.png", sizes: "any", type: "image/png" },
    ],
    apple: [{ url: "/favico.png" }],
  },
  manifest: "/manifest.json",
};

import { Toaster } from "@/components/ui/Toaster";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { Barlow_Condensed } from "next/font/google";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={barlowCondensed.variable}>
      <head>
        <link rel="icon" href="/favico.png" type="image/png" />
      </head>
      <body className={`${barlowCondensed.className} antialiased min-h-screen bg-slate-50 text-slate-900`}>
        {children}
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}

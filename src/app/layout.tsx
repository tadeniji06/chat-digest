import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.chatdigest.site"),
  title: {
    default: "ChatDigest | WhatsApp Group Summarizer & Keyword Alerts Bot in Nigeria",
    template: "%s | ChatDigest Nigeria",
  },
  description:
    "ChatDigest is Nigeria's #1 WhatsApp AI bot for business owners, church groups, students, and community managers. Get instant keyword alerts, daily AI bullet digests, and action-point tracking on WhatsApp in Naira (NGN).",
  keywords: [
    // Core Nigeria targeted keywords
    "WhatsApp Summarizer Nigeria",
    "WhatsApp AI Bot Nigeria",
    "WhatsApp group summary Lagos Abuja Nigeria",
    "WhatsApp keyword alerts Nigeria",
    "WhatsApp business automation Nigeria",
    "Naira payment WhatsApp bot",
    "Flutterwave WhatsApp bot subscription",
    "WhatsApp bot for Nigerian businesses",
    "WhatsApp group management Nigeria",
    "Nigerian tech startup WhatsApp tool",
    "WhatsApp meeting summarizer NGN",
    "WhatsApp group AI digest Nigeria",
    // Community & Use Cases
    "WhatsApp church group summarizer Nigeria",
    "WhatsApp estate group tracker Nigeria",
    "WhatsApp university group study bot Nigeria",
    "WhatsApp market group price alerts Nigeria",
    "Nigerian SME WhatsApp customer alerts",
    // General high-intent keywords
    "WhatsApp AI summarizer",
    "WhatsApp group chat summarization",
    "ChatDigest",
    "ChatDigest Nigeria",
    "WhatsApp executive brief",
    "WhatsApp keyword tracker",
    "WhatsApp group notes bot",
  ],
  authors: [{ name: "ChatDigest Nigeria Team", url: "https://www.chatdigest.site" }],
  creator: "ChatDigest Nigeria",
  publisher: "ChatDigest Technologies",
  category: "Business & Productivity Software",
  classification: "WhatsApp AI Bot, Productivity, Messaging Automation",
  alternates: {
    canonical: "https://www.chatdigest.site",
  },
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
    locale: "en_NG",
    url: "https://www.chatdigest.site",
    siteName: "ChatDigest Nigeria",
    title: "ChatDigest | WhatsApp Group AI Summaries & Keyword Alerts in Nigeria",
    description:
      "Save hours on high-volume WhatsApp groups in Nigeria. Get automated AI digests and real-time keyword notifications on your phone. Pay in Naira.",
    images: [
      {
        url: "/logo.png",
        width: 348,
        height: 92,
        alt: "ChatDigest Nigeria - WhatsApp Group Summarizer & Alert Bot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatDigest Nigeria | WhatsApp AI Summarizer & Keyword Alerts",
    description:
      "Nigeria's WhatsApp AI Bot. Auto bullet digests, keyword triggers, and action tracking for active Nigerian groups. Pay via Flutterwave in NGN.",
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

import Script from "next/script";
import { Toaster } from "@/components/ui/Toaster";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { Manrope, Quantico, Shadows_Into_Light } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const quantico = Quantico({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-quantico",
  display: "swap",
});

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shadows-into-light",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${quantico.variable} ${shadowsIntoLight.variable}`}
    >
      <head>
        <link rel="icon" href="/favico.png" type="image/png" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {/* Microsoft Clarity Analytics */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "yzoqjg1791");
          `}
        </Script>
        {children}
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}

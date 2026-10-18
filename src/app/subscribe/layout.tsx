import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Plans (Naira NGN) - Basic, Pro & Enterprise',
  description:
    'Affordable WhatsApp group monitoring and AI summarization plans starting from ₦2,000/month. Instant activation in Nigeria via Flutterwave debit card, USSD, or bank transfer.',
  alternates: {
    canonical: 'https://www.chatdigest.site/subscribe',
  },
  keywords: [
    'ChatDigest pricing Nigeria',
    'WhatsApp bot subscription Naira',
    'WhatsApp group monitor price NGN',
    'Flutterwave WhatsApp bot checkout',
    'Cheap WhatsApp AI bot Nigeria',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

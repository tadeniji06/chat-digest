import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription & Naira Plans - Flutterwave Checkout',
  description: 'Manage your active 30-day WhatsApp monitoring plan, upgrade tier, and view automated live billing status.',
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

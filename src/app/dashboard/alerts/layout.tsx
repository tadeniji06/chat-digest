import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real-Time Keyword Alerts',
  description: 'Instant notification stream and triggered keyword mentions across monitored WhatsApp groups in Nigeria.',
};

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

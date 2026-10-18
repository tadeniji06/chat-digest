import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Group Summaries & Meeting Notes',
  description: 'View executive AI digests, action items, speaker highlights, and topics from your WhatsApp groups.',
};

export default function SummariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

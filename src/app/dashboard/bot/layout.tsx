import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Official Notification Bot Setup',
  description: 'Connect and pair the dedicated official WhatsApp bot number for ChatDigest.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

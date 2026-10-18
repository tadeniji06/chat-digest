import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitored WhatsApp Groups',
  description: 'Add, organize, and monitor WhatsApp groups with custom keyword alerts.',
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

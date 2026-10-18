import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect WhatsApp Session via QR Code',
  description: 'Pair your WhatsApp account securely with ChatDigest using end-to-end encrypted QR code or phone pairing.',
};

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

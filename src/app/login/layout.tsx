import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account',
  description:
    'Sign in to your ChatDigest account to access your WhatsApp group monitoring, AI executive summaries, and keyword alerts in Nigeria.',
  alternates: {
    canonical: 'https://www.chatdigest.site/login',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

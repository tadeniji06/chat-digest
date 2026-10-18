import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account - Free WhatsApp Group AI Bot',
  description:
    'Sign up for ChatDigest in Nigeria. Get started with AI WhatsApp summaries, keyword notifications, and meeting bullet points. Pay in Naira with Flutterwave.',
  alternates: {
    canonical: 'https://www.chatdigest.site/signup',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

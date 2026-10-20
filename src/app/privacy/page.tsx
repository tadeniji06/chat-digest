import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { ArrowLeft, Shield, Lock, Eye, FileText, Server, AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection',
  description: 'Understand how ChatDigest encrypts your data, protects WhatsApp privacy, and securely handles payments in Nigeria.',
  alternates: {
    canonical: 'https://www.chatdigest.site/privacy',
  },
};

export default function PrivacyPage() {
  const lastUpdated = 'October 17, 2026';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="ChatDigest Logo"
              width={160}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <div className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl border border-gray-200 shadow-sm space-y-8 text-gray-800 text-sm leading-relaxed">
          {/* Title Header */}
          <div className="border-b border-gray-200 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Trust &amp; Privacy Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Effective Date: {lastUpdated} &bull; Version 2.4
            </p>
          </div>

          {/* Core Privacy Promise */}
          <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              Our Core Privacy Promise
            </h3>
            <p className="text-xs text-emerald-900 leading-relaxed">
              ChatDigest is designed with a strict zero-retention architecture. We do not sell, rent, or monetize your WhatsApp conversations. Messages processed for AI summarization and keyword alerting are held temporarily in volatile memory buffer exclusively to produce requested digests and trigger instant notifications.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">1.</span> Information We Collect
            </h2>
            <p className="text-gray-700">
              When you register for and use ChatDigest, we collect the following categories of information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>
                <strong>Account Credentials:</strong> Email address, encrypted authentication tokens managed securely by Supabase Auth, and OAuth provider profile IDs (if signing in via Google).
              </li>
              <li>
                <strong>Subscription &amp; Transaction Metadata:</strong> Payment reference ID, subscription tier (e.g. Free, Pro, Max), transaction timestamp, and billing status through Flutterwave. We never store raw credit card numbers or banking secrets.
              </li>
              <li>
                <strong>WhatsApp Session Data:</strong> Encrypted cryptographic session keys generated via the WhatsApp Web Multi-Device protocol on your local bridge or dedicated worker container.
              </li>
              <li>
                <strong>Configuration Preferences:</strong> Monitored group JIDs, group names, user-defined keyword triggers, and digest delivery intervals.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">2.</span> How We Process Group Chat Messages
            </h2>
            <p className="text-gray-700">
              ChatDigest connects to WhatsApp Web via an encrypted session socket. Group messages are processed in the following manner:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  Real-time Keyword Detection
                </div>
                <p className="text-xs text-gray-600">
                  Incoming messages in monitored groups are matched in-memory against your chosen keywords. Only matching alerts are logged to your personal dashboard.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-700" />
                  AI Meeting Minutes &amp; Summaries
                </div>
                <p className="text-xs text-gray-600">
                  When you request an on-demand summary (or schedule a recurring digest), messages from the selected timeframe are formatted into a clean transcript and passed to Google Gemini via API.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">
              Note: Messages are processed under enterprise API terms where prompt inputs are not used to train public foundational AI models.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">3.</span> Data Storage, Retention &amp; Security
            </h2>
            <p className="text-gray-700">
              We employ rigorous physical, organizational, and electronic safeguards to ensure your account security:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>Row-Level Security (RLS) is strictly enforced across all tables. Saved summaries are private to their owner unless the owner explicitly creates a public share link. Anyone with that unlisted link can read the shared summary until the owner revokes it; raw chat messages and account details are not included.</li>
              <li>Encrypted in transit using TLS 1.3 encryption and encrypted at rest on enterprise cloud infrastructure.</li>
              <li>You can disconnect your WhatsApp session at any time with a single click in your dashboard, which immediately revokes socket keys and clears local auth credentials.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">4.</span> Your Rights &amp; Control (GDPR / NDPR / CCPA)
            </h2>
            <p className="text-gray-700">
              You retain complete ownership over your data. Depending on your jurisdiction, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>Request export of your saved meeting minutes and keyword alert logs.</li>
              <li>Modify or remove monitored groups and keyword trigger lists at will.</li>
              <li>Request full account and data erasure by contacting support or disconnecting your account.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">5.</span> Third-Party Service Providers
            </h2>
            <p className="text-gray-700">
              We partner with trusted infrastructure providers who adhere to strict data security standards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li><strong>Supabase:</strong> Database, authentication, and secure session management.</li>
              <li><strong>Google Gemini AI:</strong> Enterprise LLM inference for generating structured meeting minutes and briefings.</li>
              <li><strong>Flutterwave:</strong> PCI-DSS Level 1 certified payment processing gateway.</li>
              <li><strong>Vercel &amp; Render:</strong> Web hosting and background bridge socket orchestration.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">6.</span> Policy Updates &amp; Contact
            </h2>
            <p className="text-gray-700">
              We may update this policy periodically to reflect feature expansions or legal requirements. Material modifications will be announced via your dashboard or email.
            </p>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
              <p className="font-semibold text-gray-900">Privacy &amp; Data Protection Officer</p>
              <p className="text-gray-600">Email: privacy@chatdigest.app</p>
              <p className="text-gray-600">Operating under applicable data protection regulations (GDPR, NDPR, CCPA).</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

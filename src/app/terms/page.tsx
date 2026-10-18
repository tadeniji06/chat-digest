import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | ChatDigest',
  description: 'Review terms of use, acceptable use policy, and subscription agreements for ChatDigest.',
};

export default function TermsPage() {
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
              <FileText className="w-3.5 h-3.5 text-emerald-600" /> Legal &amp; User Agreement
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Terms and Conditions
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Last Updated: {lastUpdated} &bull; Version 2.2
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-2">
            <p>
              Please read these Terms and Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) carefully before creating an account or using ChatDigest (&quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By creating an account or clicking &quot;Accept&quot;, you agree to be bound by these Terms.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">1.</span> Description of Service
            </h2>
            <p className="text-gray-700">
              ChatDigest provides an AI-powered conversational productivity layer for WhatsApp Web. Features include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>Automated meeting minutes and executive summaries of group chats.</li>
              <li>Real-time keyword tracking and instant alert notifications.</li>
              <li>Participant statement attribution and actionable next-step identification.</li>
              <li>Multi-group management according to your chosen subscription tier.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">2.</span> Account Registration &amp; Eligibility
            </h2>
            <p className="text-gray-700">
              To use ChatDigest, you must be at least 16 years of age (or the age of majority in your jurisdiction) and have legal capacity to enter into binding contracts. You must provide a valid email address and maintain the confidentiality of your account credentials. You are responsible for all activities occurring under your account.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">3.</span> Acceptable Use &amp; WhatsApp Compliance
            </h2>
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-950 space-y-1 mb-2">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" /> Respecting Privacy in Shared Groups
              </p>
              <p className="text-emerald-900">
                You agree only to monitor WhatsApp groups that you belong to legitimately and where you have the consent or authority to review messages for summary purposes (such as student cohorts, professional teams, community channels, and family groups).
              </p>
            </div>
            <p className="text-gray-700">
              You expressly agree NOT to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>Use ChatDigest for spamming, harassment, espionage, or unauthorized mass extraction of contact numbers.</li>
              <li>Violate the WhatsApp Terms of Service, anti-spam laws, or intellectual property rights of any third party.</li>
              <li>Attempt to reverse engineer, decompile, or compromise the security of ChatDigest infrastructure or AI endpoints.</li>
              <li>Circumvent account limits, tier caps, or billing verification systems.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">4.</span> Subscriptions, Billing &amp; Cancellations
            </h2>
            <p className="text-gray-700">
              ChatDigest offers Free, Basic, Pro, Max, and Enterprise subscription tiers with varying features, group limits, and AI summary capabilities.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li><strong>Billing Cycle:</strong> Paid plans are billed every 30 days in advance via Flutterwave in Nigerian Naira (NGN).</li>
              <li><strong>Tier Limits:</strong> Free users can monitor 1 group (2 keywords, 1 summary lifetime). Basic users monitor up to 3 groups (2 keywords/group, 1 summary/day). Pro users monitor up to 6 groups (3 keywords/group, 3 summaries/day). Max users monitor up to 10 groups (4 keywords/group, 5 summaries/day). Enterprise users monitor up to 20 groups (10 keywords/group, 10 summaries/day).</li>
              <li><strong>30-Day Expiration:</strong> Subscriptions remain active for exactly 30 days from confirmation. After expiry, access automatically defaults to Free tier features until renewed.</li>
              <li><strong>Refunds:</strong> Because AI inference consumes non-recoverable compute cycles, subscription fees are non-refundable once the billing period has commenced, except where mandated by local consumer law.</li>
              <li><strong>Cancellation:</strong> You may cancel or change your plan at any time in the Subscription Dashboard. Your tier perks remain active until the end of your billing cycle.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">5.</span> AI Disclaimers &amp; Accuracy
            </h2>
            <p className="text-gray-700">
              ChatDigest uses advanced large language models (Google Gemini) to synthesize group chats. While our prompts strive for maximum precision in speaker attribution and key statements:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>AI summaries and meeting minutes are provided as informational productivity tools and should not be relied upon as legal depositions, financial advice, or official corporate transcripts.</li>
              <li>We do not guarantee 100% accuracy in cases of ambiguous colloquial language, sarcasm, incomplete voice notes, or rapid overlapping group messages.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">6.</span> Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="text-gray-700">
              ChatDigest is an independent software application and is not affiliated, endorsed, sponsored, or certified by Meta Platforms, Inc. or WhatsApp LLC. The service is provided &quot;AS IS&quot; without warranties of any kind. In no event shall ChatDigest be liable for indirect, incidental, punitive, or consequential damages resulting from your use of the service.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">7.</span> Governing Law &amp; Dispute Resolution
            </h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws applicable in your jurisdiction of registration, without regard to conflict of law principles. Any dispute arising out of or relating to these Terms shall be resolved first via good-faith informal mediation.
            </p>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
              <p className="font-semibold text-gray-900">Legal Contact</p>
              <p className="text-gray-600">Email: legal@chatdigest.app</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

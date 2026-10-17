import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import ManageCookiesButton from '@/components/ManageCookiesButton';
import { ArrowLeft, Cookie, Shield, Check, Info, Settings } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | ChatDigest',
  description: 'Learn how ChatDigest uses essential and performance cookies to provide secure WhatsApp group summaries.',
};

export default function CookiesPage() {
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
              <Cookie className="w-3.5 h-3.5 text-emerald-600" /> Transparency &amp; Cookie Compliance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Effective Date: {lastUpdated} &bull; In accordance with EU ePrivacy Directive &amp; GDPR
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-2">
            <p>
              This Cookie Policy explains what cookies and similar tracking technologies are used by ChatDigest, why we use them, and how you can exercise your choices to control them.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">1.</span> What Are Cookies?
            </h2>
            <p className="text-gray-700">
              Cookies are small text files placed on your browser or device when you visit a website. They allow websites to recognize your device, remember user preferences, maintain secure login sessions, and optimize web performance without repeatedly requesting credentials.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">2.</span> Cookies Used by ChatDigest
            </h2>
            <p className="text-gray-700">
              We divide cookies into two clear, transparent categories:
            </p>

            <div className="space-y-4 pt-1">
              {/* Category A */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" /> Category A: Strictly Necessary Cookies (Always Active)
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Essential
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  These cookies are vital for the operation of the web application. Without them, you cannot authenticate, navigate protected dashboard routes, or keep your active subscription verified.
                </p>
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-1.5 font-semibold">Cookie Name</th>
                        <th className="pb-1.5 font-semibold">Provider</th>
                        <th className="pb-1.5 font-semibold">Purpose</th>
                        <th className="pb-1.5 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="py-2 font-mono text-emerald-800">sb-auth-token</td>
                        <td className="py-2">Supabase</td>
                        <td className="py-2">Stores encrypted user session and token refresh for secure authentication.</td>
                        <td className="py-2">Session / 1 Year</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-emerald-800">cd_sub_active</td>
                        <td className="py-2">ChatDigest</td>
                        <td className="py-2">Fast client/middleware verification of your active Pro or Max subscription plan.</td>
                        <td className="py-2">30 Days</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-emerald-800">chatdigest_cookie_consent</td>
                        <td className="py-2">ChatDigest (Local)</td>
                        <td className="py-2">Stores your cookie consent preferences and timestamp.</td>
                        <td className="py-2">Persistent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category B */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600" /> Category B: Performance &amp; Diagnostics Cookies (Optional)
                  </h4>
                  <span className="text-[10px] bg-gray-200 text-gray-800 font-bold px-2 py-0.5 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  These cookies help us analyze web traffic, measure API roundtrip latency for AI summary generation, and detect client-side rendering bottlenecks so we can optimize performance for mobile users.
                </p>
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-1.5 font-semibold">Cookie Name</th>
                        <th className="pb-1.5 font-semibold">Provider</th>
                        <th className="pb-1.5 font-semibold">Purpose</th>
                        <th className="pb-1.5 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="py-2 font-mono text-emerald-800">_va_speed</td>
                        <td className="py-2">Vercel Analytics</td>
                        <td className="py-2">Measures web vital latency (LCP, FID) in anonymized batches.</td>
                        <td className="py-2">Session</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">3.</span> How to Manage or Revoke Your Cookie Preferences
            </h2>
            <p className="text-gray-700">
              You can adjust or revoke your cookie choices at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>
                <strong>In-App Consent Banner:</strong> Click <ManageCookiesButton /> to reopen the on-screen configuration banner and adjust your choices.
              </li>
              <li>
                <strong>Browser Controls:</strong> Most modern browsers (Chrome, Safari, Firefox, Edge) allow you to block or delete cookies via your browser settings. Please note that disabling strictly necessary cookies will prevent you from signing in to your ChatDigest account.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">4.</span> Questions &amp; Support
            </h2>
            <p className="text-gray-700">
              For any questions regarding our use of cookies or privacy practices, feel free to reach out to our team at{' '}
              <a href="mailto:support@chatdigest.app" className="font-semibold text-emerald-700 hover:underline">
                support@chatdigest.app
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

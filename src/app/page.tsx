import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Bell,
  Users2,
  Check,
  Lock,
} from 'lucide-react';
import { PLAN_LIMITS } from '@/types';
import Footer from '@/components/Footer';

export default async function LandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const code = resolvedParams?.code;

  // If Supabase redirects auth code to root '/', seamlessly route it to /auth/callback to exchange session
  if (code && typeof code === 'string') {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ChatDigest Nigeria',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    url: 'https://www.chatdigest.site',
    description:
      'WhatsApp group intelligence & AI summarization service in Nigeria. Filter keywords, monitor conversations, and receive executive bullet digests. Powered by Flutterwave NGN checkout.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'NGN',
      lowPrice: '2000',
      highPrice: '50000',
      offerCount: '5',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-emerald-600 selection:text-white">
      {/* JSON-LD Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation */}
      <header className="border-b border-gray-200 sticky top-0 z-50 bg-white/95 backdrop-blur-md">
        <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
            <div className="relative h-10 sm:h-12 w-auto flex items-center">
              <Image
                src="/logo.png"
                alt="ChatDigest - WhatsApp Group Summarizer & Alert Bot"
                width={190}
                height={50}
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-6 sm:mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>WhatsApp Group Intelligence & Alerts</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-950 tracking-tight leading-[1.18]">
              Never miss critical updates in busy WhatsApp groups
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              ChatDigest connects to your WhatsApp account, monitors high-volume chats, synthesizes AI bullet digests, and delivers instant keyword notifications.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-7 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Connect WhatsApp Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-7 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm font-semibold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 transition-colors text-center"
              >
                Sign In with Google
              </Link>
            </div>

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                End-to-End Encrypted Session
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Sub-second Keyword Triggers
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Actionable AI Briefs
              </span>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Essential tools for high-volume WhatsApp chats
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Designed with a distraction-free workflow so you stay informed in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <article className="p-6 sm:p-8 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Instant Keyword Alerts</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Track terms like &quot;urgent&quot;, &quot;review&quot;, or client names. Receive immediate notifications whenever they appear.
                </p>
              </article>

              <article className="p-6 sm:p-8 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">AI Executive Briefs</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Condense hundreds of messages into structured summaries with discussion points, decisions, and clear action items.
                </p>
              </article>

              <article className="p-6 sm:p-8 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Private Baileys Bridge</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Dedicated connection handling with database Row Level Security ensuring your group data remains private.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 sm:py-24 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Simple, Transparent Plans
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Choose the tier that matches your group volume and workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {Object.values(PLAN_LIMITS).map((plan) => {
                const isPro = plan.tier === 'pro';
                return (
                  <div
                    key={plan.tier}
                    className={`p-5 rounded-xl border flex flex-col justify-between bg-white relative transition-all ${
                      isPro
                        ? 'border-emerald-600 ring-2 ring-emerald-600 shadow-md'
                        : 'border-gray-200 shadow-sm hover:border-gray-300'
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                        Recommended
                      </div>
                    )}

                    <div>
                      <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-gray-900">
                          {plan.price.split('/')[0]}
                        </span>
                        <span className="text-[11px] text-gray-500">/month</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 min-h-12 leading-relaxed">{plan.description}</p>
                      <div className="my-4 border-t border-gray-100" />
                      <ul className="space-y-2.5 text-xs text-gray-700">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>{plan.maxGroups}</strong> Group(s)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>{plan.keywordsPerGroup}</strong> keywords / group</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            {plan.isLifetimeSummary ? (
                              <strong>1 AI summary forever</strong>
                            ) : (
                              <span><strong>{plan.dailySummaries} summary/day</strong> (24h reset)</span>
                            )}
                          </span>
                        </li>
                        {plan.hasWeeklyDigest && (
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Weekly digest</span>
                          </li>
                        )}
                        {plan.hasPastSearch && (
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Past archive search</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Link
                        href="/signup"
                        className={`block w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-center transition-colors ${
                          isPro
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        Choose {plan.name}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Responsive Mobile-Friendly Footer */}
      <Footer />
    </div>
  );
}

'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ShieldCheck, Zap, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_LIMITS } from '@/types';

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const isCancelled = searchParams.get('cancelled') === 'true';
  const hasError = searchParams.get('error');

  const handleCheckout = async (tier: 'base' | 'pro' | 'max') => {
    setLoadingTier(tier);
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to start payment checkout');
        return;
      }

      if (data.link) {
        toast.info('Redirecting to secure Flutterwave checkout...');
        window.location.href = data.link;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error connecting to payment gateway';
      toast.error(message);
    } finally {
      setLoadingTier(null);
    }
  };

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const plans: Array<'base' | 'pro' | 'max'> = ['base', 'pro', 'max'];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="ChatDigest Logo"
              width={180}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-4">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Membership Required</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            Activate Your ChatDigest Subscription
          </h1>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            To connect your WhatsApp account, receive AI executive digests, and track keywords in real time, please select a subscription plan.
          </p>
        </div>

        {isCancelled && (
          <div className="mb-8 p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm flex items-center gap-3 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-gray-500 shrink-0" />
            <span>Your checkout was cancelled. You can select a plan below whenever you are ready.</span>
          </div>
        )}

        {hasError && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Payment verification could not be completed. Please contact support or try again.</span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((t) => {
            const plan = PLAN_LIMITS[t];
            const isPro = t === 'pro';

            return (
              <div
                key={t}
                className={`p-6 sm:p-7 rounded-xl border flex flex-col justify-between bg-white relative transition-shadow ${
                  isPro
                    ? 'border-emerald-600 ring-2 ring-emerald-600 shadow-md'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white">
                    Recommended
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-950 tracking-tight">
                      {plan.price.split('/')[0]}
                    </span>
                    <span className="text-xs text-gray-500">/month</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 min-h-9">
                    {plan.description}
                  </p>

                  <div className="my-5 border-t border-gray-100" />

                  <ul className="space-y-3 text-xs text-gray-700">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Up to <strong>{plan.maxGroups} WhatsApp Group(s)</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Keyword alerts ({plan.keywordsLimit} max)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      {plan.hasSummaries ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 text-gray-300 shrink-0 text-center font-bold">&ndash;</span>
                      )}
                      <span className={plan.hasSummaries ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        AI bullet summaries & action items
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      {plan.hasWeeklyDigest ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 text-gray-300 shrink-0 text-center font-bold">&ndash;</span>
                      )}
                      <span className={plan.hasWeeklyDigest ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        Weekly digest synthesis
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      {plan.hasPastSearch ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 text-gray-300 shrink-0 text-center font-bold">&ndash;</span>
                      )}
                      <span className={plan.hasPastSearch ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        Archive search of past messages
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => handleCheckout(t)}
                    disabled={loadingTier !== null}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                      isPro
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {loadingTier === t ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing Checkout...</span>
                      </>
                    ) : (
                      <span>Pay with Flutterwave</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security assurance */}
        <div className="mt-12 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-6">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Processed securely via Flutterwave
          </span>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            Instant automated account activation
          </span>
        </div>
      </main>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <SubscribeContent />
    </Suspense>
  );
}

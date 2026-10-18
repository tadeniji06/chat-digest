'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionTier, PLAN_LIMITS } from '@/types';
import { getUserFriendlyError } from '@/utils/errors';

import { createClient } from '@/utils/supabase/client';

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    // Fetch accurately resolved tier from server endpoint
    fetch('/api/user/tier')
      .then((res) => res.json())
      .then((data) => {
        if (data?.tier) {
          setCurrentTier(data.tier as SubscriptionTier);
        }
        if (data?.expiresAt) {
          setExpiresAt(data.expiresAt);
        }
        if (typeof data?.secondsRemaining === 'number') {
          setSecondsRemaining(data.secondsRemaining);
        }
        if (data?.isExpired) {
          setIsExpired(true);
        }
      })
      .catch((err) => console.error('[Tier fetch error]:', err));

    if (searchParams.get('payment') === 'success') {
      toast.success('Your subscription is active! Thank you for subscribing.');
    }
  }, [searchParams]);

  // Real-time ticking countdown
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const formatCountdown = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  };

  const handleCheckout = async (tier: SubscriptionTier) => {
    if (tier === 'free') {
      setLoadingTier('free');
      try {
        const res = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'free' }),
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentTier('free');
          setIsExpired(false);
          toast.success('Switched to Free Plan successfully!');
          window.location.reload();
        } else {
          toast.error(getUserFriendlyError(data.error, 'Unable to switch plan right now. Please try again.'));
        }
      } catch {
        toast.error('Unable to switch plan right now. Please check your internet connection.');
      } finally {
        setLoadingTier(null);
      }
      return;
    }

    setLoadingTier(tier);
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(getUserFriendlyError(data.error, 'Unable to initialize checkout. Please try again shortly.'));
        return;
      }

      if (data.link) {
        toast.info('Redirecting to secure Flutterwave checkout...');
        window.location.href = data.link;
      }
    } catch (err: unknown) {
      toast.error(getUserFriendlyError(err, 'Payment service is temporarily busy. Please try again in a few moments.'));
    } finally {
      setLoadingTier(null);
    }
  };

  const tiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'max', 'enterprise'];
  const countdown = formatCountdown(secondsRemaining);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Subscription & Plans
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select or upgrade your WhatsApp monitoring tier with secure Flutterwave checkout
        </p>
      </div>

      {/* Expiration Countdown Banner / Card */}
      {currentTier !== 'free' && (
        <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isExpired
            ? 'bg-red-50 border-red-200 text-red-900'
            : secondsRemaining < 86400 * 3
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                isExpired ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {isExpired ? 'Subscription Expired' : 'Active Plan'}
              </span>
              <span className="font-bold text-sm">
                ChatDigest {PLAN_LIMITS[currentTier]?.name} Plan (30 Days Cycle)
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-600">
              {isExpired
                ? 'Your 30-day subscription has lapsed. Access has defaulted to free limits. Renew below to restore full features.'
                : expiresAt
                ? `Expires on ${new Date(expiresAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : '30-day billing period active'}
            </p>
          </div>

          {!isExpired && secondsRemaining > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-center">
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm min-w-12">
                  <span className="block text-lg font-extrabold text-gray-900 leading-none">{countdown.days}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Days</span>
                </div>
                <span className="font-bold text-gray-400">:</span>
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm min-w-12">
                  <span className="block text-lg font-extrabold text-gray-900 leading-none">{countdown.hours}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Hours</span>
                </div>
                <span className="font-bold text-gray-400">:</span>
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm min-w-12">
                  <span className="block text-lg font-extrabold text-gray-900 leading-none">{countdown.minutes}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Mins</span>
                </div>
                <span className="font-bold text-gray-400">:</span>
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm min-w-12">
                  <span className="block text-lg font-extrabold text-gray-900 leading-none">{countdown.seconds}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Secs</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiers.map((t) => {
          const plan = PLAN_LIMITS[t];
          const isCurrent = currentTier === t && !isExpired;
          const isPro = t === 'pro';

          return (
            <div
              key={t}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between bg-white relative ${
                isCurrent
                  ? 'border-emerald-600 ring-2 ring-emerald-600 shadow-md'
                  : isPro
                  ? 'border-emerald-300 shadow-sm hover:border-emerald-500'
                  : 'border-gray-200 shadow-sm hover:border-gray-300'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {plan.price.split('/')[0]}
                  </span>
                  <span className="text-[11px] text-gray-500">/month</span>
                </div>
                <p className="text-xs text-gray-600 mt-2 min-h-12 leading-relaxed">
                  {plan.description}
                </p>

                <div className="my-4 border-t border-gray-100" />

                <ul className="space-y-2.5 text-xs text-gray-700">
                  <li className="flex items-start gap-2" title={`${plan.maxGroups} group(s) simultaneous monitoring`}>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{plan.maxGroups}</strong> Group(s)
                    </span>
                  </li>
                  <li className="flex items-start gap-2" title={`${plan.keywordsPerGroup} keywords per group for real-time tracking`}>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{plan.keywordsPerGroup}</strong> keywords / group
                    </span>
                  </li>
                  <li className="flex items-start gap-2" title={plan.isLifetimeSummary ? 'Only 1 summary lifetime' : `${plan.dailySummaries} summaries per day (resets every 24h)`}>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {plan.isLifetimeSummary ? (
                        <strong>1 AI summary forever</strong>
                      ) : (
                        <span>
                          <strong>{plan.dailySummaries} AI summary/day</strong> (24h reset)
                        </span>
                      )}
                    </span>
                  </li>
                  {plan.hasWeeklyDigest && (
                    <li className="flex items-start gap-2" title="Synthesizes full 7-day discussion archive">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Weekly Digest</span>
                    </li>
                  )}
                  {plan.hasPastSearch && (
                    <li className="flex items-start gap-2" title="Search through historical group message records">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Past Archive Search</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleCheckout(t)}
                  disabled={loadingTier !== null}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : isPro
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                  title={t === 'free' ? 'Switch to free tier' : `Checkout ${plan.name} plan on Flutterwave`}
                >
                  {loadingTier === t ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>
                      {isCurrent
                        ? t === 'free' ? 'Current Plan' : 'Renew with Flutterwave'
                        : t === 'free'
                        ? 'Select Free'
                        : `Upgrade to ${plan.name}`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-6">
        <span className="flex items-center gap-2" title="All payments encrypted and verified via Flutterwave standard gateway">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Secured by Flutterwave Live Payment Gateway (NGN)
        </span>
        <span className="flex items-center gap-2" title="Your 30-day countdown begins immediately upon payment confirmation">
          <Zap className="w-4 h-4 text-emerald-600" />
          Immediate 30-day automated account activation
        </span>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}

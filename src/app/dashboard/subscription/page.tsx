'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionTier, PLAN_LIMITS } from '@/types';

import { createClient } from '@/utils/supabase/client';

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('base');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    // Fetch accurately resolved tier from server endpoint
    fetch('/api/user/tier')
      .then((res) => res.json())
      .then((data) => {
        if (data?.tier && ['base', 'pro', 'max'].includes(data.tier)) {
          setCurrentTier(data.tier as SubscriptionTier);
        }
      })
      .catch((err) => console.error('[Tier fetch error]:', err));

    if (searchParams.get('payment') === 'success') {
      toast.success('Your subscription is active! Thank you for subscribing.');
    }
  }, [searchParams]);

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

  const tiers: Array<'base' | 'pro' | 'max'> = ['base', 'pro', 'max'];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Subscription & Plans
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select or upgrade your group monitoring tier with Flutterwave
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => {
          const plan = PLAN_LIMITS[t];
          const isCurrent = currentTier === t;
          const isPro = t === 'pro';

          return (
            <div
              key={t}
              className={`p-6 rounded-xl border transition-colors flex flex-col justify-between bg-white relative ${
                isCurrent
                  ? 'border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                  : isPro
                  ? 'border-gray-300 shadow-sm'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
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
                      Archive search of past discussions
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleCheckout(t)}
                  disabled={loadingTier !== null}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : isPro
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {loadingTier === t ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting Gateway...</span>
                    </>
                  ) : (
                    <span>{isCurrent ? 'Renew with Flutterwave' : `Upgrade to ${plan.name}`}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-6">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Secured by Flutterwave Payment Gateway
        </span>
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          Immediate feature activation
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

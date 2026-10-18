import { create } from 'zustand';
import { SubscriptionTier, PLAN_LIMITS, PlanFeature } from '@/types';

interface SubscriptionState {
  tier: SubscriptionTier;
  plan: PlanFeature;
  isExpired: boolean;
  expiresAt: string | null;
  secondsRemaining: number;
  paymentStatus: string;
  loading: boolean;
  setTierData: (data: {
    tier: SubscriptionTier;
    isExpired?: boolean;
    expiresAt?: string | null;
    secondsRemaining?: number;
    paymentStatus?: string;
  }) => void;
  fetchTier: () => Promise<void>;
  decrementTimer: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  plan: PLAN_LIMITS.free,
  isExpired: false,
  expiresAt: null,
  secondsRemaining: 0,
  paymentStatus: 'unpaid',
  loading: false,

  setTierData: (data) => {
    const tier = data.tier || 'free';
    set({
      tier,
      plan: PLAN_LIMITS[tier] || PLAN_LIMITS.free,
      isExpired: data.isExpired ?? false,
      expiresAt: data.expiresAt ?? null,
      secondsRemaining: data.secondsRemaining ?? 0,
      paymentStatus: data.paymentStatus ?? 'active',
    });
  },

  fetchTier: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/user/tier');
      if (res.ok) {
        const data = await res.json();
        const tier = (data?.tier || 'free') as SubscriptionTier;
        set({
          tier,
          plan: PLAN_LIMITS[tier] || PLAN_LIMITS.free,
          isExpired: !!data.isExpired,
          expiresAt: data.expiresAt || null,
          secondsRemaining: typeof data.secondsRemaining === 'number' ? data.secondsRemaining : 0,
          paymentStatus: data.paymentStatus || 'active',
        });
      }
    } catch (err) {
      console.warn('[Zustand SubscriptionStore] fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  decrementTimer: () => {
    const current = get().secondsRemaining;
    if (current <= 1) {
      set({ secondsRemaining: 0, isExpired: get().tier !== 'free' });
    } else {
      set({ secondsRemaining: current - 1 });
    }
  },
}));

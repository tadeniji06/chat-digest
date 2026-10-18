import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionTier } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ tier: 'free', isExpired: false }, { status: 401 });
    }

    const validTiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'max', 'enterprise'];

    // 1. Check direct fallback cookie
    const cookieStore = await cookies();
    const cookieSub = cookieStore.get('cd_sub_active')?.value;
    let cookieTier: SubscriptionTier | null = null;
    let cookieStatus: string | null = null;

    if (cookieSub) {
      const [cUserId, cTier, cStatus] = cookieSub.split(':');
      if (cUserId === user.id && validTiers.includes(cTier as SubscriptionTier)) {
        cookieTier = cTier as SubscriptionTier;
        cookieStatus = cStatus;
      }
    }

    // 2. Check public.users
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier, payment_status, subscription_expires_at')
      .eq('id', user.id)
      .maybeSingle();

    // 3. Check user.user_metadata
    const metaTier = user.user_metadata?.subscription_tier;
    const metaPayment = user.user_metadata?.payment_status;
    const metaExpiresAt = user.user_metadata?.subscription_expires_at;

    const resolvedTier: SubscriptionTier =
      (cookieTier ||
      profile?.subscription_tier ||
      metaTier ||
      'free') as SubscriptionTier;

    const paymentStatus =
      profile?.payment_status ||
      (cookieStatus === 'active' ? 'active' : null) ||
      metaPayment ||
      (resolvedTier === 'free' ? 'active' : 'unpaid');

    const expiresAt =
      profile?.subscription_expires_at ||
      metaExpiresAt ||
      null;

    let isExpired = false;
    let secondsRemaining = 0;

    if (resolvedTier !== 'free' && expiresAt) {
      const expTime = new Date(expiresAt).getTime();
      const now = Date.now();
      if (now > expTime) {
        isExpired = true;
        secondsRemaining = 0;
      } else {
        secondsRemaining = Math.max(0, Math.floor((expTime - now) / 1000));
      }
    }

    return NextResponse.json({
      tier: isExpired ? 'free' : resolvedTier,
      rawTier: resolvedTier,
      isExpired,
      expiresAt,
      secondsRemaining,
      paymentStatus,
    });
  } catch (err: unknown) {
    return NextResponse.json({ tier: 'free', isExpired: false, secondsRemaining: 0 });
  }
}

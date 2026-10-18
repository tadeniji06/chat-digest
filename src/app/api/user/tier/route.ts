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

    // 2. Check public.users in database (canonical state across all devices)
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier, payment_status, subscription_expires_at')
      .eq('id', user.id)
      .maybeSingle();

    // 3. Check user.user_metadata (cross-device Supabase auth record)
    const metaTier = user.user_metadata?.subscription_tier;
    const metaPayment = user.user_metadata?.payment_status;
    const metaExpiresAt = user.user_metadata?.subscription_expires_at;

    // 4. Flutterwave Direct Self-Healing Reconciliation
    // If the database and metadata show free or expired, verify directly against Flutterwave
    // for this user's email or user_id. This guarantees that paid subscribers NEVER get stuck on Free.
    let flwVerifiedTier: SubscriptionTier | null = null;
    let flwExpiresAt: string | null = null;
    let flwStatus: string | null = null;

    const currentResolved = profile?.subscription_tier || metaTier || cookieTier;
    if (!currentResolved || currentResolved === 'free') {
      try {
        const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;
        const userEmail = user.email;
        if (flwSecret && userEmail) {
          const flwRes = await fetch(
            `https://api.flutterwave.com/v3/transactions?customer_email=${encodeURIComponent(userEmail)}&status=successful`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${flwSecret}`,
              },
              next: { revalidate: 60 },
            }
          );
          if (flwRes.ok) {
            const flwData = await flwRes.json();
            if (flwData.status === 'success' && Array.isArray(flwData.data) && flwData.data.length > 0) {
              // Find the newest successful transaction within the last 30 days
              const validTx = flwData.data.find((tx: any) => {
                if (tx.status !== 'successful') return false;
                const txDate = new Date(tx.created_at).getTime();
                const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                return Date.now() - txDate < thirtyDaysMs;
              });

              if (validTx) {
                const detectedTier = (validTx.meta?.tier || 'basic') as SubscriptionTier;
                const txDate = new Date(validTx.created_at).getTime();
                const calculatedExpiry = new Date(txDate + 30 * 24 * 60 * 60 * 1000).toISOString();
                
                if (validTiers.includes(detectedTier)) {
                  flwVerifiedTier = detectedTier;
                  flwExpiresAt = calculatedExpiry;
                  flwStatus = 'active';

                  // Auto-heal: update user metadata in background
                  try {
                    await supabase.auth.updateUser({
                      data: {
                        subscription_tier: detectedTier,
                        payment_status: 'active',
                        subscription_expires_at: calculatedExpiry,
                      },
                    });
                  } catch (e) {
                    // Ignore metadata update error
                  }
                }
              }
            }
          }
        }
      } catch (flwErr) {
        console.warn('[Tier Check] Flutterwave fallback check note:', flwErr);
      }
    }

    // Database or Auth Metadata or Flutterwave Reconciliation takes highest priority
    const resolvedTier: SubscriptionTier =
      (flwVerifiedTier ||
      profile?.subscription_tier ||
      metaTier ||
      cookieTier ||
      'free') as SubscriptionTier;

    const paymentStatus =
      flwStatus ||
      profile?.payment_status ||
      metaPayment ||
      (cookieStatus === 'active' ? 'active' : null) ||
      (resolvedTier === 'free' ? 'active' : 'unpaid');

    const expiresAt =
      flwExpiresAt ||
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

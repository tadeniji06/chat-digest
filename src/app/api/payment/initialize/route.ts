import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PLAN_LIMITS, SubscriptionTier } from '@/types';

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('[Payment Initialize] Incoming request, user:', user?.id || 'NO_USER');

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to complete checkout' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { tier } = body;
    console.log('[Payment Initialize] Requested tier:', tier);

    const paidTiers: SubscriptionTier[] = ['basic', 'pro', 'max', 'enterprise'];
    const tierRanks: Record<SubscriptionTier, number> = {
      free: 0,
      basic: 1,
      pro: 2,
      max: 3,
      enterprise: 4,
    };

    // Determine current user tier and expiry
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .maybeSingle();

    const currentTier = (userProfile?.subscription_tier || user.user_metadata?.subscription_tier || 'free') as SubscriptionTier;
    const expiresAt = userProfile?.subscription_expires_at || user.user_metadata?.subscription_expires_at;
    const isCurrentActive = currentTier !== 'free' && expiresAt ? new Date(expiresAt).getTime() > Date.now() : false;

    // Disallow switching to free or downgrading while on an active plan
    if (tier === 'free') {
      if (currentTier === 'free') {
        return NextResponse.json({ error: 'You are already on the Free plan.' }, { status: 400 });
      }
      return NextResponse.json(
        { error: 'Downgrades are not supported. Your current plan remains active until the end of your billing cycle.' },
        { status: 400 }
      );
    }

    if (!tier || !paidTiers.includes(tier as SubscriptionTier)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Check for downgrade attempt
    if (isCurrentActive && tierRanks[tier as SubscriptionTier] < tierRanks[currentTier]) {
      return NextResponse.json(
        {
          error: `Downgrading from ${PLAN_LIMITS[currentTier]?.name} to ${PLAN_LIMITS[tier as SubscriptionTier]?.name} is not allowed. You can only upgrade your plan.`,
        },
        { status: 400 }
      );
    }

    const selectedPlan = PLAN_LIMITS[tier as SubscriptionTier];
    const origin = new URL(request.url).origin;
    const tx_ref = `cd_${user.id.slice(0, 8)}_${Date.now()}`;

    // Flutterwave standard payment initialization
    const flwPayload = {
      tx_ref,
      amount: selectedPlan.amount,
      currency: 'NGN',
      payment_options: 'card,banktransfer,ussd,account',
      redirect_url: `${origin}/api/payment/callback`,
      meta: {
        user_id: user.id,
        tier: selectedPlan.tier,
      },
      customer: {
        email: user.email || 'customer@chatdigest.app',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'ChatDigest Subscriber',
      },
      customizations: {
        title: `ChatDigest ${selectedPlan.name} Subscription`,
        description: selectedPlan.description,
        ...(origin.startsWith('https://') ? { logo: `${origin}/favico.png` } : {}),
      },
    };

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FLW_SECRET}`,
      },
      body: JSON.stringify(flwPayload),
    });

    const data = await response.json();

    if (data.status !== 'success' || !data.data?.link) {
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment gateway' },
        { status: 502 }
      );
    }

    // Save initial transaction state in supabase if transactions table exists or return link
    return NextResponse.json({
      link: data.data.link,
      tx_ref,
    });
  } catch (err: unknown) {
    console.error('[Payment Initialize Error]:', err);
    const message = err instanceof Error ? err.message : 'Payment initialization error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

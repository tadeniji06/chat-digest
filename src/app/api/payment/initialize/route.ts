import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PLAN_LIMITS } from '@/types';

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

    if (!tier || !['base', 'pro', 'max'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const selectedPlan = PLAN_LIMITS[tier as 'base' | 'pro' | 'max'];
    const origin = new URL(request.url).origin;
    const tx_ref = `cd_${user.id.slice(0, 8)}_${Date.now()}`;

    // Flutterwave standard payment initialization
    const flwPayload = {
      tx_ref,
      amount: selectedPlan.amount,
      currency: 'NGN',
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

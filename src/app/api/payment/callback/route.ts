import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const status = searchParams.get('status');
  const tx_ref = searchParams.get('tx_ref');
  const transaction_id = searchParams.get('transaction_id');

  console.log('[Flutterwave Callback] Incoming params:', { status, tx_ref, transaction_id });

  if (status === 'cancelled') {
    return NextResponse.redirect(`${origin}/subscribe?cancelled=true`);
  }

  if (!transaction_id) {
    return NextResponse.redirect(`${origin}/subscribe?error=missing_transaction_id`);
  }

  try {
    // Verify transaction with Flutterwave API
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FLW_SECRET}`,
        },
      }
    );

    const verifyData = await verifyRes.json();
    console.log('[Flutterwave Verification]:', JSON.stringify(verifyData));

    if (
      verifyData.status === 'success' &&
      verifyData.data?.status === 'successful'
    ) {
      const supabase = await createClient();
      let userId = verifyData.data.meta?.user_id;
      const tier = (verifyData.data.meta?.tier || 'basic') as string;

      const customerEmail = verifyData.data.customer?.email;
      // Fallback: if user_id was not in meta, get current logged in user
      if (!userId) {
        const { data: authUser } = await supabase.auth.getUser();
        userId = authUser.user?.id;
      }

      console.log('[Flutterwave Success] Updating user subscription:', { userId, customerEmail, tier });

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Try updating user in public.users if table exists and authenticated
      if (userId) {
        try {
          await supabase
            .from('users')
            .upsert({
              id: userId,
              email: customerEmail || 'user@chatdigest.app',
              subscription_tier: tier,
              payment_status: 'active',
              subscription_expires_at: expiresAt,
            });
        } catch (dbErr) {
          console.warn('[Database update catch]:', dbErr);
        }

        // 2. Also persist payment status in user_metadata so gating works seamlessly
        try {
          await supabase.auth.updateUser({
            data: {
              subscription_tier: tier,
              payment_status: 'active',
              subscription_expires_at: expiresAt,
            },
          });
        } catch (authErr) {
          console.warn('[auth.updateUser catch]:', authErr);
        }
      }

      const response = NextResponse.redirect(`${origin}/dashboard/subscription?payment=success`);
      // 3. Set a direct secure HTTP-only active payment cookie as bulletproof session fallback
      if (userId) {
        response.cookies.set('cd_sub_active', `${userId}:${tier}:active`, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });
      }

      return response;
    } else {
      console.error('[Flutterwave Verification failed]:', verifyData);
      return NextResponse.redirect(`${origin}/subscribe?error=verification_failed`);
    }
  } catch (err: unknown) {
    console.error('[Flutterwave Callback Exception]:', err);
    return NextResponse.redirect(`${origin}/subscribe?error=verification_exception`);
  }
}

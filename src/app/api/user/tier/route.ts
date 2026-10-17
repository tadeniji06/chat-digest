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
      return NextResponse.json({ tier: 'none' }, { status: 401 });
    }

    // 1. Check direct fallback cookie
    const cookieStore = await cookies();
    const cookieSub = cookieStore.get('cd_sub_active')?.value;
    let cookieTier: SubscriptionTier | null = null;
    if (cookieSub) {
      const [cUserId, cTier] = cookieSub.split(':');
      if (cUserId === user.id && ['base', 'pro', 'max'].includes(cTier)) {
        cookieTier = cTier as SubscriptionTier;
      }
    }

    // 2. Check public.users
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle();

    // 3. Check user.user_metadata
    const metaTier = user.user_metadata?.subscription_tier;

    const resolvedTier =
      cookieTier ||
      profile?.subscription_tier ||
      metaTier ||
      'base';

    return NextResponse.json({ tier: resolvedTier });
  } catch (err: unknown) {
    return NextResponse.json({ tier: 'base' });
  }
}

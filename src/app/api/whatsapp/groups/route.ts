import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionTier, PLAN_LIMITS } from '@/types';

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:5001';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch monitored groups from Supabase with user auth context
    const { data: dbMonitored } = await supabase
      .from('monitored_groups')
      .select('*')
      .eq('user_id', user.id);

    const monitoredMap = new Map((dbMonitored || []).map((m: any) => [m.group_jid, m]));

    // Proactively push monitored groups from DB to bridge session
    if (dbMonitored && dbMonitored.length > 0) {
      for (const dg of dbMonitored) {
        fetch(`${BRIDGE_URL}/api/session/${user.id}/monitored-groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupJid: dg.group_jid,
            groupName: dg.group_name,
            keywords: dg.keywords || [],
            isActive: dg.is_active !== false,
          }),
        }).catch(() => {});
      }
    }

    // 2. Call bridge to fetch groups from active WhatsApp connection
    let liveGroups: any[] = [];
    let isLive = false;

    try {
      const res = await fetch(`${BRIDGE_URL}/api/session/${user.id}/groups`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.groups) {
          liveGroups = data.groups;
          isLive = true;
        }
      }
    } catch {
      // Bridge connection fallback
    }

    // Merge live WhatsApp groups with database monitored groups
    const seenJids = new Set<string>();
    const combined: any[] = [];

    // Add all live WhatsApp groups
    for (const g of liveGroups) {
      seenJids.add(g.id);
      const isMonitored = monitoredMap.has(g.id);
      combined.push({
        id: g.id,
        name: g.name,
        isMonitored,
        keywords: isMonitored ? monitoredMap.get(g.id)?.keywords || [] : g.keywords || [],
      });
    }

    // Also include any monitored groups from DB that weren't returned by bridge yet
    for (const m of dbMonitored || []) {
      if (!seenJids.has(m.group_jid)) {
        combined.push({
          id: m.group_jid,
          name: m.group_name,
          isMonitored: true,
          keywords: m.keywords || [],
        });
      }
    }

    return NextResponse.json({
      groups: combined,
      isLive,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve groups';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupJid, groupName, keywords, isActive } = body;

    if (!groupJid || !groupName) {
      return NextResponse.json({ error: 'groupJid and groupName required' }, { status: 400 });
    }

    // Check user tier limits and expiration
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieSub = cookieStore.get('cd_sub_active')?.value;
    const validTiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'max', 'enterprise'];
    let cookieTier: SubscriptionTier | null = null;
    if (cookieSub) {
      const [cUserId, cTier] = cookieSub.split(':');
      if (cUserId === user.id && validTiers.includes(cTier as SubscriptionTier)) {
        cookieTier = cTier as SubscriptionTier;
      }
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .maybeSingle();

    let flwTier: SubscriptionTier | null = null;
    let flwExpiresAt: string | null = null;
    const currentInitial = cookieTier || userProfile?.subscription_tier || user.user_metadata?.subscription_tier;
    if (!currentInitial || currentInitial === 'free') {
      try {
        const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;
        if (flwSecret && user.email) {
          const flwRes = await fetch(
            `https://api.flutterwave.com/v3/transactions?customer_email=${encodeURIComponent(user.email)}&status=successful`,
            { headers: { Authorization: `Bearer ${flwSecret}` } }
          );
          if (flwRes.ok) {
            const flwData = await flwRes.json();
            const validTx = flwData.data?.find((tx: any) => tx.status === 'successful' && (Date.now() - new Date(tx.created_at).getTime() < 30 * 24 * 60 * 60 * 1000));
            if (validTx) {
              const detectedTier = (validTx.meta?.tier || 'basic') as SubscriptionTier;
              if (validTiers.includes(detectedTier)) {
                flwTier = detectedTier;
                flwExpiresAt = new Date(new Date(validTx.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
              }
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    const expiresAt = flwExpiresAt || userProfile?.subscription_expires_at || user.user_metadata?.subscription_expires_at;
    let isExpired = false;
    if (expiresAt) {
      if (Date.now() > new Date(expiresAt).getTime()) {
        isExpired = true;
      }
    }

    const rawTier: SubscriptionTier =
      (flwTier ||
      cookieTier ||
      userProfile?.subscription_tier ||
      user.user_metadata?.subscription_tier ||
      'free') as SubscriptionTier;

    const tier: SubscriptionTier = isExpired ? 'free' : rawTier;
    const plan = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

    // Validate keywords count per group according to tier allowance
    const sanitizedKeywords = (keywords || []).map((k: string) => k.trim()).filter(Boolean);
    if (sanitizedKeywords.length > plan.keywordsPerGroup) {
      return NextResponse.json(
        {
          error: `Your ${plan.name} plan allows up to ${plan.keywordsPerGroup} keywords per group. You submitted ${sanitizedKeywords.length}. Please upgrade to add more keywords.`,
        },
        { status: 403 }
      );
    }

    // Check how many groups already monitored
    const { count } = await supabase
      .from('monitored_groups')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // If adding a new group (not updating) and limit reached:
    const { data: existing } = await supabase
      .from('monitored_groups')
      .select('id')
      .eq('user_id', user.id)
      .eq('group_jid', groupJid)
      .maybeSingle();

    if (!existing && (count || 0) >= plan.maxGroups) {
      return NextResponse.json(
        {
          error: `Your current plan (${plan.name}) allows monitoring up to ${plan.maxGroups} group(s). Please upgrade your subscription to monitor more groups.`,
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('monitored_groups')
      .upsert(
        {
          user_id: user.id,
          group_jid: groupJid,
          group_name: groupName,
          keywords: keywords || [],
          is_active: isActive !== undefined ? isActive : true,
        },
        { onConflict: 'user_id, group_jid' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Proactively sync into bridge-service in-memory monitor
    fetch(`${BRIDGE_URL}/api/session/${user.id}/monitored-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupJid,
        groupName,
        keywords: keywords || [],
        isActive: isActive !== undefined ? isActive : true,
      }),
    }).catch(() => {});

    return NextResponse.json({ group: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating group';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupJid = searchParams.get('groupJid');

    if (!groupJid) {
      return NextResponse.json({ error: 'groupJid is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('monitored_groups')
      .delete()
      .eq('user_id', user.id)
      .eq('group_jid', groupJid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync deletion into bridge-service in-memory monitor
    fetch(`${BRIDGE_URL}/api/session/${user.id}/monitored-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupJid,
        isActive: false,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error removing monitored group';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

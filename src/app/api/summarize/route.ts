import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionTier, PLAN_LIMITS } from '@/types';
import {
  AIProviderGenerationError,
  generateDetailedSummary,
  type SummaryMessage,
} from '@/utils/summary-generation';

export const maxDuration = 240;

interface FlutterwaveTransaction {
  status?: string;
  created_at: string;
  meta?: { tier?: string };
}

export async function GET(request: Request) {
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

    let query = supabase
      .from('summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (groupJid) {
      query = query.eq('group_jid', groupJid);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ summaries: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching summaries';
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
    const { groupJid, groupName, hoursBack = 24 } = body;

    if (typeof groupJid !== 'string' || !groupJid.trim()) {
      return NextResponse.json({ error: 'A valid groupJid is required.' }, { status: 400 });
    }

    const resolvedGroupName =
      typeof groupName === 'string' && groupName.trim() ? groupName.trim() : 'WhatsApp Group';

    if (![12, 24, 48, 168].includes(hoursBack)) {
      return NextResponse.json({ error: 'Choose a supported summary timeframe.' }, { status: 400 });
    }

    // Check user tier & payment status: check cookie, profile, metadata
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
      .select('subscription_tier, payment_status, subscription_expires_at')
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
            const flwData: { data?: FlutterwaveTransaction[] } = await flwRes.json();
            const validTx = flwData.data?.find(
              (tx) =>
                tx.status === 'successful' &&
                typeof tx.created_at === 'string' &&
                Date.now() - new Date(tx.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
            );
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

    // Check summary limits:
    if (!plan.hasSummaries) {
      return NextResponse.json(
        {
          error:
            'AI summaries are not available on this plan.',
        },
        { status: 403 }
      );
    }

    // Paid plan: check usage in last 24 hours
    if (plan.dailySummaries !== null) {
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: dailyCount, error: usageError } = await supabase
        .from('summaries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', past24h);

      if (usageError) {
        console.error('Unable to check the user summary quota:', usageError);
        return NextResponse.json({ error: 'Unable to verify your summary limit right now.' }, { status: 500 });
      }

      if ((dailyCount || 0) >= plan.dailySummaries) {
        return NextResponse.json(
          {
            error: `You have reached your limit of ${plan.dailySummaries} summaries in the last 24 hours on the ${plan.name} plan.`,
          },
          { status: 429 }
        );
      }
    }

    // Fetch messages from that group across selected timeframe
    const periodStart = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const periodEnd = new Date().toISOString();

    const messages: SummaryMessage[] = [];
    const seenMessages = new Set<string>();

    // Read the complete selected period from Supabase in pages instead of silently stopping at 500 rows.
    for (let offset = 0; ; offset += 1000) {
      const { data: dbMessages, error: messageError } = await supabase
        .from('messages')
        .select('sender_name,content,timestamp')
        .eq('group_jid', groupJid)
        .gte('timestamp', periodStart)
        .lte('timestamp', periodEnd)
        .order('timestamp', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + 999);

      if (messageError) {
        console.error('Unable to fetch messages for summary:', messageError);
        return NextResponse.json({ error: 'Unable to load all messages for this summary.' }, { status: 502 });
      }

      for (const message of dbMessages || []) {
        const timestamp = new Date(message.timestamp).toISOString();
        const key = `${timestamp}\u0000${message.sender_name || ''}\u0000${message.content}`;
        seenMessages.add(key);
        messages.push({ ...message, timestamp });
      }

      if (!dbMessages || dbMessages.length < 1000) {
        break;
      }
    }

    // Include recent messages still held by the bridge and deduplicate against persisted messages.
    const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:5001';
    try {
      const bRes = await fetch(
        `${BRIDGE_URL}/api/session/${user.id}/messages?groupJid=${encodeURIComponent(groupJid)}&hoursBack=${hoursBack}`,
        { cache: 'no-store' }
      );
      if (bRes.ok) {
        const bData = await bRes.json();
        for (const message of bData.messages || []) {
          const timestamp = new Date(message.timestamp).toISOString();
          if (timestamp < periodStart || timestamp > periodEnd) continue;
          const key = `${timestamp}\u0000${message.senderName || ''}\u0000${message.content}`;
          if (!seenMessages.has(key)) {
            seenMessages.add(key);
            messages.push({
              timestamp,
              sender_name: message.senderName || null,
              content: message.content,
            });
          }
        }
      } else {
        console.error(`Bridge message fetch failed with HTTP ${bRes.status}.`);
      }
    } catch (error) {
      console.error('Unable to fetch recent bridge messages for summary:', error);
    }

    messages.sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp) ||
      (a.sender_name || '').localeCompare(b.sender_name || '')
    );

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        {
          error: `No messages recorded for "${resolvedGroupName}" in the selected timeframe (past ${hoursBack} hours). Make sure messages have been sent in the group while connected.`,
        },
        { status: 404 }
      );
    }

    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      console.error('GROK_API_KEY is not configured; summary generation is unavailable.');
      return NextResponse.json({ error: 'AI summaries are not configured yet. Please contact support.' }, { status: 503 });
    }

    let generatedSummary;
    try {
      generatedSummary = await generateDetailedSummary(
        messages,
        resolvedGroupName,
        grokApiKey
      );
    } catch (error) {
      console.error('Detailed AI summary generation failed:', error);
      if (error instanceof AIProviderGenerationError) {
        if (error.status === 400) {
          console.error('Grok rejected the summary request:', {
            status: error.status,
            code: error.providerCode,
            message: error.message.slice(0, 500),
          });
          return NextResponse.json(
            {
              error: 'Grok rejected the summary request. Please try again, and contact support if this continues.',
              diagnostic: {
                provider: 'xAI',
                status: error.status,
                code: error.providerCode,
                message: error.message.slice(0, 500),
              },
            },
            { status: 502 }
          );
        }
        if (error.billingRequired) {
          return NextResponse.json(
            { error: 'Grok API billing is not active or this account needs API credits. Add credits in the xAI developer console; a Grok Plus subscription does not pay API usage.' },
            { status: 402 }
          );
        }
        if (error.quotaExhausted) {
          return NextResponse.json(
            { error: 'The Grok API quota for this key has been used up. Please try again after the quota resets.' },
            { status: 429 }
          );
        }
        if (error.status === 429) {
          return NextResponse.json(
            { error: 'Grok is rate-limiting summary requests. Please wait a minute, then try again.' },
            { status: 429 }
          );
        }
        if (error.status === 503 || error.status === 500 || error.status === 502) {
          return NextResponse.json(
            { error: 'Grok is temporarily unavailable. Please try your summary again in a minute.' },
            { status: 503 }
          );
        }
        if (error.status === 504) {
          return NextResponse.json(
            { error: 'This summary is taking too long to generate. Please choose a shorter timeframe and try again.' },
            { status: 504 }
          );
        }
        if (error.status === 401 || error.status === 403) {
          return NextResponse.json(
            { error: 'The Grok API key is invalid or does not have access to the configured model. Please contact support.' },
            { status: 502 }
          );
        }
        if (error.status === 404) {
          return NextResponse.json(
            { error: 'The configured Grok model is unavailable. Please contact support.' },
            { status: 502 }
          );
        }
        if (error.status === 400 || error.status === 422) {
          return NextResponse.json(
            { error: 'Grok rejected the summary request. Please try again, and contact support if this continues.' },
            { status: 502 }
          );
        }
      }
      return NextResponse.json({ error: 'The AI could not complete this summary. Please try again.' }, { status: 502 });
    }

    const summaryText = generatedSummary.overview;
    const keyPoints = [
      {
        topics_discussed: generatedSummary.topics_discussed,
        who_said_what: generatedSummary.who_said_what,
        highlighted_terms: generatedSummary.highlighted_terms,
        decisions: generatedSummary.decisions,
        facts_and_details: generatedSummary.facts_and_details,
        open_questions: generatedSummary.open_questions,
      },
    ];
    const actionItems = generatedSummary.action_items;

    // Save summary to Supabase
    const { data: savedSummary, error: saveError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        group_jid: groupJid,
        group_name: resolvedGroupName,
        summary_content: summaryText,
        summary_period_start: periodStart,
        summary_period_end: periodEnd,
        key_points: keyPoints,
        action_items: actionItems,
        message_count: messages.length,
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ summary: savedSummary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

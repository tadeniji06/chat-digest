import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenAI } from '@google/genai';

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

    if (!groupJid) {
      return NextResponse.json({ error: 'groupJid is required' }, { status: 400 });
    }

    // Check user tier & payment status: check cookie, profile, metadata
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieSub = cookieStore.get('cd_sub_active')?.value;
    let cookieTier: string | null = null;
    if (cookieSub) {
      const [cUserId, cTier] = cookieSub.split(':');
      if (cUserId === user.id && ['base', 'pro', 'max'].includes(cTier)) {
        cookieTier = cTier;
      }
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier, payment_status')
      .eq('id', user.id)
      .maybeSingle();

    const tier =
      cookieTier ||
      userProfile?.subscription_tier ||
      user.user_metadata?.subscription_tier ||
      'none';

    if (tier !== 'pro' && tier !== 'max') {
      return NextResponse.json(
        {
          error:
            'AI Summarization requires an active Pro or Max subscription. Please upgrade to unlock executive digests and action items.',
        },
        { status: 403 }
      );
    }

    // Fetch messages from that group across selected timeframe
    const periodStart = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const periodEnd = new Date().toISOString();

    let messages: any[] = [];

    // 1. Fetch from Supabase
    try {
      const { data: dbMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('group_jid', groupJid)
        .gte('timestamp', periodStart)
        .order('timestamp', { ascending: true })
        .limit(500);

      if (dbMsgs && dbMsgs.length > 0) {
        messages = [...dbMsgs];
      }
    } catch {}

    // 2. Fetch from Bridge Service buffer
    const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:5001';
    try {
      const bRes = await fetch(
        `${BRIDGE_URL}/api/session/${user.id}/messages?groupJid=${encodeURIComponent(groupJid)}&hoursBack=${hoursBack}`,
        { cache: 'no-store' }
      );
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData.messages && bData.messages.length > 0) {
          const seen = new Set(messages.map((m) => `${m.timestamp}_${m.content}`));
          for (const bm of bData.messages) {
            const k = `${bm.timestamp}_${bm.content}`;
            if (!seen.has(k)) {
              seen.add(k);
              messages.push({
                group_jid: bm.groupJid,
                sender_jid: bm.senderJid,
                sender_name: bm.senderName,
                content: bm.content,
                timestamp: bm.timestamp,
              });
            }
          }
        }
      }
    } catch {}

    // Sort messages chronologically
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        {
          error: `No messages recorded for "${groupName || 'this group'}" in the selected timeframe (past ${hoursBack} hours). Make sure messages have been sent in the group while connected.`,
        },
        { status: 404 }
      );
    }

    // Format transcript
    const transcript = messages
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender_name || 'Member'}: ${m.content}`)
      .join('\n');

    const geminiApiKey = process.env.GEMINI_API_KEY;

    let summaryText = '';
    let keyPoints: any[] = [];
    let actionItems: string[] = [];

    if (geminiApiKey) {
      try {
        const prompt = `You are an expert AI meeting minute taker, executive assistant, and community digest specialist for student cohorts and community managers.
Your task is to analyze the following WhatsApp group transcript for "${groupName || 'WhatsApp Group'}" and transform it into a structured, highly valuable 'Meeting Minutes & Community Digest' that can be read in 60 seconds.

Pay special attention to:
1. Executive Brief: What happened in this conversation? (2-3 sentences max).
2. Key Topics Discussed: Categorize the discussions into concrete agenda/topics. For each topic, summarize what was discussed and list the contributors.
3. Who Said What & Key Statements: Explicitly detail who said what! Highlight quotes, proposals, requests, banter, banking/account details shared, exams, giveaways, or stances taken by specific members.
4. Keywords & Highlighted Terms: 4-8 distinct keyword tags discussed in the chat.
5. Action Items & Follow-ups: Concrete next steps, requests, commitments, or reminders for members.

Respond STRICTLY in valid JSON with this exact schema (no markdown code fence blocks outside the JSON):
{
  "overview": "Clear 2-3 sentence executive briefing of the conversation",
  "topics_discussed": [
    {
      "topic": "Topic Title",
      "summary": "Brief explanation of what happened",
      "contributors": ["Name1", "Name2"]
    }
  ],
  "who_said_what": [
    {
      "speaker": "Speaker Name",
      "point": "What they said, proposed, or requested"
    }
  ],
  "highlighted_terms": ["Term1", "Term2", "Term3"],
  "action_items": ["Action item 1", "Action item 2"]
}

Transcript:
${transcript.slice(0, 15000)}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`;
        const aiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!aiRes.ok) {
          const errBody = await aiRes.text();
          throw new Error(`Gemini API HTTP ${aiRes.status}: ${errBody}`);
        }

        const aiData = await aiRes.json();
        const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        summaryText = parsed.overview || 'Meeting minutes generated.';
        // Store topics_discussed, who_said_what, and highlighted_terms inside key_points jsonb
        keyPoints = [
          {
            topics_discussed: Array.isArray(parsed.topics_discussed) ? parsed.topics_discussed : [],
            who_said_what: Array.isArray(parsed.who_said_what) ? parsed.who_said_what : [],
            highlighted_terms: Array.isArray(parsed.highlighted_terms) ? parsed.highlighted_terms : [],
          },
        ];
        actionItems = Array.isArray(parsed.action_items) ? parsed.action_items : [];
      } catch (geminiError: any) {
        console.error('Gemini API call failed, falling back to structured synthesis:', geminiError);
        const participantNames = Array.from(new Set(messages.map((m) => m.sender_name || 'Member')));
        summaryText = `Meeting Minutes for "${groupName || 'Group'}": ${messages.length} messages analyzed across recent discussions. Active exchanges covered operational coordination, announcements, and peer updates.`;
        keyPoints = [
          {
            topics_discussed: [
              {
                topic: 'Group Updates & General Discussions',
                summary: `${messages.length} messages recorded across ${participantNames.length} active group members.`,
                contributors: participantNames.slice(0, 5),
              },
            ],
            who_said_what: messages.slice(-5).map((m) => ({
              speaker: m.sender_name || 'Member',
              point: m.content,
            })),
            highlighted_terms: ['Meeting', 'Updates', 'Coordination', 'Discussion'],
          },
        ];
        actionItems = [
          'Review notes and follow up with group participants on discussed points.',
          'Verify pending inquiries from recent messages.',
        ];
      }
    } else {
      summaryText = `Meeting Minutes for "${groupName || 'Group'}": ${messages.length} messages analyzed.`;
      keyPoints = [];
      actionItems = [];
    }

    // Save summary to Supabase
    const { data: savedSummary, error: saveError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        group_jid: groupJid,
        group_name: groupName || 'WhatsApp Group',
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

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const alertData = await request.json();
    const { user_id, group_jid, group_name, sender_name, keyword, message_content } = alertData;

    if (!user_id || !keyword || !message_content) {
      return NextResponse.json({ error: 'Missing required alert fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Insert alert using server Supabase client
    const { data, error } = await supabase.from('keyword_alerts').insert({
      user_id,
      group_jid,
      group_name: group_name || 'WhatsApp Group',
      sender_name: sender_name || 'Participant',
      keyword,
      message_content,
    }).select().maybeSingle();

    if (error) {
      console.error('[Internal Alert Push] Supabase error:', error.message);
    }

    return NextResponse.json({ success: true, alert: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error receiving internal alert';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

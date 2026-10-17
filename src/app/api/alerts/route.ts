import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: dbAlerts } = await supabase
      .from('keyword_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:5001';
    let bridgeAlerts: any[] = [];
    try {
      const bRes = await fetch(`${BRIDGE_URL}/api/session/${user.id}/alerts`, { cache: 'no-store' });
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData.alerts) {
          bridgeAlerts = bData.alerts.map((a: any) => ({
            id: a.id,
            user_id: user.id,
            group_jid: a.groupJid,
            group_name: a.groupName,
            sender_name: a.senderName,
            keyword: a.keyword,
            message_content: a.messageContent,
            created_at: a.createdAt,
          }));
        }
      }
    } catch {}

    // Merge and deduplicate by message_content + keyword + group_jid
    const combined = [...(dbAlerts || [])];
    const seen = new Set(combined.map((a) => `${a.group_jid}_${a.keyword}_${a.message_content}`));

    for (const ba of bridgeAlerts) {
      const key = `${ba.group_jid}_${ba.keyword}_${ba.message_content}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(ba);
      }
    }

    // Sort newest first and limit to first 10
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const limitedAlerts = combined.slice(0, 10);

    return NextResponse.json({ alerts: limitedAlerts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching alerts';
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Alert id required' }, { status: 400 });
    }

    await supabase.from('keyword_alerts').delete().eq('id', id).eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error deleting alert';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

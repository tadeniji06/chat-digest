import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

    // Get session status from DB first
    let { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Query bridge service for live status
    try {
      const bridgeRes = await fetch(`${BRIDGE_URL}/api/session/${user.id}/status`, {
        cache: 'no-store',
      });
      if (bridgeRes.ok) {
        const bridgeData = await bridgeRes.json();
        
        // If bridge is connected but DB is missing it or out of sync, sync to DB
        if (bridgeData.status === 'connected') {
          if (!session || session.status !== 'connected') {
            const { data: updatedSession } = await supabase
              .from('whatsapp_sessions')
              .upsert(
                {
                  user_id: user.id,
                  status: 'connected',
                  phone_number: bridgeData.phoneNumber || null,
                  push_name: bridgeData.pushName || null,
                  last_active: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              )
              .select('*')
              .maybeSingle();

            if (updatedSession) {
              session = updatedSession;
            } else {
              session = {
                user_id: user.id,
                status: 'connected',
                phone_number: bridgeData.phoneNumber,
                push_name: bridgeData.pushName,
              };
            }
          }
        }

        return NextResponse.json({
          session: session || { status: bridgeData.status, phone_number: bridgeData.phoneNumber, push_name: bridgeData.pushName },
          bridgeStatus: bridgeData,
        });
      }
    } catch {
      // Bridge might not be running yet
    }

    return NextResponse.json({
      session: session || null,
      bridgeStatus: { status: session?.status || 'disconnected' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
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

    const body = await request.json().catch(() => ({}));
    const { action, phoneNumber } = body;

    // Handle pairing code request for single-device linking
    if (action === 'pairing-code' && phoneNumber) {
      const res = await fetch(`${BRIDGE_URL}/api/session/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phoneNumber }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { error: `Bridge service returned: ${errorText}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    // Call bridge service to start a new session QR generation
    const res = await fetch(`${BRIDGE_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Bridge service returned: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect to WhatsApp Bridge';
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

    await fetch(`${BRIDGE_URL}/api/session/${user.id}/logout`, {
      method: 'POST',
    }).catch(() => {});

    await supabase.from('whatsapp_sessions').delete().eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error logging out session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

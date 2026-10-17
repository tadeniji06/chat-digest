import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
    const { tier } = body;

    if (!['base', 'pro', 'max'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ subscription_tier: tier })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

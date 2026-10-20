import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type RouteContext = {
  params: Promise<{ summaryId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { summaryId } = await params;
  const { data: summary, error: lookupError } = await supabase
    .from('summaries')
    .select('share_token')
    .eq('id', summaryId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (lookupError) {
    console.error('Unable to look up summary share state:', lookupError);
    return NextResponse.json({ error: 'Unable to create a share link.' }, { status: 500 });
  }
  if (!summary) {
    return NextResponse.json({ error: 'Summary not found.' }, { status: 404 });
  }
  if (summary.share_token) {
    return NextResponse.json({ shareToken: summary.share_token });
  }

  const shareToken = randomBytes(32).toString('base64url');
  const { data: updatedSummary, error: updateError } = await supabase
    .from('summaries')
    .update({ share_token: shareToken })
    .eq('id', summaryId)
    .eq('user_id', user.id)
    .is('share_token', null)
    .select('share_token')
    .maybeSingle();

  if (updateError) {
    console.error('Unable to enable summary sharing:', updateError);
    return NextResponse.json({ error: 'Unable to create a share link.' }, { status: 500 });
  }

  if (updatedSummary?.share_token) {
    return NextResponse.json({ shareToken: updatedSummary.share_token });
  }

  const { data: currentSummary, error: currentError } = await supabase
    .from('summaries')
    .select('share_token')
    .eq('id', summaryId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (currentError) {
    console.error('Unable to confirm summary share state:', currentError);
    return NextResponse.json({ error: 'Unable to create a share link.' }, { status: 500 });
  }
  if (!currentSummary?.share_token) {
    return NextResponse.json({ error: 'Unable to create a share link.' }, { status: 409 });
  }

  return NextResponse.json({ shareToken: currentSummary.share_token });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { summaryId } = await params;
  const { data, error } = await supabase
    .from('summaries')
    .update({ share_token: null })
    .eq('id', summaryId)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Unable to revoke summary sharing:', error);
    return NextResponse.json({ error: 'Unable to revoke this share link.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Summary not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

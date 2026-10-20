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
    return NextResponse.json({
      error: 'Unable to read the summary share settings. Verify the latest summary-sharing SQL migration has been applied.',
    }, { status: 500 });
  }
  if (!summary) {
    return NextResponse.json({ error: 'Summary not found.' }, { status: 404 });
  }
  if (summary.share_token) {
    return NextResponse.json({ shareToken: summary.share_token });
  }

  const shareToken = randomBytes(32).toString('base64url');
  const { data: updatedSummaries, error: updateError } = await supabase.rpc('set_summary_share', {
    p_summary_id: summaryId,
    p_share_token: shareToken,
  });

  if (updateError) {
    console.error('Unable to enable summary sharing:', updateError);
    return NextResponse.json({
      error: 'Unable to enable sharing. Apply the latest summary-sharing SQL migration and try again.',
    }, { status: 500 });
  }

  const savedToken = updatedSummaries?.[0]?.share_token;
  if (!savedToken) {
    return NextResponse.json({ error: 'Summary not found.' }, { status: 404 });
  }

  return NextResponse.json({ shareToken: savedToken });
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
  const { data: updatedSummaries, error } = await supabase.rpc('set_summary_share', {
    p_summary_id: summaryId,
    p_share_token: null,
  });

  if (error) {
    console.error('Unable to revoke summary sharing:', error);
    return NextResponse.json({ error: 'Unable to revoke this share link.' }, { status: 500 });
  }
  if (!updatedSummaries?.length) {
    return NextResponse.json({ error: 'Summary not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

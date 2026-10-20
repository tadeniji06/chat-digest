import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Clock3, FileText, HelpCircle, Lightbulb, ListChecks, MessageSquareText, UserRound } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shared Group Summary',
  description: 'A read-only ChatDigest summary shared with you.',
  robots: { index: false, follow: false },
};

type SharedSummary = {
  group_name: string | null;
  summary_content: string;
  summary_period_start: string;
  summary_period_end: string;
  key_points: Record<string, unknown>[];
  action_items: string[];
  message_count: number;
  created_at: string;
};

function DetailList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        {icon}
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <ul className="space-y-2 px-5 py-4 text-sm leading-relaxed text-gray-700">
        {items.map((item, index) => <li key={index} className="flex gap-2"><span className="text-emerald-600">•</span><span>{item}</span></li>)}
      </ul>
    </section>
  );
}

export default async function SharedSummaryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
  );
  const { data, error } = await supabase.rpc('get_public_summary', { p_share_token: token });
  if (error) {
    console.error('Unable to load a shared summary:', error);
    throw new Error('Unable to load this shared summary.');
  }

  const summary = (data?.[0] || null) as SharedSummary | null;
  if (!summary) notFound();

  const details = summary.key_points?.[0] || {};
  const topics = Array.isArray(details.topics_discussed) ? details.topics_discussed as { topic: string; summary: string; contributors?: string[] }[] : [];
  const statements = Array.isArray(details.who_said_what) ? details.who_said_what as { speaker: string; point: string }[] : [];
  const terms = Array.isArray(details.highlighted_terms) ? details.highlighted_terms as string[] : [];
  const decisions = Array.isArray(details.decisions) ? details.decisions as string[] : [];
  const facts = Array.isArray(details.facts_and_details) ? details.facts_and_details as string[] : [];
  const questions = Array.isArray(details.open_questions) ? details.open_questions as string[] : [];
  const dateFormat: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-gray-900 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-emerald-700">ChatDigest</Link>
          <Link href="/signup" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Create a free account</Link>
        </header>

        <article className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700"><FileText className="h-4 w-4" /> Shared group digest</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{summary.group_name || 'WhatsApp Group'}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{new Date(summary.summary_period_start).toLocaleString('en-NG', dateFormat)} – {new Date(summary.summary_period_end).toLocaleString('en-NG', dateFormat)}</span>
              <span>{summary.message_count} messages included</span>
            </div>
          </div>

          <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
            <h2 className="mb-2 font-semibold text-gray-900">Detailed overview</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{summary.summary_content}</p>
          </section>

          {topics.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3"><ListChecks className="h-4 w-4 text-emerald-700" /><h2 className="font-semibold">Topics discussed</h2></div>
              <div className="divide-y divide-gray-100">
                {topics.map((topic, index) => (
                  <div key={index} className="space-y-1.5 px-5 py-4">
                    <h3 className="font-semibold">{topic.topic}</h3>
                    <p className="text-sm leading-relaxed text-gray-700">{topic.summary}</p>
                    {topic.contributors?.length ? <p className="text-xs text-gray-500">Contributors: {topic.contributors.join(', ')}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {statements.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3"><MessageSquareText className="h-4 w-4 text-emerald-700" /><h2 className="font-semibold">Key statements</h2></div>
              <ul className="space-y-3 px-5 py-4">
                {statements.map((item, index) => <li key={index} className="text-sm leading-relaxed"><strong>{item.speaker}:</strong> <span className="text-gray-700">{item.point}</span></li>)}
              </ul>
            </section>
          )}

          <DetailList title="Decisions" items={decisions} icon={<CheckCircle className="h-4 w-4 text-emerald-700" />} />
          <DetailList title="Important details" items={facts} icon={<Lightbulb className="h-4 w-4 text-emerald-700" />} />
          <DetailList title="Open questions" items={questions} icon={<HelpCircle className="h-4 w-4 text-emerald-700" />} />
          <DetailList title="Action items" items={summary.action_items || []} icon={<CheckCircle className="h-4 w-4 text-emerald-700" />} />
          <DetailList title="Key terms" items={terms} icon={<UserRound className="h-4 w-4 text-emerald-700" />} />
        </article>

        <aside className="rounded-2xl bg-emerald-900 p-6 text-center text-white sm:p-8">
          <h2 className="text-xl font-bold">Stay on top of your group conversations</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-emerald-100">Get detailed AI digests, key decisions, and action items for your own WhatsApp groups with ChatDigest.</p>
          <Link href="/signup" className="mt-5 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50">Sign up for free</Link>
        </aside>
        <p className="text-center text-xs text-gray-500">This read-only summary was shared by its owner. Raw chat messages are not shown here.</p>
      </div>
    </main>
  );
}

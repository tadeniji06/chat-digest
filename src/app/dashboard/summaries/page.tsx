'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Clock,
  ListChecks,
  CheckCircle,
  Users,
  MessageSquare,
  Tag,
  CheckSquare,
  Check,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { AISummary, MonitoredGroup, PLAN_LIMITS, TopicDiscussed, SpeakerPoint } from '@/types';
import { getUserFriendlyError } from '@/utils/errors';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import ShareSummaryButton from '@/components/dashboard/ShareSummaryButton';

function SummaryDetailList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
        {icon}
        <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{title}</h5>
      </div>
      <ul className="p-4 space-y-2 text-xs text-gray-700">
        {items.map((item, index) => <li key={index} className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span><span className="leading-relaxed">{item}</span></li>)}
      </ul>
    </div>
  );
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [groups, setGroups] = useState<MonitoredGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [hoursBack, setHoursBack] = useState<number>(24);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const { tier, isExpired, fetchTier } = useSubscriptionStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      fetchTier();
      const [sumRes, grpRes] = await Promise.all([
        fetch('/api/summarize'),
        fetch('/api/whatsapp/groups'),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummaries(sumData.summaries || []);
      }
      if (grpRes.ok) {
        const grpData = await grpRes.json();
        const monitored = (grpData.groups || []).filter((g: any) => g.isMonitored);
        setGroups(monitored);
        if (monitored.length > 0 && !selectedGroup) {
          setSelectedGroup(monitored[0].id);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateSummary = async () => {
    if (!selectedGroup) {
      toast.error('Please select a monitored group to summarize.');
      return;
    }

    setGenerating(true);

    const groupObj = groups.find((g) => (g as any).id === selectedGroup || (g as any).group_jid === selectedGroup);
    const groupName = (groupObj as any)?.group_name || (groupObj as any)?.name || 'Group';

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupJid: selectedGroup,
          groupName,
          hoursBack,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('[AI summary] Request failed:', {
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          diagnostic: data.diagnostic,
        });
        toast.error(getUserFriendlyError(data.error, 'Unable to generate summary right now. Please try again in a few moments.'));
        return;
      }

      toast.success(`Generated executive summary for "${groupName}"`);
      setSummaries((prev) => [data.summary, ...prev]);
    } catch (err: unknown) {
      console.error('[AI summary] Request could not be completed:', err);
      toast.error(getUserFriendlyError(err, 'Summary generation is taking longer than usual. Please try again shortly.'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            AI Group Summaries
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Executive briefs, key decisions, and action items from your WhatsApp chats
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
          title="Refresh summaries"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Generate On-Demand Summary Control Card */}
      {!PLAN_LIMITS[tier].hasSummaries ? (
        <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-gray-900">
                AI Summaries are not available on this plan
              </h2>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
              Upgrade your plan to unlock AI summaries and detailed meeting notes.
            </p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm shrink-0 flex items-center gap-2"
          >
            <span>Upgrade to Unlock</span>
            <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Generate On-Demand Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Select Monitored Group
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {groups.length === 0 ? (
                  <option value="">No monitored groups yet</option>
                ) : (
                  groups.map((g: any) => (
                    <option key={g.id || g.group_jid} value={g.id || g.group_jid}>
                      {g.name || g.group_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Timeframe
              </label>
              <select
                value={hoursBack}
                onChange={(e) => setHoursBack(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={12}>Past 12 Hours</option>
                <option value={24}>Past 24 Hours (Daily)</option>
                <option value={48}>Past 48 Hours</option>
                <option value={168}>Past 7 Days (Weekly Digest)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateSummary}
                disabled={generating || groups.length === 0}
                className="w-full py-2 px-4 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Chat with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summaries Feed */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Saved Digest History</h2>

        {loading ? (
          <div className="py-20 flex justify-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">No summaries recorded yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Select a group above and click &quot;Generate Summary&quot; to create your first executive AI brief.
            </p>
          </div>
        ) : (
          summaries.map((summary) => (
            <div
              key={summary.id}
              className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {summary.group_name || 'WhatsApp Group'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(summary.summary_period_start).toLocaleDateString()} &ndash;{' '}
                        {new Date(summary.summary_period_end).toLocaleDateString()}
                      </span>
                      {summary.message_count ? (
                        <span>&bull; {summary.message_count} messages processed</span>
                      ) : null}
                    </div>
                    <ShareSummaryButton summary={summary} />
                  </div>
                </div>

                <span className="text-xs text-gray-400">
                  {new Date(summary.created_at).toLocaleDateString()} at{' '}
                  {new Date(summary.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Executive Overview */}
              <div>
                <p className="text-sm text-gray-800 leading-relaxed bg-gray-50/70 p-4 rounded-lg border border-gray-200">
                  {summary.summary_content}
                </p>
              </div>

              {/* Extract structured data from key_points if available */}
              {(() => {
                const kp = summary.key_points || [];
                const firstObj = kp[0] && typeof kp[0] === 'object' && !Array.isArray(kp[0]) ? (kp[0] as any) : null;
                const topics: TopicDiscussed[] = firstObj?.topics_discussed || [];
                const whoSaidWhat: SpeakerPoint[] = firstObj?.who_said_what || [];
                const terms: string[] = firstObj?.highlighted_terms || [];
                const decisions: string[] = firstObj?.decisions || [];
                const facts: string[] = firstObj?.facts_and_details || [];
                const questions: string[] = firstObj?.open_questions || [];
                const legacyPoints: string[] = !firstObj ? (kp.filter((p: any) => typeof p === 'string') as string[]) : [];

                return (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <SummaryDetailList title="Decisions" items={decisions} icon={<CheckCircle className="w-4 h-4 text-emerald-700" />} />
                      <SummaryDetailList title="Important details" items={facts} icon={<Lightbulb className="w-4 h-4 text-emerald-700" />} />
                      <SummaryDetailList title="Open questions" items={questions} icon={<HelpCircle className="w-4 h-4 text-emerald-700" />} />
                    </div>

                    {/* Highlighted Keywords / Tags Discussed */}
                    {terms.length > 0 && (
                      <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-100 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider mr-1">
                          <Tag className="w-3.5 h-3.5 text-emerald-700" />
                          Key Terms &amp; Topics:
                        </span>
                        {terms.map((term, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-emerald-800 border border-emerald-200 shadow-2xs"
                          >
                            #{term}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Topics Discussed */}
                    {topics.length > 0 && (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-emerald-700" />
                          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Key Topics &amp; Agenda Discussed
                          </h5>
                        </div>
                        <div className="divide-y divide-gray-100 bg-white">
                          {topics.map((t, idx) => (
                            <div key={idx} className="p-4 space-y-1.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h6 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  {t.topic}
                                </h6>
                                {t.contributors && t.contributors.length > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Users className="w-3 h-3 text-gray-400" />
                                    {t.contributors.join(', ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed pl-3.5">
                                {t.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Who Said What & Action Items side-by-side or stacked */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Who Said What */}
                      {whoSaidWhat.length > 0 ? (
                        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-700" />
                            <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                              Who Said What &amp; Key Statements
                            </h5>
                          </div>
                          <div className="p-4 space-y-3">
                            {whoSaidWhat.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-gray-50/80 border border-gray-200/80 text-xs space-y-1"
                              >
                                <div className="flex items-center gap-1.5 font-bold text-gray-900">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                                    {item.speaker}
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed pl-0.5">
                                  {item.point}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : legacyPoints.length > 0 ? (
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-emerald-700" />
                            Key Discussion Points
                          </h5>
                          <ul className="space-y-1.5 text-xs text-gray-700">
                            {legacyPoints.map((pt, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">&bull;</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {/* Action Items & Next Steps */}
                      {summary.action_items && summary.action_items.length > 0 && (
                        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                            <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                              Action Items &amp; Next Steps
                            </h5>
                          </div>
                          <div className="p-4 space-y-2.5">
                            {summary.action_items.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs text-gray-800"
                              >
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed font-medium">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

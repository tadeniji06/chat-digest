'use client';

import { useState } from 'react';
import { Check, Copy, Download, LoaderCircle, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { AISummary, SummaryKeyPoint } from '@/types';

export default function ShareSummaryButton({
  summary,
}: {
  summary: AISummary;
}) {
  const [shareToken, setShareToken] = useState(summary.share_token || null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const summaryId = summary.id;
  const sharePath = shareToken ? `/shared/${shareToken}` : '';
  const keyPoints = summary.key_points?.find(
    (point): point is SummaryKeyPoint => typeof point !== 'string'
  );

  const enableSharing = async () => {
    if (!window.confirm('Anyone with this link can read this summary. It may contain details from your group conversation. You can revoke the link at any time. Create a public link?')) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/summaries/${summaryId}/share`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to create a share link.');
      }
      setShareToken(data.shareToken);
      toast.success('Public summary link created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create a share link.');
    } finally {
      setBusy(false);
    }
  };

  const revokeSharing = async () => {
    if (!window.confirm('Revoke this public link? Anyone who has it will no longer be able to read the summary.')) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/summaries/${summaryId}/share`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to revoke this share link.');
      }
      setShareToken(null);
      setCopied(false);
      toast.success('Share link revoked.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to revoke this share link.');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(new URL(sharePath, window.location.origin).href);
      setCopied(true);
      toast.success('Summary link copied.');
    } catch {
      toast.error('Could not copy the link. Please copy it from the address below.');
    }
  };

  const downloadSummary = () => {
    const sections = [
      summary.group_name || 'WhatsApp Group',
      `${new Date(summary.summary_period_start).toLocaleString()} – ${new Date(summary.summary_period_end).toLocaleString()}`,
      `${summary.message_count || 0} messages`,
      '',
      'OVERVIEW',
      summary.summary_content,
      ...(keyPoints?.topics_discussed?.length
        ? ['', 'TOPICS DISCUSSED', ...keyPoints.topics_discussed.map((topic) => `${topic.topic}\n${topic.summary}${topic.contributors?.length ? `\nContributors: ${topic.contributors.join(', ')}` : ''}`)]
        : []),
      ...(keyPoints?.who_said_what?.length
        ? ['', 'KEY STATEMENTS', ...keyPoints.who_said_what.map((item) => `${item.speaker}: ${item.point}`)]
        : []),
      ...(keyPoints?.decisions?.length ? ['', 'DECISIONS', ...keyPoints.decisions.map((item) => `- ${item}`)] : []),
      ...(keyPoints?.facts_and_details?.length ? ['', 'IMPORTANT DETAILS', ...keyPoints.facts_and_details.map((item) => `- ${item}`)] : []),
      ...(keyPoints?.open_questions?.length ? ['', 'OPEN QUESTIONS', ...keyPoints.open_questions.map((item) => `- ${item}`)] : []),
      ...(summary.action_items?.length ? ['', 'ACTION ITEMS', ...summary.action_items.map((item) => `- ${item}`)] : []),
      ...(keyPoints?.highlighted_terms?.length ? ['', 'KEY TERMS', keyPoints.highlighted_terms.join(', ')] : []),
    ];
    const blob = new Blob([sections.join('\n')], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${(summary.group_name || 'chatdigest-summary').replace(/[^\w.-]+/g, '-')}-summary.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const shareOnWhatsApp = () => {
    const url = new URL(sharePath, window.location.origin).href;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Read this ChatDigest summary: ${url}`)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={downloadSummary}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        <Download className="h-4 w-4" />
        Export .txt
      </button>
      {!shareToken ? (
        <button
          type="button"
          onClick={enableSharing}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Create public link
        </button>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              Copy link
            </button>
            <button
              type="button"
              onClick={shareOnWhatsApp}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </button>
            <button
              type="button"
              onClick={revokeSharing}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Revoke link
            </button>
          </div>
          {sharePath && (
            <a
              href={sharePath}
              className="inline-flex items-center gap-1 break-all text-xs text-emerald-700 underline"
            >
              {sharePath}
            </a>
          )}
        </>
      )}
    </div>
  );
}

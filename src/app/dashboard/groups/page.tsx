'use client';

import { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Tag,
  Check,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionTier, PLAN_LIMITS } from '@/types';
import { getUserFriendlyError } from '@/utils/errors';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

interface GroupItem {
  id: string;
  name: string;
  isMonitored?: boolean;
  keywords?: string[];
}

export default function MonitoredGroupsPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [monitoredCount, setMonitoredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monitored' | 'all'>('monitored');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingJid, setEditingJid] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');

  // Global Zustand subscription store
  const { tier, plan, fetchTier } = useSubscriptionStore();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/groups');
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
        const count = data.groups.filter((g: any) => g.isMonitored).length;
        setMonitoredCount(count);
        // If user has no monitored groups yet, switch to 'all' so they can pick one
        if (count === 0) {
          setActiveTab('all');
        }
      }
    } catch (err: unknown) {
      toast.error(getUserFriendlyError(err, 'Unable to load groups right now. Please refresh the page.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchTier();
  }, [fetchTier]);

  const handleToggleMonitor = async (group: GroupItem) => {
    const willMonitor = !group.isMonitored;

    if (willMonitor && monitoredCount >= plan.maxGroups) {
      toast.error(
        `Plan limit reached (${plan.maxGroups} group allowed on ${plan.name}). Please upgrade your plan.`
      );
      return;
    }

    try {
      if (willMonitor) {
        const res = await fetch('/api/whatsapp/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupJid: group.id,
            groupName: group.name,
            keywords: group.keywords || ['urgent', 'important', 'action', 'meeting'],
            isActive: true,
          }),
        });
        const resData = await res.json();
        if (!res.ok) {
          toast.error(getUserFriendlyError(resData.error, 'Unable to monitor this group. Please try again.'));
          return;
        }
      } else {
        const res = await fetch(`/api/whatsapp/groups?groupJid=${encodeURIComponent(group.id)}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          toast.error('Unable to unmonitor group. Please try again.');
          return;
        }
      }

      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? {
                ...g,
                isMonitored: willMonitor,
                keywords: willMonitor
                  ? g.keywords || ['urgent', 'important', 'action', 'meeting']
                  : [],
              }
            : g
        )
      );
      setMonitoredCount((prev) => (willMonitor ? prev + 1 : prev - 1));
      toast.success(
        willMonitor
          ? `Now monitoring "${group.name}"`
          : `Stopped monitoring "${group.name}"`
      );
    } catch (err: unknown) {
      toast.error(getUserFriendlyError(err, 'Unable to update group monitoring. Please try again.'));
    }
  };

  const handleAddKeyword = async (group: GroupItem) => {
    if (!keywordInput.trim()) return;
    const currentKeywords = group.keywords || [];
    const newKeyword = keywordInput.trim().toLowerCase();

    if (currentKeywords.includes(newKeyword)) {
      setKeywordInput('');
      return;
    }

    if (currentKeywords.length >= plan.keywordsPerGroup) {
      toast.error(
        `Keyword limit reached (${plan.keywordsPerGroup} per group on ${plan.name} plan). Please upgrade your subscription to add more keywords.`
      );
      return;
    }

    const updated = [...currentKeywords, newKeyword];

    try {
      await fetch('/api/whatsapp/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupJid: group.id,
          groupName: group.name,
          keywords: updated,
          isActive: true,
        }),
      });

      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, keywords: updated } : g))
      );
      setKeywordInput('');
      toast.success(`Added keyword "${newKeyword}"`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add keyword';
      toast.error(message);
    }
  };

  const handleRemoveKeyword = async (group: GroupItem, keywordToRemove: string) => {
    const updated = (group.keywords || []).filter((k) => k !== keywordToRemove);

    try {
      await fetch('/api/whatsapp/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupJid: group.id,
          groupName: group.name,
          keywords: updated,
          isActive: true,
        }),
      });

      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, keywords: updated } : g))
      );
      toast.success(`Removed keyword "${keywordToRemove}"`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove keyword';
      toast.error(message);
    }
  };

  const monitoredGroupsList = groups.filter((g) => g.isMonitored);

  const displayedGroups = (
    activeTab === 'monitored'
      ? monitoredGroupsList
      : groups
  ).filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Monitored WhatsApp Groups
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Select groups to ingest and configure real-time keyword triggers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
            Monitoring{' '}
            <span className="text-emerald-700 font-bold">{monitoredCount}</span> of{' '}
            <span className="text-gray-900 font-bold">{plan.maxGroups}</span> allowed
          </div>

          <button
            onClick={fetchGroups}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
            title="Refresh groups"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('monitored')}
            className={`pb-3 px-1 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'monitored'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Active Monitored</span>
            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
              activeTab === 'monitored'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {monitoredGroupsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>All WhatsApp Groups</span>
            <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-gray-100 text-gray-600">
              {groups.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-gray-400 hidden sm:inline">
          {activeTab === 'monitored' ? 'Managing active keyword triggers' : 'Select groups from your WhatsApp account'}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={activeTab === 'monitored' ? 'Search active monitored groups...' : 'Search all WhatsApp groups...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm"
        />
      </div>

      {/* Groups Listing */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
          <span className="text-sm font-medium">Fetching WhatsApp groups...</span>
        </div>
      ) : displayedGroups.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <Users2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h2 className="text-base font-bold text-gray-900">
            {activeTab === 'monitored'
              ? 'No groups actively monitored yet'
              : 'No WhatsApp groups found'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'monitored'
              ? 'Switch to the "All WhatsApp Groups" tab to pick groups and configure trigger keywords.'
              : 'Ensure your WhatsApp session is linked and that your WhatsApp account is a member of groups.'}
          </p>
          {activeTab === 'monitored' ? (
            <button
              onClick={() => setActiveTab('all')}
              className="mt-4 inline-block px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Browse All Groups ({groups.length})
            </button>
          ) : (
            <a
              href="/dashboard/connect"
              className="mt-4 inline-block px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Check Session Connection
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedGroups.map((group) => {
            const isMonitored = !!group.isMonitored;
            const keywords = group.keywords || [];

            return (
              <div
                key={group.id}
                className={`p-6 rounded-xl border transition-colors bg-white shadow-sm ${
                  isMonitored
                    ? 'border-emerald-500 ring-1 ring-emerald-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors ${
                        isMonitored
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    >
                      <Users2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {group.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        {isMonitored ? 'Active for real-time tracking' : 'WhatsApp Group'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleMonitor(group)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                        isMonitored
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-red-50 hover:text-red-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      {isMonitored ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Monitoring (Active)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Start Monitoring</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Keywords Configuration Section */}
                {isMonitored && (
                  <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          Trigger Keywords ({keywords.length} / {plan.keywordsPerGroup} max)
                        </span>
                        {keywords.length >= plan.keywordsPerGroup && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800" title={`Max keywords limit reached for ${plan.name} plan`}>
                            Plan Max
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400" title="When any of these keywords are matched in incoming group messages, you will be notified immediately">
                        Instant notification when terms appear
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          <span>{kw}</span>
                          <button
                            onClick={() => handleRemoveKeyword(group, kw)}
                            className="hover:text-emerald-950 text-emerald-600 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}

                      {/* Add keyword input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddKeyword(group);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          placeholder="Add keyword (e.g. urgent)..."
                          value={editingJid === group.id ? keywordInput : ''}
                          onFocus={() => setEditingJid(group.id)}
                          onChange={(e) => {
                            setEditingJid(group.id);
                            setKeywordInput(e.target.value);
                          }}
                          className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 w-44"
                        />
                        <button
                          type="submit"
                          className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 transition-colors"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

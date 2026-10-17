'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Tag, Clock, Users2, Trash2, RefreshCw, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { KeywordAlert } from '@/types';

export default function KeywordAlertsPage() {
  const [alerts, setAlerts] = useState<KeywordAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts((data.alerts || []).slice(0, 10));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch alerts';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(() => {
      fetch('/api/alerts')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.alerts) setAlerts(data.alerts.slice(0, 10));
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Alert dismissed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss alert';
      toast.error(message);
    }
  };

  // Distinct groups & keywords for dropdown filter lists
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => {
      if (a.group_name) set.add(a.group_name);
    });
    return Array.from(set);
  }, [alerts]);

  const availableKeywords = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => {
      if (a.keyword) set.add(a.keyword);
    });
    return Array.from(set);
  }, [alerts]);

  // Filter alerts by search term, group, and keyword
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Group filter
      if (selectedGroup !== 'all' && alert.group_name !== selectedGroup) {
        return false;
      }
      // Keyword filter
      if (selectedKeyword !== 'all' && alert.keyword?.toLowerCase() !== selectedKeyword.toLowerCase()) {
        return false;
      }
      // Search term filter (matches message content, sender, keyword, or group)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesContent = alert.message_content?.toLowerCase().includes(q);
        const matchesSender = alert.sender_name?.toLowerCase().includes(q);
        const matchesKeyword = alert.keyword?.toLowerCase().includes(q);
        const matchesGroup = alert.group_name?.toLowerCase().includes(q);
        return matchesContent || matchesSender || matchesKeyword || matchesGroup;
      }
      return true;
    });
  }, [alerts, searchTerm, selectedGroup, selectedKeyword]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Keyword Alerts Feed
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Showing latest trigger alerts (up to 10 most recent)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            {filteredAlerts.length} shown {alerts.length !== filteredAlerts.length && `(of ${alerts.length})`}
          </span>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search alerts, sender, text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
          />
        </div>

        {/* Group Filter Dropdown */}
        <div className="relative">
          <Users2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Groups ({availableGroups.length})</option>
            {availableGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* Keyword Filter Dropdown */}
        <div className="relative">
          <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={selectedKeyword}
            onChange={(e) => setSelectedKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Keywords ({availableKeywords.length})</option>
            {availableKeywords.map((kw) => (
              <option key={kw} value={kw}>
                {kw}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {loading && alerts.length === 0 ? (
        <div className="py-20 flex justify-center text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h2 className="text-base font-bold text-gray-900">
            {alerts.length === 0 ? 'No keyword alerts triggered yet' : 'No matching alerts found'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {alerts.length === 0
              ? 'Configure keywords in your Monitored Groups to receive automated notifications whenever important discussions happen.'
              : 'Try clearing your search query or filters to see all triggered alerts.'}
          </p>
          {alerts.length > 0 ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGroup('all');
                setSelectedKeyword('all');
              }}
              className="mt-4 inline-block px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          ) : (
            <a
              href="/dashboard/groups"
              className="mt-4 inline-block px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Configure Group Keywords
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {alert.keyword}
                  </span>
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5 text-gray-400" />
                    {alert.group_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    &bull; from <span className="text-gray-700 font-medium">{alert.sender_name || 'Member'}</span>
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800 leading-relaxed font-mono">
                  &ldquo;{alert.message_content}&rdquo;
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => handleDelete(alert.id)}
                  title="Dismiss alert"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

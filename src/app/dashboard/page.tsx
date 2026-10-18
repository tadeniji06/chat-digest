import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import {
  Users2,
  FileText,
  Bell,
  QrCode,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { PLAN_LIMITS, SubscriptionTier } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  const [sessionRes, groupsRes, summariesRes, alertsRes, profileRes] = await Promise.all([
    supabase.from('whatsapp_sessions').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('monitored_groups').select('*').eq('user_id', userId),
    supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('keyword_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('users').select('*').eq('id', userId).maybeSingle(),
  ]);

  const session = sessionRes.data;
  let groups = groupsRes.data || [];
  let recentSummaries = summariesRes.data || [];
  let recentAlerts = alertsRes.data || [];

  const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:5001';
  let isConnected = sessionRes.data?.status === 'connected';

  if (userId) {
    try {
      // Sync DB monitored groups into bridge service in case bridge restarted
      if (groups.length > 0) {
        for (const dg of groups) {
          fetch(`${BRIDGE_URL}/api/session/${userId}/monitored-groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupJid: dg.group_jid,
              groupName: dg.group_name,
              keywords: dg.keywords || [],
              isActive: dg.is_active !== false,
            }),
          }).catch(() => {});
        }
      }

      const [bridgeStatusRes, bridgeAlertsRes, bridgeGroupsRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/session/${userId}/status`, { cache: 'no-store' }).catch(() => null),
        fetch(`${BRIDGE_URL}/api/session/${userId}/alerts`, { cache: 'no-store' }).catch(() => null),
        fetch(`${BRIDGE_URL}/api/session/${userId}/groups`, { cache: 'no-store' }).catch(() => null),
      ]);

      if (bridgeStatusRes && bridgeStatusRes.ok) {
        const bData = await bridgeStatusRes.json();
        if (bData.status === 'connected') isConnected = true;
      }

      if (bridgeAlertsRes && bridgeAlertsRes.ok) {
        const bAlertsData = await bridgeAlertsRes.json();
        if (bAlertsData.alerts && bAlertsData.alerts.length > 0) {
          const mapped = bAlertsData.alerts.map((a: any) => ({
            id: a.id,
            user_id: userId,
            group_jid: a.groupJid,
            group_name: a.groupName,
            sender_name: a.senderName,
            keyword: a.keyword,
            message_content: a.messageContent,
            created_at: a.createdAt,
          }));
          const seen = new Set(recentAlerts.map((a: any) => `${a.group_jid}_${a.keyword}_${a.message_content}`));
          for (const m of mapped) {
            const k = `${m.group_jid}_${m.keyword}_${m.message_content}`;
            if (!seen.has(k)) {
              seen.add(k);
              recentAlerts.push(m);
            }
          }
          // Sort newest first and fetch ONLY the single most recent alert on dashboard overview
          recentAlerts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          recentAlerts = recentAlerts.slice(0, 1);
        }
      }
      recentAlerts = recentAlerts.slice(0, 1);

      if (bridgeGroupsRes && bridgeGroupsRes.ok) {
        const bGroupsData = await bridgeGroupsRes.json();
        if (bGroupsData.groups) {
          const liveMonitored = bGroupsData.groups.filter((g: any) => g.isMonitored);
          const dbJids = new Set(groups.map((g: any) => g.group_jid));

          // If bridge has monitored groups not in DB list, merge them
          for (const lg of liveMonitored) {
            if (!dbJids.has(lg.id)) {
              groups.push({
                group_jid: lg.id,
                group_name: lg.name,
                keywords: lg.keywords || [],
                is_active: true,
              });
            } else {
              // Update keywords from bridge if bridge has more
              const existing = groups.find((g: any) => g.group_jid === lg.id);
              if (existing && (!existing.keywords || existing.keywords.length === 0) && lg.keywords?.length > 0) {
                existing.keywords = lg.keywords;
              }
            }
          }
        }
      }
    } catch {}
  }

  // Tier resolution: Check cookie, profile, then user_metadata
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieSub = cookieStore.get('cd_sub_active')?.value;
  const validTiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'max', 'enterprise'];
  let cookieTier: SubscriptionTier | null = null;
  if (cookieSub) {
    const [cUserId, cTier] = cookieSub.split(':');
    if (cUserId === userId && validTiers.includes(cTier as SubscriptionTier)) {
      cookieTier = cTier as SubscriptionTier;
    }
  }

  const rawTier =
    cookieTier ||
    profileRes.data?.subscription_tier ||
    user?.user_metadata?.subscription_tier ||
    'free';

  const expiresAt = profileRes.data?.subscription_expires_at || user?.user_metadata?.subscription_expires_at;
  const isExpired = rawTier !== 'free' && expiresAt ? Date.now() > new Date(expiresAt).getTime() : false;
  const resolvedTier: SubscriptionTier = isExpired ? 'free' : (rawTier as SubscriptionTier);

  const tier: SubscriptionTier = resolvedTier as SubscriptionTier;
  const plan = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

  return (
    <div className="space-y-8">
      {/* Welcome & status header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time status of your WhatsApp monitoring and AI digests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-600' : 'bg-gray-400'
              }`}
            />
            <span>{isConnected ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}</span>
          </div>

          <Link
            href="/dashboard/connect"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{isConnected ? 'Manage Session' : 'Connect Session'}</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Monitored Groups</span>
            <Users2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {groups.length}
            </span>
            <span className="text-xs text-gray-500">/ {plan.maxGroups} allowed</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {plan.maxGroups - groups.length} group slot(s) remaining on {plan.name}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>AI Summaries</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {recentSummaries.length}
            </span>
            <span className="text-xs text-gray-500">digests saved</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {plan.hasSummaries ? 'Automatic daily & on-demand' : 'Requires Pro/Max plan'}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Keywords Tracked</span>
            <Bell className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {groups.reduce((acc, g) => acc + (g.keywords?.length || 0), 0)}
            </span>
            <span className="text-xs text-gray-500">terms active</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Instant triggers when terms appear
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Subscription Tier</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 uppercase">
              {tier}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">{plan.price}</span>
          </div>
          <Link
            href="/dashboard/subscription"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1"
          >
            Manage plan <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Grid: Recent Summaries & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Summaries */}
        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Recent AI Summaries
              </h2>
            </div>
            <Link
              href="/dashboard/summaries"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {recentSummaries.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">No summaries generated yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Connect a group and click &quot;Generate Summary&quot; to review discussions.
                </p>
                <Link
                  href="/dashboard/summaries"
                  className="mt-4 inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                >
                  Go to Summaries
                </Link>
              </div>
            ) : (
              recentSummaries.map((summary) => {
                const kp = summary.key_points || [];
                const firstObj = kp[0] && typeof kp[0] === 'object' && !Array.isArray(kp[0]) ? kp[0] : null;
                const terms: string[] = firstObj?.highlighted_terms || [];

                return (
                  <div
                    key={summary.id}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm text-gray-900 truncate max-w-50">
                        {summary.group_name || 'WhatsApp Group'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(summary.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {summary.summary_content}
                    </p>
                    {terms.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {terms.slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-gray-200 text-emerald-800"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Keyword Alerts */}
        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Triggered Keyword Alerts
              </h2>
            </div>
            <Link
              href="/dashboard/alerts"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">No alerts triggered yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add keywords to your monitored groups (e.g. &quot;urgent&quot;, &quot;meeting&quot;, &quot;bug&quot;).
                </p>
                <Link
                  href="/dashboard/groups"
                  className="mt-4 inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                >
                  Configure Group Keywords
                </Link>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {alert.keyword}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        in {alert.group_name} by {alert.sender_name || 'Member'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-1">
                      &quot;{alert.message_content}&quot;
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

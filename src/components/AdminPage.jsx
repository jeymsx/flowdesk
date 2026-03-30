import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { checkIsAdmin, getAdminUserStats, getAdminFeedbackStats } from '../services/admin';
import { deleteFeedback } from '../services/feedback';
import { getLevelTitle as computeLevelTitle } from '../store/gamificationStore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';

const getLevelTitle = computeLevelTitle;

// Tier color for level badge
function getLevelTier(level) {
  if (level <= 2) return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
  if (level <= 4) return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
  if (level <= 6) return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400';
  return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ACCENT = '#22c55e';

function StatCard({ label, value, sub, icon, bar, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      {bar != null && (
        <div className="mt-3 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(bar * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.06 + 0.2 }}
          />
        </div>
      )}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-lg text-xs">
      <p className="text-gray-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-900 dark:text-white font-medium">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  );
}

const RANK_STYLES = [
  'text-amber-500 font-bold',     // 1st
  'text-gray-400 font-semibold',  // 2nd
  'text-orange-400 font-semibold',// 3rd
];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    checkIsAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uResult, fResult] = await Promise.all([
        getAdminUserStats(),
        getAdminFeedbackStats(),
      ]);
      setUserStats(uResult);
      setFeedbackStats(fResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteFeedback(id);
      setFeedbackStats((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => e.id !== id),
        bugCount: prev.entries.filter((e) => e.id !== id && e.type === 'bug').length,
        suggestionCount: prev.entries.filter((e) => e.id !== id && e.type === 'suggestion').length,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const levelChartData = useMemo(() => userStats
    ? Object.entries(userStats.levelCounts)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([lvl, count]) => ({ level: `Lv ${lvl}`, count }))
    : [], [userStats]);

  const filteredFeedback = useMemo(() => feedbackStats
    ? feedbackFilter === 'all'
      ? feedbackStats.entries
      : feedbackStats.entries.filter((e) => e.type === feedbackFilter)
    : [], [feedbackStats, feedbackFilter]);

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Restricted access</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">This area is for administrators only.</p>
          <button
            onClick={() => navigate('/app')}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-80 transition-opacity"
          >
            Back to app
          </button>
        </div>
      </div>
    );
  }

  const TABS = ['overview', 'users', 'feedback'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-400 mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to app
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin</h1>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-500/10 border border-accent-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400">Live</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">FlowDesk dashboard overview</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl w-fit mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
            ))}
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >

            {/* ── Overview ── */}
            {activeTab === 'overview' && userStats && feedbackStats && (
              <div className="space-y-8">

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    index={0} label="Total users" value={userStats.totalUsers.toLocaleString()}
                    sub={`${userStats.usersWithUsername} with usernames`}
                    icon={<svg className="w-3.5 h-3.5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  />
                  <StatCard
                    index={1} label="Active users" value={userStats.activeUsers.toLocaleString()}
                    sub={`${Math.round((userStats.activeUsers / userStats.totalUsers) * 100) || 0}% engagement`}
                    bar={userStats.activeUsers / userStats.totalUsers}
                    icon={<svg className="w-3.5 h-3.5 text-accent-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  />
                  <StatCard
                    index={2} label="Total XP" value={userStats.totalXP.toLocaleString()}
                    sub={`avg ${userStats.avgXP} per user`}
                    icon={<svg className="w-3.5 h-3.5 text-accent-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
                  />
                  <StatCard
                    index={3} label="Feedback" value={feedbackStats.entries.length}
                    sub={`${feedbackStats.bugCount} bugs · ${feedbackStats.suggestionCount} ideas`}
                    icon={<svg className="w-3.5 h-3.5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                  />
                </div>

                {/* Streak milestones */}
                {userStats.milestones && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4">Streak milestones claimed</p>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { days: 7,   label: '7-day streak',   color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-500/10',  border: 'border-green-100 dark:border-green-500/20'  },
                        { days: 30,  label: '30-day streak',  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-100 dark:border-blue-500/20'    },
                        { days: 100, label: '100-day streak', color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10',  border: 'border-amber-100 dark:border-amber-500/20'  },
                      ].map(({ days, label, color, bg, border }) => (
                        <div key={days} className={`flex items-center gap-3 p-3.5 rounded-xl ${bg} border ${border}`}>
                          <svg className={`w-4 h-4 shrink-0 ${color}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <div>
                            <p className={`text-base font-bold tabular-nums ${color}`}>{(userStats.milestones[days] || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Level distribution */}
                  <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-5">User level distribution</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={levelChartData} barSize={24} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-gray-100 dark:text-gray-800" vertical={false} />
                          <XAxis dataKey="level" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={8} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,197,94,0.04)' }} />
                          <Bar dataKey="count" name="Users" fill={ACCENT} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Feedback breakdown */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-5">Feedback breakdown</p>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Bugs', value: feedbackStats.bugCount },
                                { name: 'Ideas', value: feedbackStats.suggestionCount },
                              ]}
                              cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={6} dataKey="value"
                            >
                              <Cell fill="#ef4444" />
                              <Cell fill={ACCENT} />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex justify-center gap-5 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Bugs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-accent-500 shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Ideas</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity over 7 days */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-5">Feedback activity (7 days)</p>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={feedbackStats.dailyCounts}>
                        <defs>
                          <linearGradient id="feedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ACCENT} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-gray-100 dark:text-gray-800" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" name="Activity" stroke={ACCENT} strokeWidth={2} fill="url(#feedGrad)" dot={{ fill: ACCENT, r: 4, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── Users ── */}
            {activeTab === 'users' && userStats && (
              <div className="space-y-6">
                {/* Top users leaderboard */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Leaderboard — Top 10</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500">Rank</th>
                          <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500">User</th>
                          <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500">Title</th>
                          <th className="text-right py-3 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500">XP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {userStats.topUsers.map((u, i) => (
                          <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="py-3.5 px-6">
                              {i < 3 ? (
                                <span className="text-base">{RANK_LABELS[i]}</span>
                              ) : (
                                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 tabular-nums">{i + 1}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  i === 0 ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : i === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                                  : i === 2 ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-500 dark:text-orange-400'
                                  : 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                                }`}>
                                  {u.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{u.username}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLevelTier(u.level)}`}>
                                Lv {u.level} · {getLevelTitle(u.level)}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{u.xp.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent activity</p>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {userStats.recentUsers.map((u) => {
                      const level = Math.floor(u.xp / 100) + 1;
                      const xpInLevel = u.xp % 100;
                      return (
                        <div key={u.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">@{u.username || 'guest'}</p>
                            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">{timeAgo(u.updated_at)}</span>
                          </div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-accent-500">Lv {level}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{u.xp} XP</span>
                          </div>
                          <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500"
                              style={{ width: `${xpInLevel}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Feedback ── */}
            {activeTab === 'feedback' && feedbackStats && (
              <div className="space-y-5">
                {/* Filter tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl w-fit">
                  {[
                    { key: 'all',        label: `All`,        count: feedbackStats.entries.length },
                    { key: 'bug',        label: `Bugs`,       count: feedbackStats.bugCount },
                    { key: 'suggestion', label: `Ideas`,      count: feedbackStats.suggestionCount },
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setFeedbackFilter(key)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        feedbackFilter === key
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {label}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${
                        feedbackFilter === key
                          ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>

                {filteredFeedback.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-400 dark:text-gray-500">No feedback yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFeedback.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              entry.type === 'bug'
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                : 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            }`}>
                              {entry.type === 'bug'
                                ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                              }
                              {entry.type === 'bug' ? 'Bug' : 'Idea'}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">@{entry.profiles?.username || 'anonymous'}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(entry.created_at)}</span>
                          </div>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-all disabled:opacity-40 shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">"{entry.message}"</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            <Link to="/" className="hover:text-accent-500 transition-colors">Home</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-accent-500 transition-colors">FAQ</Link>
            <span>•</span>
            <Link to="/changelog" className="hover:text-accent-500 transition-colors">Changelog</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-accent-500 transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-accent-500 transition-colors">Privacy</Link>
          </nav>
          <p className="mt-6 text-[10px] font-medium text-gray-300 dark:text-gray-700 uppercase tracking-[0.2em]">
            © 2026 FlowDesk · Built for focus
          </p>
        </footer>

      </div>
    </div>
  );
}

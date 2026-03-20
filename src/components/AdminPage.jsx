import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getAdminUserStats, getAdminFeedbackStats } from '../services/admin';
import { deleteFeedback } from '../services/feedback';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';

const ADMIN_UID = '87f1a251-0bac-4067-826e-888202d3e3c4';

const LEVEL_TITLES = ['Newcomer', 'Focused', 'Achiever', 'Consistent', 'Deep Worker', 'Flow Master', 'Legend'];
function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACCENT = '#6366f1';
const PIE_COLORS = ['#ef4444', '#3b82f6'];

function StatCard({ label, value, sub, icon, color = 'accent' }) {
  const colorMap = {
    accent: 'bg-accent-500/10 text-accent-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    red: 'bg-red-500/10 text-red-500',
    blue: 'bg-blue-500/10 text-blue-500',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></p>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const isAdmin = user?.id === ADMIN_UID;
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.backgroundColor = darkMode ? '#0f172a' : '#f9fafb';
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f9fafb';
    };
  }, [darkMode]);

  const [userStats, setUserStats] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const [uResult, fResult] = await Promise.allSettled([
      getAdminUserStats(),
      getAdminFeedbackStats(),
    ]);
    if (uResult.status === 'fulfilled') setUserStats(uResult.value);
    else setErrors((e) => ({ ...e, users: uResult.reason?.message || 'Failed to load user stats' }));
    if (fResult.status === 'fulfilled') setFeedbackStats(fResult.value);
    else setErrors((e) => ({ ...e, feedback: fResult.reason?.message || 'Failed to load feedback' }));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load();
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You need to be signed in to view this page.</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Access denied</p>
          <button onClick={() => navigate('/')} className="mt-4 text-xs text-accent-500 hover:text-accent-400 transition-colors">Go home</button>
        </div>
      </div>
    );
  }

  // Derived chart data
  const levelChartData = userStats
    ? Object.entries(userStats.levelCounts)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([lvl, count]) => ({ level: `Lv ${lvl}`, count, title: getLevelTitle(Number(lvl)) }))
    : [];

  const pieData = feedbackStats
    ? [
        { name: 'Bugs', value: feedbackStats.bugCount },
        { name: 'Suggestions', value: feedbackStats.suggestionCount },
      ].filter((d) => d.value > 0)
    : [];

  const filteredFeedback = feedbackStats
    ? feedbackFilter === 'all'
      ? feedbackStats.entries
      : feedbackStats.entries.filter((e) => e.type === feedbackFilter)
    : [];

  const TABS = ['overview', 'users', 'feedback'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-500 border border-accent-500/20 uppercase tracking-wide">Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/app')}
              className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              App
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white dark:bg-gray-900 animate-pulse border border-gray-100 dark:border-gray-800" />
            ))}
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (!userStats || !feedbackStats) && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-5 text-sm text-red-600 dark:text-red-400 space-y-1">
                {errors.users && <p>⚠️ Users: {errors.users}</p>}
                {errors.feedback && <p>⚠️ Feedback: {errors.feedback}</p>}
                {!errors.users && !errors.feedback && <p>⚠️ Data unavailable.</p>}
              </div>
            )}
            {activeTab === 'overview' && userStats && feedbackStats && (
              <div className="space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="👥" label="Total Users" value={userStats.totalUsers} sub={`${userStats.usersWithUsername} with username`} color="accent" />
                  <StatCard icon="⚡" label="Active Users" value={userStats.activeUsers} sub={`${userStats.totalUsers > 0 ? Math.round((userStats.activeUsers / userStats.totalUsers) * 100) : 0}% of total`} color="green" />
                  <StatCard icon="✨" label="Total XP Given" value={userStats.totalXP.toLocaleString()} sub={`avg ${userStats.avgXP} XP / user`} color="yellow" />
                  <StatCard icon="💬" label="Feedback" value={feedbackStats.entries.length} sub={`${feedbackStats.bugCount} bugs · ${feedbackStats.suggestionCount} ideas`} color="blue" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Level Distribution */}
                  <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <SectionHeader title="Level Distribution" sub="Users grouped by current level" />
                    {levelChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={levelChartData} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
                          <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                          <Bar dataKey="count" name="Users" fill={ACCENT} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-sm text-gray-400">No level data yet</div>
                    )}
                  </div>

                  {/* Feedback Breakdown */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <SectionHeader title="Feedback Types" sub="Bug reports vs suggestions" />
                    {pieData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-1">
                          {pieData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                              {d.name} ({d.value})
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-sm text-gray-400">No feedback yet</div>
                    )}
                  </div>
                </div>

                {/* Feedback Activity (last 7 days) */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <SectionHeader title="Feedback Activity" sub="Last 7 days" />
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={feedbackStats.dailyCounts}>
                      <defs>
                        <linearGradient id="feedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={ACCENT} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Submissions" stroke={ACCENT} strokeWidth={2} fill="url(#feedGrad)" dot={{ fill: ACCENT, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Streak Milestones */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <SectionHeader title="Streak Milestones Claimed" sub="Users who earned each badge" />
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { days: 7, emoji: '🔥', label: '7-Day Streak', xp: '+50 XP', color: 'orange' },
                      { days: 30, emoji: '💪', label: '30-Day Streak', xp: '+100 XP', color: 'red' },
                      { days: 100, emoji: '🏆', label: '100-Day Streak', xp: '+200 XP', color: 'yellow' },
                    ].map(({ days, emoji, label, xp, color }) => {
                      const count = userStats.milestones[days] || 0;
                      const pct = userStats.totalUsers > 0 ? Math.round((count / userStats.totalUsers) * 100) : 0;
                      return (
                        <div key={days} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <div className="text-2xl mb-1">{emoji}</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">{count}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{pct}% of users · {xp}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === 'users' && !userStats && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-5 text-sm text-red-600 dark:text-red-400">
                ⚠️ {errors.users || 'Could not load user stats. Check Supabase RLS policies for the profiles table.'}
              </div>
            )}
            {activeTab === 'users' && userStats && (
              <div className="space-y-8">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="👥" label="Total Users" value={userStats.totalUsers} color="accent" />
                  <StatCard icon="⚡" label="Active (XP > 0)" value={userStats.activeUsers} color="green" />
                  <StatCard icon="🏷️" label="Have Username" value={userStats.usersWithUsername} sub={`${userStats.totalUsers - userStats.usersWithUsername} anonymous`} color="yellow" />
                  <StatCard icon="✨" label="Avg XP" value={userStats.avgXP} sub={`${userStats.totalXP.toLocaleString()} total XP`} color="blue" />
                </div>

                {/* Top 10 Leaderboard */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <SectionHeader title="Top 10 Users" sub="Ranked by XP earned" />
                  </div>
                  {userStats.topUsers.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-400">No users with XP yet.</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left py-2.5 px-5 font-medium">#</th>
                          <th className="text-left py-2.5 px-5 font-medium">User</th>
                          <th className="text-left py-2.5 px-5 font-medium">Level</th>
                          <th className="text-right py-2.5 px-5 font-medium">XP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userStats.topUsers.map((u, i) => (
                          <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="py-3 px-5 text-sm font-medium text-gray-400 dark:text-gray-500 w-10">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </td>
                            <td className="py-3 px-5">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.username}</span>
                            </td>
                            <td className="py-3 px-5">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-500 font-semibold">
                                Lv {u.level} · {getLevelTitle(u.level)}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {u.xp.toLocaleString()} XP
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <SectionHeader title="Recently Active" sub="Last 7 users by profile update" />
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-2.5 px-5 font-medium">User</th>
                        <th className="text-left py-2.5 px-5 font-medium">XP</th>
                        <th className="text-right py-2.5 px-5 font-medium">Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStats.recentUsers.map((u) => (
                        <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-5 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {u.username || <span className="text-gray-400 italic">No username</span>}
                          </td>
                          <td className="py-3 px-5 text-sm text-gray-500 dark:text-gray-400">{u.xp > 0 ? `${u.xp} XP` : '—'}</td>
                          <td className="py-3 px-5 text-right text-xs text-gray-400 dark:text-gray-500">{timeAgo(u.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Level distribution chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <SectionHeader title="Level Distribution" sub="Number of users at each level" />
                  {levelChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={levelChartData} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
                        <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                        <Bar dataKey="count" name="Users" fill={ACCENT} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data yet</div>
                  )}
                </div>
              </div>
            )}

            {/* ── FEEDBACK TAB ── */}
            {activeTab === 'feedback' && !feedbackStats && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-5 text-sm text-red-600 dark:text-red-400">
                ⚠️ {errors.feedback || 'Could not load feedback. Make sure the feedback table exists and RLS policies are configured.'}
              </div>
            )}
            {activeTab === 'feedback' && feedbackStats && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4">
                  <StatCard icon="💬" label="Total" value={feedbackStats.entries.length} color="accent" />
                  <StatCard icon="🐛" label="Bug Reports" value={feedbackStats.bugCount} color="red" />
                  <StatCard icon="💡" label="Suggestions" value={feedbackStats.suggestionCount} color="blue" />
                </div>

                {/* Activity chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <SectionHeader title="Submissions — Last 7 Days" />
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={feedbackStats.dailyCounts}>
                      <defs>
                        <linearGradient id="feedGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={ACCENT} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Submissions" stroke={ACCENT} strokeWidth={2} fill="url(#feedGrad2)" dot={{ fill: ACCENT, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: `All (${feedbackStats.entries.length})` },
                    { id: 'bug', label: `🐛 Bugs (${feedbackStats.bugCount})` },
                    { id: 'suggestion', label: `💡 Suggestions (${feedbackStats.suggestionCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFeedbackFilter(tab.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        feedbackFilter === tab.id
                          ? 'bg-accent-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Entries */}
                {filteredFeedback.length === 0 ? (
                  <div className="text-center py-16 text-sm text-gray-400 dark:text-gray-500">
                    {feedbackStats.entries.length === 0 ? 'No feedback yet.' : 'No items match this filter.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFeedback.map((entry) => {
                      const username = entry.profiles?.username || 'Anonymous';
                      const isBug = entry.type === 'bug';
                      return (
                        <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                isBug
                                  ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                  : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                              }`}>
                                {isBug ? '🐛' : '💡'} {isBug ? 'Bug Report' : 'Suggestion'}
                              </span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{username}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(entry.created_at)}</span>
                            </div>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingId === entry.id}
                              className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-40"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

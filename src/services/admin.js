import { supabase } from './supabase';

export async function getAdminUserStats() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, gamification, updated_at');
  if (error) throw error;
  const profiles = data || [];

  const totalUsers = profiles.length;
  const usersWithUsername = profiles.filter((p) => p.username).length;
  const activeUsers = profiles.filter((p) => (p.gamification?.xp || 0) > 0).length;
  const totalXP = profiles.reduce((sum, p) => sum + (p.gamification?.xp || 0), 0);
  const avgXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;

  // Level distribution
  const levelCounts = {};
  profiles.forEach((p) => {
    const xp = p.gamification?.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  // Streak milestone claims
  let milestone7 = 0, milestone30 = 0, milestone100 = 0;
  profiles.forEach((p) => {
    const claimed = p.gamification?.streakMilestonesClaimed || [];
    if (claimed.includes(7)) milestone7++;
    if (claimed.includes(30)) milestone30++;
    if (claimed.includes(100)) milestone100++;
  });

  // Top 10 users by XP
  const topUsers = profiles
    .filter((p) => (p.gamification?.xp || 0) > 0)
    .map((p) => ({
      id: p.id,
      username: p.username || 'Anonymous',
      xp: p.gamification?.xp || 0,
      level: Math.floor((p.gamification?.xp || 0) / 100) + 1,
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);

  // Recent signups (last 7, sorted by updated_at desc)
  const recentUsers = [...profiles]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 7)
    .map((p) => ({
      id: p.id,
      username: p.username || null,
      xp: p.gamification?.xp || 0,
      updated_at: p.updated_at,
    }));

  return {
    totalUsers,
    activeUsers,
    usersWithUsername,
    totalXP,
    avgXP,
    levelCounts,
    milestones: { 7: milestone7, 30: milestone30, 100: milestone100 },
    topUsers,
    recentUsers,
  };
}

export async function getAdminFeedbackStats() {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, type, message, created_at, user_id, profiles(username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const entries = data || [];

  const bugCount = entries.filter((e) => e.type === 'bug').length;
  const suggestionCount = entries.filter((e) => e.type === 'suggestion').length;

  // Last 7 days breakdown
  const now = Date.now();
  const dayMs = 86400000;
  const dailyCounts = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now - (6 - i) * dayMs);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + dayMs);
    const label = dayStart.toLocaleDateString('en-US', { weekday: 'short' });
    const count = entries.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    }).length;
    return { label, count };
  });

  return { entries, bugCount, suggestionCount, dailyCounts };
}

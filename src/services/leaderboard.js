import { supabase } from './supabase';

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, gamification')
    .not('gamification', 'is', null);
  if (error) throw error;
  return (data || [])
    .map((p) => ({
      id: p.id,
      username: p.username || 'Anonymous',
      xp: p.gamification?.xp || 0,
    }))
    .filter((p) => p.xp > 0)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 50);
}

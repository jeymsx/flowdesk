import { supabase } from './supabase';

export async function getLeaderboard() {
  // Use the DB-side RPC so sorting and limiting happen in Postgres,
  // avoiding a full table scan + client-side sort at scale.
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: 50 });
  if (!error) return data || [];

  // Fallback: direct query with a row cap so we never pull the whole table.
  const { data: fallback, error: fbErr } = await supabase
    .from('profiles')
    .select('id, username, gamification')
    .not('gamification', 'is', null)
    .not('username', 'is', null)
    .limit(500);
  if (fbErr) throw fbErr;
  return (fallback || [])
    .map((p) => ({ id: p.id, username: p.username, xp: p.gamification?.xp || 0 }))
    .filter((p) => p.xp > 0)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 50);
}

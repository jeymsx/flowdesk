import { supabase } from './supabase';

/**
 * Fetch leaderboard entries ranked by total XP.
 * @param {number} limit - Number of entries to fetch (default 50)
 * @param {number} offset - Number of entries to skip for pagination
 */
export async function getLeaderboard(limit = 50, offset = 0) {
  // Use the DB-side RPC with pagination support.
  const { data, error } = await supabase.rpc('get_leaderboard', { 
    p_limit: limit,
    p_offset: offset 
  });
  
  if (!error) return data || [];

  // Fallback: direct query with a row cap if RPC fails/is missing offset support
  const { data: fallback, error: fbErr } = await supabase
    .from('profiles')
    .select('id, username, gamification')
    .not('gamification', 'is', null)
    .not('username', 'is', null)
    .limit(200);
    
  if (fbErr) throw fbErr;

  return (fallback || [])
    .map((p) => ({ id: p.id, username: p.username, xp: p.gamification?.xp || 0 }))
    .filter((p) => p.xp > 0)
    .sort((a, b) => b.xp - a.xp)
    .slice(offset, offset + limit);
}

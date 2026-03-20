import { supabase } from './supabase';

export async function getGamification(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('gamification')
    .eq('id', userId)
    .single();
  return data?.gamification || {};
}

export async function saveGamification(userId, gamification) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, gamification, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Awards XP via server-validated RPC — the server defines valid amounts per reason.
// Returns the amount awarded, or throws on failure.
export async function awardXPRemote(reason) {
  const { data, error } = await supabase.rpc('award_xp', { p_reason: reason });
  if (error) throw error;
  return data; // amount awarded
}

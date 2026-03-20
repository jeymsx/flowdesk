import { supabase } from './supabase';

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function checkUsernameAvailable(username, userId) {
  // Use RPC so it runs with SECURITY DEFINER, bypassing RLS on the profiles table.
  // Falls back to a direct query if the RPC doesn't exist.
  const { data, error } = await supabase.rpc('check_username_available', {
    p_username: username.trim().toLowerCase(),
    p_user_id: userId,
  });
  if (error) {
    // RPC not set up — fall back to direct query (may be blocked by RLS)
    const { data: row, error: qErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .neq('id', userId)
      .maybeSingle();
    if (qErr) throw qErr;
    return row === null;
  }
  return data === true;
}

export async function upsertProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

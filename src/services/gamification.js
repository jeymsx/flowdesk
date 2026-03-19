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

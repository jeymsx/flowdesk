import { supabase } from './supabase';

export async function submitFeedback(userId, type, message) {
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: userId || null, type, message });
  if (error) throw error;
}

export async function getAllFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, type, message, created_at, user_id, profiles(username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteFeedback(id) {
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) throw error;
}

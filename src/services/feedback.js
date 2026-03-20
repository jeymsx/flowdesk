import { supabase } from './supabase';

export async function submitFeedback(userId, type, message) {
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: userId || null, type, message });
  if (error) throw error;
}

export async function getAllFeedback() {
  const { data, error } = await supabase.rpc('get_admin_feedback');
  if (error) throw error;
  return data || [];
}

export async function deleteFeedback(id) {
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) throw error;
}

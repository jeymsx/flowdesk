import { supabase } from './supabase';

export async function fetchMilestones(userId) {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createMilestone(userId, title, date, description) {
  const { data, error } = await supabase
    .from('milestones')
    .insert({ user_id: userId, title, date, description: description || '' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMilestone(id, updates) {
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMilestone(id) {
  const { error } = await supabase.from('milestones').delete().eq('id', id);
  if (error) throw error;
}

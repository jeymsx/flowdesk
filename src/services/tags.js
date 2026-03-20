import { supabase } from './supabase';

export async function fetchTags(userId) {
  const { data, error } = await supabase
    .from('user_tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTag(userId, name, color = '#22c55e') {
  const { data, error } = await supabase
    .from('user_tags')
    .insert({ user_id: userId, name, color })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTag(id, updates, userId) {
  const { data, error } = await supabase
    .from('user_tags')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id, userId) {
  const { error } = await supabase.from('user_tags').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

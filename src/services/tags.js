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

export async function createTag(userId, name) {
  const { data, error } = await supabase
    .from('user_tags')
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id) {
  const { error } = await supabase.from('user_tags').delete().eq('id', id);
  if (error) throw error;
}

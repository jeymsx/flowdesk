import { supabase } from './supabase';

export async function fetchBookmarks(userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBookmark(userId, { url, title, annotation, folder }) {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, url, title, annotation: annotation || '', folder: folder || null, favorite: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookmark(id, updates, userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBookmark(id, userId) {
  const { error } = await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

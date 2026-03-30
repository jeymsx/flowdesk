import { supabase } from './supabase';

export async function fetchMusicLinks(userId) {
  const { data, error } = await supabase
    .from('music_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createMusicLink(userId, label, media) {
  const { data, error } = await supabase
    .from('music_links')
    .insert({
      user_id: userId,
      label: label || 'Saved',
      video_id: media.videoId || null,
      list_id: media.listId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMusicLink(id, userId) {
  const { error } = await supabase
    .from('music_links')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

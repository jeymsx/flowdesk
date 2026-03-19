import { supabase } from './supabase';
import { encryptNote, decryptNote, decryptNotes } from '../lib/notesCrypto';

export async function fetchNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return decryptNotes(userId, data ?? []);
}

export async function createNote(userId, title = '', content = '', tags = []) {
  const encrypted = await encryptNote(userId, { title, content, tags });
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, ...encrypted })
    .select()
    .single();
  if (error) throw error;
  return decryptNote(userId, data);
}

export async function updateNote(id, updates, userId) {
  const fieldsToEncrypt = {};
  if ('title' in updates) fieldsToEncrypt.title = updates.title;
  if ('content' in updates) fieldsToEncrypt.content = updates.content;
  if ('tags' in updates) fieldsToEncrypt.tags = updates.tags;

  const encrypted = Object.keys(fieldsToEncrypt).length
    ? await encryptNote(userId, {
        title: fieldsToEncrypt.title ?? '',
        content: fieldsToEncrypt.content ?? '',
        tags: fieldsToEncrypt.tags ?? [],
      })
    : {};

  const { data, error } = await supabase
    .from('notes')
    .update({ ...encrypted, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return decryptNote(userId, data);
}

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

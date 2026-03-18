import { supabase } from './supabase';

export async function fetchAllEvents(userId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEventsForMonth(userId, year, month) {
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true });

  if (error) throw error;

  return (data ?? []).filter((evt) => {
    const endOrStart = evt.end_date || evt.start_date;
    return endOrStart >= startDate;
  });
}

export async function createEvent(userId, title, startDate, endDate = null, color = '#22c55e', description = '') {
  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: userId,
      title,
      start_date: startDate,
      end_date: endDate || null,
      color,
      description: description || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

import { supabase } from './supabase';

export async function fetchLayout(userId) {
  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveLayout(userId, layoutData, widgets, activeSavedLayoutId = null) {
  const { error } = await supabase
    .from('layouts')
    .upsert(
      {
        user_id: userId,
        layout_data: layoutData,
        widgets,
        active_layout_id: activeSavedLayoutId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export async function persistSavedLayouts(userId, savedLayouts) {
  const { error } = await supabase
    .from('layouts')
    .upsert(
      { user_id: userId, saved_layouts: savedLayouts, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export async function persistTaskOrder(userId, taskOrder) {
  const { error } = await supabase
    .from('layouts')
    .upsert(
      { user_id: userId, task_order: taskOrder, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

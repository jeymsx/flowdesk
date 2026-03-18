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
  const payload = {
    user_id: userId,
    layout_data: layoutData,
    widgets,
    active_layout_id: activeSavedLayoutId,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('layouts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('layouts')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('layouts').insert(payload);
    if (error) throw error;
  }
}

export async function persistSavedLayouts(userId, savedLayouts) {
  const { data: existing } = await supabase
    .from('layouts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('layouts')
      .update({ saved_layouts: savedLayouts })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('layouts')
      .insert({ user_id: userId, saved_layouts: savedLayouts });
    if (error) throw error;
  }
}

export async function persistTaskOrder(userId, taskOrder) {
  const { data: existing } = await supabase
    .from('layouts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('layouts')
      .update({ task_order: taskOrder })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('layouts')
      .insert({ user_id: userId, task_order: taskOrder });
    if (error) throw error;
  }
}

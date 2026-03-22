import { create } from 'zustand';
import { fetchTags, createTag, updateTag as updateTagService, deleteTag as deleteTagService } from '../services/tags';
import { useEventsStore } from './eventsStore';

export const useTagsStore = create((set, get) => ({
  tags: [],
  loading: false,
  _userId: null,
  _loaded: false,

  reset: () => set({ tags: [], loading: false, _userId: null, _loaded: false }),

  load: async (userId) => {
    if (get()._userId === userId && get()._loaded) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchTags(userId);
      set({ tags: data, _loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  addTag: async (userId, name, color = '#22c55e') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (get().tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    const tag = await createTag(userId, trimmed, color);
    set((s) => ({ tags: [...s.tags, tag].sort((a, b) => a.name.localeCompare(b.name)) }));
    return tag;
  },

  updateTagColor: async (id, color) => {
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, color } : t)) }));
    await updateTagService(id, { color }, get()._userId);
  },

  renameTag: async (id, oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (get().tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    // Persist the tag row first. If this fails nothing local has changed yet,
    // so there's nothing to roll back — cleaner than an optimistic-then-revert dance.
    await updateTagService(id, { name: trimmed }, get()._userId);
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, name: trimmed } : t)) }));
    await useEventsStore.getState().renameTagInEvents(oldName, trimmed);
  },

  removeTag: async (id) => {
    await deleteTagService(id, get()._userId);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },
}));

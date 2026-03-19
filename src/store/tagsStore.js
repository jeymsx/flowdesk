import { create } from 'zustand';
import { fetchTags, createTag, deleteTag as deleteTagService } from '../services/tags';

export const useTagsStore = create((set, get) => ({
  tags: [],
  loading: false,
  _userId: null,

  load: async (userId) => {
    if (get()._userId === userId && get().tags.length > 0) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchTags(userId);
      set({ tags: data });
    } finally {
      set({ loading: false });
    }
  },

  addTag: async (userId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (get().tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    const tag = await createTag(userId, trimmed);
    set((s) => ({ tags: [...s.tags, tag].sort((a, b) => a.name.localeCompare(b.name)) }));
    return tag;
  },

  removeTag: async (id) => {
    await deleteTagService(id);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },
}));

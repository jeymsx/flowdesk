import { create } from 'zustand';
import {
  fetchBookmarks,
  createBookmark,
  updateBookmark as updateBookmarkService,
  deleteBookmark as deleteBookmarkService,
} from '../services/bookmarks';

export const useBookmarksStore = create((set, get) => ({
  bookmarks: [],
  loading: false,
  _userId: null,
  _loaded: false,

  reset: () => set({ bookmarks: [], loading: false, _userId: null, _loaded: false }),

  load: async (userId) => {
    if (get()._userId === userId && get()._loaded) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchBookmarks(userId);
      set({ bookmarks: data, _loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  addBookmark: async (userId, fields) => {
    const data = await createBookmark(userId, fields);
    set((s) => ({ bookmarks: [data, ...s.bookmarks] }));
  },

  updateBookmark: async (id, updates) => {
    const data = await updateBookmarkService(id, updates, get()._userId);
    set((s) => ({ bookmarks: s.bookmarks.map((b) => (b.id === id ? data : b)) }));
  },

  deleteBookmark: async (id) => {
    await deleteBookmarkService(id, get()._userId);
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
  },

  toggleFavorite: async (id, current) => {
    // Optimistic update
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, favorite: !current } : b)),
    }));
    try {
      await updateBookmarkService(id, { favorite: !current }, get()._userId);
    } catch {
      // Rollback
      set((s) => ({
        bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, favorite: current } : b)),
      }));
    }
  },
}));

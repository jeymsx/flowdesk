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

  reset: () => set({ bookmarks: [], loading: false, _userId: null }),

  load: async (userId) => {
    if (get()._userId === userId && get().bookmarks.length > 0) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchBookmarks(userId);
      set({ bookmarks: data });
    } finally {
      set({ loading: false });
    }
  },

  addBookmark: async (userId, fields) => {
    const data = await createBookmark(userId, fields);
    set((s) => ({ bookmarks: [data, ...s.bookmarks] }));
  },

  updateBookmark: async (id, updates) => {
    const data = await updateBookmarkService(id, updates);
    set((s) => ({ bookmarks: s.bookmarks.map((b) => (b.id === id ? data : b)) }));
  },

  deleteBookmark: async (id) => {
    await deleteBookmarkService(id);
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
  },

  toggleFavorite: async (id, current) => {
    // Optimistic update
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, favorite: !current } : b)),
    }));
    try {
      await updateBookmarkService(id, { favorite: !current });
    } catch {
      // Rollback
      set((s) => ({
        bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, favorite: current } : b)),
      }));
    }
  },
}));

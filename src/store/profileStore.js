import { create } from 'zustand';
import { getProfile, upsertProfile } from '../services/profiles';

export const useProfileStore = create((set, get) => ({
  profile: undefined, // undefined = not loaded yet, null = loaded but no row
  loading: false,
  _userId: null,

  reset: () => set({ profile: undefined, loading: false, _userId: null }),

  fetchProfile: async (userId) => {
    // Block if already loaded OR if a fetch is already in-flight for this user.
    // Without the `loading` check, two concurrent calls both pass the guard while
    // `profile` is still `undefined`, resulting in duplicate requests.
    if (get()._userId === userId && (get().profile !== undefined || get().loading)) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await getProfile(userId);
      set({ profile: data ?? null, loading: false });
    } catch {
      // Keep profile as undefined so we don't show "set username" on a network error
      set({ loading: false });
    }
  },

  updateUsername: async (userId, username) => {
    const data = await upsertProfile(userId, { username });
    set({ profile: data });
    return data;
  },
}));

import { create } from 'zustand';
import { getProfile, upsertProfile } from '../services/profiles';

export const useProfileStore = create((set) => ({
  profile: undefined, // undefined = not loaded yet, null = loaded but no row
  loading: false,

  fetchProfile: async (userId) => {
    set({ loading: true });
    try {
      const data = await getProfile(userId);
      set({ profile: data ?? null, loading: false });
    } catch {
      set({ profile: null, loading: false });
    }
  },

  updateUsername: async (userId, username) => {
    const data = await upsertProfile(userId, { username });
    set({ profile: data });
    return data;
  },
}));

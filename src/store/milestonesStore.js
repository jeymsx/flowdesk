import { create } from 'zustand';
import { fetchMilestones, createMilestone, updateMilestone, deleteMilestone } from '../services/milestones';

export const useMilestonesStore = create((set, get) => ({
  milestones: [],
  loading: false,
  _userId: null,
  _loaded: false,

  reset: () => set({ milestones: [], loading: false, _userId: null, _loaded: false }),

  load: async (userId) => {
    if (!userId) return;
    // Skip re-fetch if already loaded for this user
    if (get()._userId === userId && get()._loaded) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchMilestones(userId);
      set({ milestones: data, _loaded: true });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  addMilestone: async (userId, title, date, description) => {
    const m = await createMilestone(userId, title, date, description);
    set((s) => ({
      milestones: [...s.milestones, m].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    return m;
  },

  editMilestone: async (id, updates) => {
    const updated = await updateMilestone(id, updates, get()._userId);
    set((s) => ({
      milestones: s.milestones
        .map((m) => (m.id === id ? updated : m))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));
    return updated;
  },

  removeMilestone: async (id) => {
    await deleteMilestone(id, get()._userId);
    set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }));
  },
}));

import { create } from 'zustand';
import { fetchMilestones, createMilestone, updateMilestone, deleteMilestone } from '../services/milestones';

export const useMilestonesStore = create((set) => ({
  milestones: [],
  loading: false,

  reset: () => set({ milestones: [], loading: false }),

  load: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const data = await fetchMilestones(userId);
      set({ milestones: data });
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
    const updated = await updateMilestone(id, updates);
    set((s) => ({
      milestones: s.milestones
        .map((m) => (m.id === id ? updated : m))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));
    return updated;
  },

  removeMilestone: async (id) => {
    await deleteMilestone(id);
    set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }));
  },
}));

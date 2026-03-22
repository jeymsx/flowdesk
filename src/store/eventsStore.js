import { create } from 'zustand';
import { fetchAllEvents, createEvent, updateEvent, deleteEvent, renameTagInEvents as renameTagRpc } from '../services/events';
import { useGamificationStore } from './gamificationStore';

export const useEventsStore = create((set, get) => ({
  events: [],
  loading: false,
  _userId: null,
  _loaded: false,

  reset: () => set({ events: [], loading: false, _userId: null, _loaded: false }),

  load: async (userId) => {
    if (!userId) return;
    // Skip re-fetch if already loaded for this user
    if (get()._userId === userId && get()._loaded) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchAllEvents(userId);
      set({ events: data, _loaded: true });
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      set({ loading: false });
    }
  },

  addEvent: async (userId, title, startDate, endDate, color, description, tags = []) => {
    const evt = await createEvent(userId, title, startDate, endDate, color, description, tags);
    set((s) => ({
      events: [...s.events, evt].sort((a, b) => a.start_date.localeCompare(b.start_date)),
    }));
    return evt;
  },

  updateEvent: async (id, updates) => {
    const evt = await updateEvent(id, updates, get()._userId);
    set((s) => ({
      events: s.events
        .map((e) => (e.id === id ? evt : e))
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    }));
    return evt;
  },

  deleteEvent: async (id) => {
    await deleteEvent(id, get()._userId);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  // Rename a tag name across all events (optimistic + DB, rolls back on any failure)
  renameTagInEvents: async (oldName, newName) => {
    const originalEvents = get().events;
    const userId = get()._userId;
    // Optimistic update
    let changed = false;
    const newEvents = originalEvents.map((e) => {
      if (!e.tags?.includes(oldName)) return e;
      changed = true;
      return { ...e, tags: e.tags.map((t) => (t === oldName ? newName : t)) };
    });
    if (!changed) return;
    set({ events: newEvents });
    try {
      // Single server-side UPDATE instead of N parallel calls
      await renameTagRpc(userId, oldName, newName);
    } catch (err) {
      console.error('Failed to rename tag in events; rolling back', err);
      set({ events: originalEvents });
    }
  },

  // Optimistic toggle for completed — instant UI, then confirm with server
  toggleComplete: async (id, current) => {
    const next = !current;
    const event = get().events.find((e) => e.id === id);
    // Only award XP on first-ever completion (xp_awarded tracks this permanently)
    const shouldAwardXP = next && !event?.xp_awarded;
    set((s) => ({
      events: s.events.map((e) =>
        e.id === id ? { ...e, completed: next, ...(shouldAwardXP ? { xp_awarded: true } : {}) } : e
      ),
    }));
    if (shouldAwardXP) {
      const { awardXP, loaded } = useGamificationStore.getState();
      if (loaded) await awardXP('task_complete');
    }
    try {
      const updates = { completed: next };
      if (shouldAwardXP) updates.xp_awarded = true;
      await updateEvent(id, updates, get()._userId);
    } catch (err) {
      console.error(err);
      // Roll back both completed state and xp_awarded flag
      set((s) => ({
        events: s.events.map((e) =>
          e.id === id
            ? { ...e, completed: current, ...(shouldAwardXP ? { xp_awarded: false } : {}) }
            : e
        ),
      }));
    }
  },
}));

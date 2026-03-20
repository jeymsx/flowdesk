import { create } from 'zustand';
import { fetchAllEvents, createEvent, updateEvent, deleteEvent } from '../services/events';
import { useGamificationStore } from './gamificationStore';

export const useEventsStore = create((set, get) => ({
  events: [],
  loading: false,
  _userId: null,

  load: async (userId) => {
    if (!userId) return;
    set({ loading: true, _userId: userId });
    try {
      const data = await fetchAllEvents(userId);
      set({ events: data });
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
    const evt = await updateEvent(id, updates);
    set((s) => ({
      events: s.events
        .map((e) => (e.id === id ? evt : e))
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    }));
    return evt;
  },

  deleteEvent: async (id) => {
    await deleteEvent(id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  // Rename a tag name across all events (optimistic + DB)
  renameTagInEvents: (oldName, newName) => {
    const dbUpdates = [];
    const newEvents = get().events.map((e) => {
      if (!e.tags?.includes(oldName)) return e;
      const newTags = e.tags.map((t) => (t === oldName ? newName : t));
      dbUpdates.push({ id: e.id, newTags });
      return { ...e, tags: newTags };
    });
    if (!dbUpdates.length) return;
    set({ events: newEvents });
    dbUpdates.forEach(({ id, newTags }) => updateEvent(id, { tags: newTags }).catch(console.error));
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
      if (loaded) awardXP(10, 'Task complete');
    }
    try {
      const updates = { completed: next };
      if (shouldAwardXP) updates.xp_awarded = true;
      await updateEvent(id, updates);
    } catch (err) {
      console.error(err);
      set((s) => ({
        events: s.events.map((e) => (e.id === id ? { ...e, completed: current } : e)),
      }));
    }
  },
}));

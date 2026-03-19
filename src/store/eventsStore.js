import { create } from 'zustand';
import { fetchAllEvents, createEvent, updateEvent, deleteEvent } from '../services/events';

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

  // Optimistic toggle for completed — instant UI, then confirm with server
  toggleComplete: async (id, current) => {
    const next = !current;
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, completed: next } : e)),
    }));
    try {
      await updateEvent(id, { completed: next });
    } catch (err) {
      console.error(err);
      set((s) => ({
        events: s.events.map((e) => (e.id === id ? { ...e, completed: current } : e)),
      }));
    }
  },
}));

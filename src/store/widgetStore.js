import { create } from 'zustand';
import { fetchLayout, saveLayout, persistSavedLayouts, persistTaskOrder } from '../services/layouts';

export const ALL_WIDGETS = [
  { id: 'calendar-1', type: 'calendar', label: 'Calendar' },
  { id: 'notes-1', type: 'notes', label: 'Notes' },
  { id: 'focus-1', type: 'focus', label: 'Focus Timer' },
  { id: 'music-1', type: 'music', label: 'Music' },
  { id: 'tasks-1', type: 'tasks', label: 'Tasks' },
  { id: 'clock-1', type: 'clock', label: 'Clock' },
  { id: 'streak-1', type: 'streak', label: 'Consistency' },
  { id: 'milestones-1', type: 'milestones', label: 'Milestones' },
  { id: 'bookmarks-1', type: 'bookmarks', label: 'Bookmarks' },
];

export const DEFAULT_VISIBLE = ['calendar-1', 'notes-1', 'focus-1', 'music-1', 'tasks-1', 'clock-1', 'streak-1', 'milestones-1'];

export const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'calendar-1', x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'notes-1', x: 6, y: 0, w: 3, h: 5, minW: 3, minH: 3 },
    { i: 'focus-1', x: 9, y: 0, w: 3, h: 5, minW: 3, minH: 4 },
    { i: 'music-1', x: 6, y: 5, w: 3, h: 6, minW: 3, minH: 5 },
    { i: 'tasks-1', x: 9, y: 5, w: 3, h: 6, minW: 3, minH: 4 },
    { i: 'clock-1', x: 0, y: 8, w: 2, h: 5, minW: 2, minH: 3 },
    { i: 'streak-1', x: 2, y: 8, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'milestones-1', x: 6, y: 11, w: 3, h: 4, minW: 3, minH: 4 },
    { i: 'bookmarks-1', x: 9, y: 11, w: 3, h: 7, minW: 3, minH: 5 },
  ],
  md: [
    { i: 'calendar-1', x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'notes-1', x: 6, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
    { i: 'focus-1', x: 6, y: 5, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'music-1', x: 0, y: 8, w: 5, h: 6, minW: 3, minH: 5 },
    { i: 'tasks-1', x: 5, y: 8, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'clock-1', x: 0, y: 14, w: 3, h: 5, minW: 2, minH: 3 },
    { i: 'streak-1', x: 3, y: 14, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'milestones-1', x: 7, y: 14, w: 3, h: 4, minW: 3, minH: 4 },
    { i: 'bookmarks-1', x: 0, y: 18, w: 5, h: 7, minW: 3, minH: 5 },
  ],
  sm: [
    { i: 'calendar-1', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'notes-1', x: 0, y: 8, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'focus-1', x: 0, y: 13, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'music-1', x: 0, y: 18, w: 6, h: 6, minW: 3, minH: 5 },
    { i: 'tasks-1', x: 0, y: 24, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'clock-1', x: 0, y: 30, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'streak-1', x: 0, y: 35, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'milestones-1', x: 0, y: 40, w: 6, h: 4, minW: 3, minH: 4 },
    { i: 'bookmarks-1', x: 0, y: 44, w: 6, h: 7, minW: 3, minH: 5 },
  ],
  xs: [
    { i: 'calendar-1', x: 0, y: 0, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'notes-1', x: 0, y: 8, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'focus-1', x: 0, y: 13, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'music-1', x: 0, y: 18, w: 4, h: 6, minW: 2, minH: 5 },
    { i: 'tasks-1', x: 0, y: 24, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'clock-1', x: 0, y: 30, w: 4, h: 5, minW: 2, minH: 3 },
    { i: 'streak-1', x: 0, y: 35, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'milestones-1', x: 0, y: 40, w: 4, h: 4, minW: 3, minH: 4 },
    { i: 'bookmarks-1', x: 0, y: 44, w: 4, h: 7, minW: 3, minH: 5 },
  ],
};

// Per-breakpoint grid columns and default new-widget sizes
const BP_COLS = { lg: 12, md: 10, sm: 6, xs: 4 };
const BP_NEW_W = { lg: 3, md: 4, sm: 6, xs: 4 };
const NEW_H = 5;

// Find the first (x, y) where a w×h item fits without overlapping existing items
function findAvailableSpot(items, w, h, cols) {
  if (items.length === 0) return { x: 0, y: 0 };
  const maxY = items.reduce((m, item) => Math.max(m, item.y + item.h), 0);
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const overlaps = items.some(
        (item) =>
          x < item.x + item.w &&
          x + w > item.x &&
          y < item.y + item.h &&
          y + h > item.y
      );
      if (!overlaps) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

let saveTimeout = null;

function persistLayout(get) {
  const userId = get()._userId;
  if (!userId) return;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const { layouts, visibleWidgetIds, activeSavedLayoutId } = get();
    saveLayout(userId, layouts, visibleWidgetIds, activeSavedLayoutId).catch(() => {});
  }, 800);
}

export const useWidgetStore = create((set, get) => ({
  allWidgets: ALL_WIDGETS,
  visibleWidgetIds: DEFAULT_VISIBLE,
  layouts: DEFAULT_LAYOUTS,
  savedLayouts: [],
  activeSavedLayoutId: null,
  taskOrder: [],
  initialized: false,
  _userId: null,

  loadLayout: async (userId) => {
    try {
      const saved = await fetchLayout(userId);
      if (saved) {
        set({
          layouts: saved.layout_data || DEFAULT_LAYOUTS,
          visibleWidgetIds: Array.isArray(saved.widgets) ? saved.widgets : DEFAULT_VISIBLE,
          savedLayouts: Array.isArray(saved.saved_layouts) ? saved.saved_layouts : [],
          activeSavedLayoutId: saved.active_layout_id || null,
          taskOrder: Array.isArray(saved.task_order) ? saved.task_order : [],
          initialized: true,
        });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  onLayoutChange: (_currentLayout, allLayouts) => {
    const { layouts: currentLayouts, visibleWidgetIds } = get();
    // Preserve layout entries for hidden widgets so toggling back on restores their position
    const merged = {};
    const allBps = new Set([...Object.keys(currentLayouts), ...Object.keys(allLayouts)]);
    for (const bp of allBps) {
      const incoming = allLayouts[bp] || [];
      const hidden = (currentLayouts[bp] || []).filter((item) => !visibleWidgetIds.includes(item.i));
      merged[bp] = [...incoming, ...hidden];
    }
    set({ layouts: merged, activeSavedLayoutId: null });
    persistLayout(get);
  },

  setUserId: (userId) => set({ _userId: userId }),

  toggleWidget: (id) => {
    const { visibleWidgetIds, layouts } = get();
    const isVisible = visibleWidgetIds.includes(id);

    if (isVisible) {
      const next = visibleWidgetIds.filter((wid) => wid !== id);
      set({ visibleWidgetIds: next });
    } else {
      const next = [...visibleWidgetIds, id];
      set({ visibleWidgetIds: next });
      // Find the default spec for this widget (size/minW/minH constraints)
      const defaultSpec = DEFAULT_LAYOUTS.lg?.find((item) => item.i === id);
      const newLayouts = {};
      for (const [bp, items] of Object.entries(layouts)) {
        const cols = BP_COLS[bp] ?? 12;
        const w = defaultSpec ? (DEFAULT_LAYOUTS[bp]?.find((item) => item.i === id)?.w ?? BP_NEW_W[bp] ?? 3) : (BP_NEW_W[bp] ?? 3);
        const h = defaultSpec ? (DEFAULT_LAYOUTS[bp]?.find((item) => item.i === id)?.h ?? NEW_H) : NEW_H;
        const minW = defaultSpec?.minW ?? 3;
        const minH = defaultSpec?.minH ?? 4;
        const existingIdx = items.findIndex((item) => item.i === id);
        if (existingIdx !== -1) {
          // Reset to default dimensions but keep position
          const existing = items[existingIdx];
          const updated = { ...existing, w, h, minW, minH };
          newLayouts[bp] = items.map((item, i) => (i === existingIdx ? updated : item));
        } else {
          const visibleItems = items.filter((item) => next.includes(item.i) && item.i !== id);
          const { x, y } = findAvailableSpot(visibleItems, w, h, cols);
          newLayouts[bp] = [...items, { i: id, x, y, w, h, minW, minH }];
        }
      }
      set({ layouts: newLayouts });
    }
    persistLayout(get);
  },

  resetLayout: () => {
    set({ layouts: DEFAULT_LAYOUTS, visibleWidgetIds: DEFAULT_VISIBLE, activeSavedLayoutId: null });
    persistLayout(get);
  },

  setWidgetHeight: (id, h) => {
    const { layouts } = get();
    const newLayouts = {};
    for (const [bp, items] of Object.entries(layouts)) {
      newLayouts[bp] = items.map((item) =>
        item.i === id ? { ...item, h: Math.max(h, item.minH ?? 1) } : item
      );
    }
    set({ layouts: newLayouts });
    persistLayout(get);
  },

  saveCurrentLayout: (name) => {
    const { layouts, visibleWidgetIds, savedLayouts, _userId } = get();
    const entry = {
      id: crypto.randomUUID(),
      name,
      layout_data: layouts,
      widgets: visibleWidgetIds,
      created_at: new Date().toISOString(),
    };
    const next = [...savedLayouts, entry];
    set({ savedLayouts: next });
    if (_userId) persistSavedLayouts(_userId, next).catch(() => {});
  },

  applySavedLayout: (id) => {
    const { savedLayouts } = get();
    const entry = savedLayouts.find((s) => s.id === id);
    if (!entry) return;
    set({ layouts: entry.layout_data, visibleWidgetIds: entry.widgets, activeSavedLayoutId: id });
    persistLayout(get);
  },

  renameSavedLayout: (id, name) => {
    const { savedLayouts, _userId } = get();
    const next = savedLayouts.map((s) => (s.id === id ? { ...s, name } : s));
    set({ savedLayouts: next });
    if (_userId) persistSavedLayouts(_userId, next).catch(() => {});
  },

  deleteSavedLayout: (id) => {
    const { savedLayouts, _userId } = get();
    const next = savedLayouts.filter((s) => s.id !== id);
    set({ savedLayouts: next });
    if (_userId) persistSavedLayouts(_userId, next).catch(() => {});
  },

  setTaskOrder: (order) => {
    set({ taskOrder: order });
    const userId = get()._userId;
    if (userId) persistTaskOrder(userId, order).catch(() => {});
  },

  getVisibleWidgets: () => {
    const { allWidgets, visibleWidgetIds } = get();
    return allWidgets.filter((w) => visibleWidgetIds.includes(w.id));
  },
}));

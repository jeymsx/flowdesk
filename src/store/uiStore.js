import { create } from 'zustand';

const getInitialDarkMode = () => {
  try {
    const stored = localStorage.getItem('flowdesk-dark-mode');
    if (stored !== null) return JSON.parse(stored);
  } catch {}
  return false;
};

const getInitialLocked = () => {
  try {
    const stored = localStorage.getItem('flowdesk-layout-locked');
    if (stored !== null) return JSON.parse(stored);
  } catch {}
  return false;
};

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  darkMode: getInitialDarkMode(),
  layoutLocked: getInitialLocked(),
  showUsernameModal: false,
  mobileTab: 'home',
  showMobileWidgets: false,
  showMobileProfile: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobileTab: (tab) => set({ mobileTab: tab }),
  setShowMobileWidgets: (v) => set({ showMobileWidgets: v }),
  setShowMobileProfile: (v) => set({ showMobileProfile: v }),

  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      try { localStorage.setItem('flowdesk-dark-mode', JSON.stringify(next)); } catch {}
      return { darkMode: next };
    }),

  toggleLayoutLocked: () =>
    set((s) => {
      const next = !s.layoutLocked;
      try { localStorage.setItem('flowdesk-layout-locked', JSON.stringify(next)); } catch {}
      return { layoutLocked: next };
    }),

  setShowUsernameModal: (v) => set({ showUsernameModal: v }),

  focusRunning: false,
  setFocusRunning: (v) => set({ focusRunning: v }),

  musicActive: false,
  setMusicActive: (v) => set({ musicActive: v }),

  leaveGuardPending: null,
  setLeaveGuardPending: (dest) => set({ leaveGuardPending: dest }),

  isDemo: false,
  enterDemo: () => set({ isDemo: true }),
  exitDemo: () => set({ isDemo: false }),

  errorToasts: [],
  pushError: (message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ errorToasts: [...s.errorToasts, { id, message }] }));
    setTimeout(() => {
      set((s) => ({ errorToasts: s.errorToasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
}));

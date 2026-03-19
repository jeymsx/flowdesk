import { create } from 'zustand';

const getInitialDarkMode = () => {
  const stored = localStorage.getItem('flowdesk-dark-mode');
  if (stored !== null) return JSON.parse(stored);
  return true;
};

const getInitialLocked = () => {
  const stored = localStorage.getItem('flowdesk-layout-locked');
  if (stored !== null) return JSON.parse(stored);
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
      localStorage.setItem('flowdesk-dark-mode', JSON.stringify(next));
      return { darkMode: next };
    }),

  toggleLayoutLocked: () =>
    set((s) => {
      const next = !s.layoutLocked;
      localStorage.setItem('flowdesk-layout-locked', JSON.stringify(next));
      return { layoutLocked: next };
    }),

  setShowUsernameModal: (v) => set({ showUsernameModal: v }),

  focusRunning: false,
  setFocusRunning: (v) => set({ focusRunning: v }),
}));

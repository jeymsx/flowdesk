import { create } from 'zustand';

const getInitialDarkMode = () => {
  const stored = localStorage.getItem('flowdesk-dark-mode');
  if (stored !== null) return JSON.parse(stored);
  return true;
};

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  darkMode: getInitialDarkMode(),
  showUsernameModal: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      localStorage.setItem('flowdesk-dark-mode', JSON.stringify(next));
      return { darkMode: next };
    }),

  setShowUsernameModal: (v) => set({ showUsernameModal: v }),

  focusRunning: false,
  setFocusRunning: (v) => set({ focusRunning: v }),
}));

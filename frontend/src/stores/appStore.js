import { create } from 'zustand';

const useAppStore = create((set) => ({
  sidebarOpen: true,
  activePanel: 'upload',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));

export default useAppStore;

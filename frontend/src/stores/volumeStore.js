import { create } from 'zustand';

const useVolumeStore = create((set) => ({
  files: null,
  volumeMeta: null,
  isUploading: false,
  isLoading: false,
  loadProgress: 0,
  activeLayout: 'mpr',
  activeTool: 'windowLevel',
  activePreset: 'CT-Bone',

  setFiles: (files) => set({ files }),
  setVolumeMeta: (meta) => set({ volumeMeta: meta }),
  setUploading: (flag) => set({ isUploading: flag }),
  setLoading: (flag) => set({ isLoading: flag }),
  setLoadProgress: (progress) => set({ loadProgress: progress }),
  setActiveLayout: (layout) => set({ activeLayout: layout }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActivePreset: (preset) => set({ activePreset: preset }),
  reset: () =>
    set({
      files: null,
      volumeMeta: null,
      isUploading: false,
      isLoading: false,
      loadProgress: 0,
      activeLayout: 'mpr',
      activeTool: 'windowLevel',
      activePreset: 'CT-Bone',
    }),
}));

export default useVolumeStore;

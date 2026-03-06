import { create } from 'zustand';

const useViewerStore = create((set) => ({
  currentFile: null,
  currentStudy: null,
  analysisResult: null,
  isAnalyzing: false,
  activeTool: 'windowLevel',
  viewportData: null,

  setFile: (file) => set({ currentFile: file }),
  setStudy: (study) => set({ currentStudy: study }),
  setAnalysis: (result) => set({ analysisResult: result }),
  setAnalyzing: (flag) => set({ isAnalyzing: flag }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setViewportData: (data) => set({ viewportData: data }),
  reset: () =>
    set({
      currentFile: null,
      currentStudy: null,
      analysisResult: null,
      isAnalyzing: false,
      activeTool: 'windowLevel',
      viewportData: null,
    }),
}));

export default useViewerStore;

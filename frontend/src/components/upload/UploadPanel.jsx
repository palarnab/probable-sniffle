import { useCallback, useRef, useState } from 'react';
import { Upload, FileImage, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useViewerStore from '@/stores/viewerStore';
import useAppStore from '@/stores/appStore';
import { uploadDicom } from '@/services/api';
import { cn } from '@/lib/utils';

export default function UploadPanel() {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const setFile = useViewerStore((s) => s.setFile);
  const setStudy = useViewerStore((s) => s.setStudy);
  const setAnalysis = useViewerStore((s) => s.setAnalysis);
  const isAnalyzing = useViewerStore((s) => s.isAnalyzing);
  const setAnalyzing = useViewerStore((s) => s.setAnalyzing);
  const currentFile = useViewerStore((s) => s.currentFile);
  const setActivePanel = useAppStore((s) => s.setActivePanel);

  const processFile = useCallback(
    async (file) => {
      if (!file) return;
      setFile(file);
      setAnalyzing(true);

      try {
        const result = await uploadDicom(file);
        setStudy(result.study);
        setAnalysis(result);
        setActivePanel('findings');
        toast.success('Analysis complete', {
          description: `Triage: ${result.triage?.priority || 'Routine'}`,
        });
      } catch (err) {
        toast.error('Analysis failed', {
          description: err.response?.data?.error || err.message,
        });
      } finally {
        setAnalyzing(false);
      }
    },
    [setFile, setStudy, setAnalysis, setAnalyzing, setActivePanel]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-text">Upload DICOM</h3>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
          dragOver
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-text-dim hover:bg-panel-hover/50'
        )}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-xs text-text-muted">Analyzing…</p>
          </>
        ) : (
          <>
            <Upload size={32} className="text-text-dim" />
            <div className="text-center">
              <p className="text-sm text-text-muted">
                Drop DICOM file here
              </p>
              <p className="text-xs text-text-dim mt-1">
                or click to browse
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".dcm,application/dicom"
        className="hidden"
        onChange={handleFileChange}
      />

      {currentFile && !isAnalyzing && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-panel text-xs">
          <FileImage size={16} className="text-primary shrink-0" />
          <span className="text-text-muted truncate">{currentFile.name}</span>
        </div>
      )}
    </div>
  );
}

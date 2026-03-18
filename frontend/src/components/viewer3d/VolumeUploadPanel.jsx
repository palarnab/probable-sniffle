import { useCallback, useRef, useState } from 'react';
import { Upload, FolderOpen, Loader2, FileStack, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import useVolumeStore from '@/stores/volumeStore';
import { uploadVolume } from '@/services/volumeApi';
import { cn } from '@/lib/utils';

export default function VolumeUploadPanel() {
  const inputRef = useRef(null);
  const folderRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const setFiles = useVolumeStore((s) => s.setFiles);
  const setVolumeMeta = useVolumeStore((s) => s.setVolumeMeta);
  const isUploading = useVolumeStore((s) => s.isUploading);
  const setUploading = useVolumeStore((s) => s.setUploading);
  const files = useVolumeStore((s) => s.files);

  const isDicomFile = (file) => {
    const name = file.name.toLowerCase();
    return (
      name.endsWith('.dcm') ||
      name.endsWith('.dicom') ||
      !name.includes('.') ||
      file.type === 'application/dicom'
    );
  };

  const processFiles = useCallback(
    async (fileList) => {
      const dicomFiles = Array.from(fileList).filter(isDicomFile);

      if (dicomFiles.length === 0) {
        toast.error('No DICOM files found', {
          description: 'Please upload .dcm files or a DICOM series folder.',
        });
        return;
      }

      if (dicomFiles.length < 2) {
        toast.error('Need multiple slices', {
          description: 'A 3D volume requires at least 2 DICOM slices. Use the 2D viewer for single images.',
        });
        return;
      }

      setFiles(dicomFiles);
      setUploading(true);
      setUploadProgress(0);

      try {
        const result = await uploadVolume(dicomFiles, (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        });

        setVolumeMeta({
          volumeId: result.volumeId,
          modality: result.modality,
          patientName: result.patientName,
          bodyPart: result.bodyPart,
          sliceCount: result.sliceCount,
          dimensions: result.dimensions,
        });

        toast.success('Volume loaded', {
          description: `${dicomFiles.length} slices — ${result.modality || 'DICOM'} series ready for 3D viewing`,
        });
      } catch (err) {
        toast.error('Upload failed', {
          description: err.response?.data?.error?.message || err.message,
        });
        setVolumeMeta(null);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [setFiles, setVolumeMeta, setUploading],
  );

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setDragOver(false);

      const items = e.dataTransfer.items;
      const allFiles = [];

      if (items) {
        const entries = [];
        for (const item of items) {
          const entry = item.webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }

        const readDirectory = (dirEntry) =>
          new Promise((resolve) => {
            const reader = dirEntry.createReader();
            const results = [];
            const readBatch = () => {
              reader.readEntries((entries) => {
                if (entries.length === 0) {
                  resolve(results);
                } else {
                  results.push(...entries);
                  readBatch();
                }
              });
            };
            readBatch();
          });

        const readEntry = async (entry) => {
          if (entry.isFile) {
            return new Promise((resolve) => entry.file(resolve));
          }
          if (entry.isDirectory) {
            const subEntries = await readDirectory(entry);
            const files = [];
            for (const sub of subEntries) {
              const f = await readEntry(sub);
              if (Array.isArray(f)) files.push(...f);
              else if (f) files.push(f);
            }
            return files;
          }
          return null;
        };

        for (const entry of entries) {
          const result = await readEntry(entry);
          if (Array.isArray(result)) allFiles.push(...result);
          else if (result) allFiles.push(result);
        }
      }

      if (allFiles.length > 0) {
        processFiles(allFiles);
      } else {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleFileChange = useCallback(
    (e) => {
      if (e.target.files?.length) processFiles(e.target.files);
    },
    [processFiles],
  );

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-text">Upload DICOM Series</h3>
      <p className="text-xs text-text-dim">
        Drop a folder or select multiple DICOM files from a CT, MRI, or other volumetric series.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
          dragOver
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-text-dim hover:bg-panel-hover/50',
        )}
      >
        {isUploading ? (
          <>
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-xs text-text-muted">
              Uploading… {uploadProgress > 0 && `${uploadProgress}%`}
            </p>
          </>
        ) : (
          <>
            <FolderOpen size={32} className="text-text-dim" />
            <div className="text-center">
              <p className="text-sm text-text-muted">Drop DICOM folder here</p>
              <p className="text-xs text-text-dim mt-1">or use the buttons below</p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => folderRef.current?.click()}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors disabled:opacity-50"
        >
          <FolderOpen size={14} />
          Select Folder
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-panel text-text-muted text-xs font-medium hover:bg-panel-hover transition-colors disabled:opacity-50"
        >
          <Upload size={14} />
          Select Files
        </button>
      </div>

      <input
        ref={folderRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        {...{ webkitdirectory: '', directory: '', mozdirectory: '' }}
        multiple
      />
      <input
        ref={inputRef}
        type="file"
        accept=".dcm,.dicom,application/dicom"
        className="hidden"
        onChange={handleFileChange}
        multiple
      />

      {files && files.length > 0 && !isUploading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-panel text-xs">
          <FileStack size={16} className="text-primary shrink-0" />
          <span className="text-text-muted truncate">
            {files.length} DICOM files loaded
          </span>
        </div>
      )}

      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="flex items-start gap-2 text-xs text-text-dim">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-text-muted">Supported modalities</p>
            <p>CT, MRI, PET, NM, US, and other volumetric DICOM series with multiple slices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

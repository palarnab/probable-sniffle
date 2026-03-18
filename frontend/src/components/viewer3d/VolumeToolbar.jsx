import { Contrast, ZoomIn, Move, Crosshair, ArrowUpDown, RotateCcw } from 'lucide-react';
import useVolumeStore from '@/stores/volumeStore';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

const tools = [
  { id: 'windowLevel', icon: Contrast, label: 'Window/Level' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
  { id: 'pan', icon: Move, label: 'Pan' },
  { id: 'scroll', icon: ArrowUpDown, label: 'Scroll' },
  { id: 'crosshairs', icon: Crosshair, label: 'Crosshairs' },
];

export default function VolumeToolbar() {
  const activeTool = useVolumeStore((s) => s.activeTool);
  const setActiveTool = useVolumeStore((s) => s.setActiveTool);
  const volumeMeta = useVolumeStore((s) => s.volumeMeta);
  const loadProgress = useVolumeStore((s) => s.loadProgress);
  const isLoading = useVolumeStore((s) => s.isLoading);

  const handleReset = useCallback(() => {
    setActiveTool('windowLevel');
  }, [setActiveTool]);

  return (
    <div className="h-11 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-1">
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            title={label}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors',
              activeTool === id
                ? 'bg-primary/20 text-primary'
                : 'text-text-muted hover:bg-panel-hover hover:text-text',
            )}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={handleReset}
          title="Reset"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-text-muted hover:bg-panel-hover hover:text-text transition-colors"
        >
          <RotateCcw size={15} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono text-text-dim">
        {isLoading && (
          <span className="text-primary">Loading {loadProgress}%</span>
        )}
        {volumeMeta && (
          <>
            <span>{volumeMeta.modality}</span>
            <span>{volumeMeta.sliceCount} slices</span>
            {volumeMeta.dimensions?.rows && volumeMeta.dimensions?.columns && (
              <span>
                {volumeMeta.dimensions.columns} x {volumeMeta.dimensions.rows}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

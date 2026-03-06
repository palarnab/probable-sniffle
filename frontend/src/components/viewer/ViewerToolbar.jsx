import { Contrast, ZoomIn, Move, Ruler, RotateCcw } from 'lucide-react';
import useViewerStore from '@/stores/viewerStore';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

const tools = [
  { id: 'windowLevel', icon: Contrast, label: 'Window/Level' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
  { id: 'pan', icon: Move, label: 'Pan' },
  { id: 'length', icon: Ruler, label: 'Measure' },
];

export default function ViewerToolbar() {
  const activeTool = useViewerStore((s) => s.activeTool);
  const setActiveTool = useViewerStore((s) => s.setActiveTool);
  const viewportData = useViewerStore((s) => s.viewportData);

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
                : 'text-text-muted hover:bg-panel-hover hover:text-text'
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

      {viewportData && (
        <div className="flex items-center gap-4 text-[11px] font-mono text-text-dim">
          {viewportData.columns && viewportData.rows && (
            <span>{viewportData.columns} × {viewportData.rows}</span>
          )}
          {viewportData.windowWidth != null && (
            <span>
              W: {Math.round(viewportData.windowWidth)} / L: {Math.round(viewportData.windowCenter)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import { Upload as UploadIcon, Info } from 'lucide-react';
import Header from '@/components/layout/Header';
import VolumeToolbar from '@/components/viewer3d/VolumeToolbar';
import VolumeViewer from '@/components/viewer3d/VolumeViewer';
import VolumeUploadPanel from '@/components/viewer3d/VolumeUploadPanel';
import VolumeInfoPanel from '@/components/viewer3d/VolumeInfoPanel';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const panels = [
  { id: 'upload', icon: UploadIcon, label: 'Upload' },
  { id: 'info', icon: Info, label: 'Info' },
];

function PanelTabs({ active, onChange }) {
  return (
    <div className="flex border-b border-border">
      {panels.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            active === id
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-text-dim hover:text-text-muted hover:bg-panel-hover/50',
          )}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

function RightPanel() {
  const [active, setActive] = useState('upload');

  return (
    <aside className="w-80 bg-surface border-l border-border flex flex-col shrink-0">
      <PanelTabs active={active} onChange={setActive} />
      <div className="flex-1 overflow-hidden">
        {active === 'upload' && <VolumeUploadPanel />}
        {active === 'info' && <VolumeInfoPanel />}
      </div>
    </aside>
  );
}

export default function Viewer3DPage() {
  return (
    <>
      <Header title="3D Volume Viewer" />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <VolumeToolbar />
          <VolumeViewer />
        </div>
        <RightPanel />
      </div>
    </>
  );
}

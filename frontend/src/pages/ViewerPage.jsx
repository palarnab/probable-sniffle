import { Upload as UploadIcon, FileSearch, Info } from 'lucide-react';
import Header from '@/components/layout/Header';
import ViewerToolbar from '@/components/viewer/ViewerToolbar';
import DicomViewer from '@/components/viewer/DicomViewer';
import UploadPanel from '@/components/upload/UploadPanel';
import FindingsPanel from '@/components/findings/FindingsPanel';
import useAppStore from '@/stores/appStore';
import { cn } from '@/lib/utils';

const panels = [
  { id: 'upload', icon: UploadIcon, label: 'Upload' },
  { id: 'findings', icon: FileSearch, label: 'Findings' },
];

function PanelTabs() {
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);

  return (
    <div className="flex border-b border-border">
      {panels.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setActivePanel(id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            activePanel === id
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-text-dim hover:text-text-muted hover:bg-panel-hover/50'
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
  const activePanel = useAppStore((s) => s.activePanel);

  return (
    <aside className="w-80 bg-surface border-l border-border flex flex-col shrink-0">
      <PanelTabs />
      <div className="flex-1 overflow-hidden">
        {activePanel === 'upload' && <UploadPanel />}
        {activePanel === 'findings' && <FindingsPanel />}
      </div>
    </aside>
  );
}

export default function ViewerPage() {
  return (
    <>
      <Header title="DICOM Viewer" />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ViewerToolbar />
          <DicomViewer />
        </div>
        <RightPanel />
      </div>
    </>
  );
}

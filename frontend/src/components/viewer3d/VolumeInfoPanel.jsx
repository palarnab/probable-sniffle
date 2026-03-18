import { Box, Cpu, Layers, Ruler } from 'lucide-react';
import useVolumeStore from '@/stores/volumeStore';

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs py-1">
      <span className="text-text-dim">{label}</span>
      <span className="text-text font-mono">{value || '—'}</span>
    </div>
  );
}

export default function VolumeInfoPanel() {
  const meta = useVolumeStore((s) => s.volumeMeta);
  const files = useVolumeStore((s) => s.files);

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <Box size={32} className="text-text-dim" />
        <p className="text-sm text-text-muted">No volume loaded</p>
        <p className="text-xs text-text-dim">Upload a DICOM series to see details</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      <section>
        <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">
          Volume Info
        </h4>
        <div className="bg-panel rounded-lg p-3 space-y-0.5">
          <InfoRow label="Patient" value={meta.patientName} />
          <InfoRow label="Modality" value={meta.modality} />
          <InfoRow label="Body Part" value={meta.bodyPart} />
          <InfoRow label="Volume ID" value={meta.volumeId?.slice(0, 12)} />
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">
          Dimensions
        </h4>
        <div className="bg-panel rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Layers size={13} />
            <span>{meta.sliceCount ?? files?.length ?? '—'} slices</span>
          </div>
          {meta.dimensions?.rows && meta.dimensions?.columns && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Ruler size={13} />
              <span>
                {meta.dimensions.columns} x {meta.dimensions.rows} px per slice
              </span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">
          Navigation Tips
        </h4>
        <div className="bg-panel rounded-lg p-3 space-y-2 text-xs text-text-dim">
          <p><span className="text-text-muted font-medium">Left click:</span> Window/Level</p>
          <p><span className="text-text-muted font-medium">Right click:</span> Zoom</p>
          <p><span className="text-text-muted font-medium">Middle click:</span> Pan</p>
          <p><span className="text-text-muted font-medium">Scroll wheel:</span> Navigate slices</p>
        </div>
      </section>
    </div>
  );
}

import { AlertTriangle, Cpu, Clock, FlaskConical } from 'lucide-react';
import useViewerStore from '@/stores/viewerStore';
import { formatDate, getConfidenceColor, getPriorityBadge, cn } from '@/lib/utils';
import ConfidenceChart from './ConfidenceChart';

function StudyInfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs py-1">
      <span className="text-text-dim">{label}</span>
      <span className="text-text font-mono">{value || '—'}</span>
    </div>
  );
}

function FindingRow({ condition, probability }) {
  const pct = Math.round(probability * 100);
  const color = getConfidenceColor(probability);
  const barColor =
    probability > 0.7
      ? 'bg-danger'
      : probability > 0.4
        ? 'bg-warning'
        : 'bg-success';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{condition}</span>
        <span className={cn('font-mono font-medium', color)}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function FindingsPanel() {
  const result = useViewerStore((s) => s.analysisResult);
  const study = useViewerStore((s) => s.currentStudy);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <FlaskConical size={32} className="text-text-dim" />
        <p className="text-sm text-text-muted">No analysis yet</p>
        <p className="text-xs text-text-dim">Upload a DICOM file to begin</p>
      </div>
    );
  }

  const { analysis, triage, audit } = result;
  const priority = getPriorityBadge(triage?.priority);
  const findings = analysis?.findings || [];

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {study && (
        <section>
          <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">
            Study Info
          </h4>
          <div className="bg-panel rounded-lg p-3 space-y-0.5">
            <StudyInfoRow label="Patient" value={study.patientName} />
            <StudyInfoRow label="Patient ID" value={study.patientId} />
            <StudyInfoRow label="Modality" value={study.modality} />
            <StudyInfoRow label="Body Part" value={study.bodyPart} />
            <StudyInfoRow label="Date" value={formatDate(study.studyDate)} />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider">
            Triage
          </h4>
          {analysis?.mockData && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/30">
              Mock Data
            </span>
          )}
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium',
            priority.className
          )}
        >
          <AlertTriangle size={14} />
          {priority.label}
        </div>
      </section>

      {findings.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">
            Findings
          </h4>
          <div className="space-y-3">
            {findings.map((f) => (
              <FindingRow
                key={f.condition}
                condition={f.condition}
                probability={f.probability}
              />
            ))}
          </div>
        </section>
      )}

      {findings.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">
            Distribution
          </h4>
          <ConfidenceChart findings={findings} />
        </section>
      )}

      <section>
        <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">
          Model
        </h4>
        <div className="bg-panel rounded-lg p-3 space-y-1 text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <Cpu size={13} />
            <span>{analysis?.model?.name ?? analysis?.model ?? '—'}</span>
          </div>
          {(analysis?.model?.version ?? analysis?.modelVersion) && (
            <div className="text-text-dim pl-5">
              v{analysis.model?.version ?? analysis.modelVersion}
            </div>
          )}
          {audit?.processingTimeMs && (
            <div className="flex items-center gap-2 text-text-dim">
              <Clock size={13} />
              <span>{audit.processingTimeMs}ms</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { getStudies } from '@/services/api';
import { formatDate, getPriorityBadge, cn } from '@/lib/utils';

const statusStyles = {
  completed: 'bg-success/15 text-success',
  analyzing: 'bg-primary/15 text-primary',
  pending: 'bg-warning/15 text-warning',
  failed: 'bg-danger/15 text-danger',
};

export default function WorklistTable() {
  const navigate = useNavigate();
  const { data: studies = [], isLoading, isError } = useQuery({
    queryKey: ['studies'],
    queryFn: getStudies,
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-danger text-sm">
        Failed to load studies. Is the backend running?
      </div>
    );
  }

  if (studies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Inbox size={40} className="text-text-dim" />
        <p className="text-sm text-text-muted">No studies yet</p>
        <p className="text-xs text-text-dim">Upload a DICOM file from the Viewer page</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-text-dim uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-medium">Patient Name</th>
            <th className="text-left py-3 px-4 font-medium">Patient ID</th>
            <th className="text-left py-3 px-4 font-medium">Modality</th>
            <th className="text-left py-3 px-4 font-medium">Body Part</th>
            <th className="text-left py-3 px-4 font-medium">Date</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody>
          {studies.map((s) => {
            const priority = getPriorityBadge(s.triage?.priority);
            const status = s.status || 'completed';

            return (
              <tr
                key={s.studyId || s._id}
                onClick={() => navigate(`/viewer?study=${s.studyId || s._id}`)}
                className="border-b border-border/50 hover:bg-panel-hover/50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 font-medium">{s.patientName || '—'}</td>
                <td className="py-3 px-4 font-mono text-text-muted">{s.patientId || '—'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-accent text-xs font-medium">
                    {s.modality || '—'}
                  </span>
                </td>
                <td className="py-3 px-4 text-text-muted">{s.bodyPart || '—'}</td>
                <td className="py-3 px-4 text-text-muted font-mono text-xs">
                  {formatDate(s.studyDate)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium capitalize',
                      statusStyles[status] || 'bg-panel text-text-muted'
                    )}
                  >
                    {status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded border text-xs font-medium',
                      priority.className
                    )}
                  >
                    {priority.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parse, format } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const cleaned = dateStr.replace(/[.\-/]/g, '');
    const date = parse(cleaned, 'yyyyMMdd', new Date());
    return format(date, 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

export function getConfidenceColor(probability) {
  if (probability > 0.7) return 'text-danger';
  if (probability > 0.4) return 'text-warning';
  return 'text-success';
}

export function getPriorityBadge(level) {
  const normalized = (level || '').toLowerCase();
  switch (normalized) {
    case 'critical':
      return { label: 'Critical', className: 'bg-critical/20 text-critical border-critical/40' };
    case 'urgent':
      return { label: 'Urgent', className: 'bg-warning/20 text-warning border-warning/40' };
    case 'routine':
      return { label: 'Routine', className: 'bg-primary/20 text-primary border-primary/40' };
    case 'low':
      return { label: 'Low', className: 'bg-success/20 text-success border-success/40' };
    default:
      return { label: level || 'Unknown', className: 'bg-panel text-text-muted border-border' };
  }
}

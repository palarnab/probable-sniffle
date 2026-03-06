import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { getHealth } from '@/services/api';
import { cn } from '@/lib/utils';

export default function Header({ title }) {
  const { data: health, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 15_000,
  });

  const isConnected = health && !isError;

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-5 shrink-0">
      <h2 className="text-sm font-semibold text-text">{title}</h2>

      <div className="flex items-center gap-2 text-xs">
        <Activity size={14} className={isConnected ? 'text-success' : 'text-danger'} />
        <span
          className={cn(
            'inline-block w-2 h-2 rounded-full',
            isConnected ? 'bg-success' : 'bg-danger'
          )}
        />
        <span className="text-text-dim">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </header>
  );
}

import { NavLink } from 'react-router-dom';
import { Upload, List, Eye, Box, PanelLeftClose, PanelLeft, Activity } from 'lucide-react';
import useAppStore from '@/stores/appStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/viewer', icon: Eye, label: 'Viewer' },
  { to: '/viewer3d', icon: Box, label: '3D Viewer' },
  { to: '/worklist', icon: List, label: 'Worklist' },
];

export default function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'h-screen bg-surface border-r border-border flex flex-col transition-all duration-200',
        sidebarOpen ? 'w-[280px]' : 'w-16'
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-sm text-white shrink-0">
          RC
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-text truncate">Radiology Copilot</h1>
            <p className="text-[10px] text-text-dim">AI Workstation</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:bg-panel-hover hover:text-text'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-panel-hover hover:text-text w-full transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          {sidebarOpen && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

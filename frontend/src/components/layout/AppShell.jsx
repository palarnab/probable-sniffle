import Sidebar from './Sidebar';
import useAppStore from '@/stores/appStore';

export default function AppShell({ children }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{
        gridTemplateColumns: `${sidebarOpen ? '280px' : '64px'} 1fr`,
      }}
    >
      <Sidebar />
      <main className="overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}

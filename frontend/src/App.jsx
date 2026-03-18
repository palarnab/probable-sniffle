import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import ViewerPage from '@/pages/ViewerPage';
import WorklistPage from '@/pages/WorklistPage';
import Viewer3DPage from '@/pages/Viewer3DPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/viewer" replace />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/viewer3d" element={<Viewer3DPage />} />
        <Route path="/worklist" element={<WorklistPage />} />
      </Routes>
    </AppShell>
  );
}

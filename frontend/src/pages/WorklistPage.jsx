import Header from '@/components/layout/Header';
import WorklistTable from '@/components/worklist/WorklistTable';

export default function WorklistPage() {
  return (
    <>
      <Header title="Study Worklist" />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <WorklistTable />
        </div>
      </div>
    </>
  );
}

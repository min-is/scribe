import { ReactNode } from 'react';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebarClient';
import SearchModal from '@/components/search/SearchModal';

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-main">
      {/* Sidebar */}
      <WorkspaceSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal />
    </div>
  );
}

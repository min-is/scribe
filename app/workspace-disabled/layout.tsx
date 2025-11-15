import { ReactNode } from 'react';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  // Temporarily simplified layout until we fix client component issues
  return (
    <div className="min-h-screen bg-main">
      <main>
        {children}
      </main>
    </div>
  );
}

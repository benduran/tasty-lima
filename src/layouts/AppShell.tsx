import type { PropsWithChildren } from 'react';
import { AppHeader } from '../components/app-header.tsx';
import { LogsDrawer } from '../components/logs-drawer.tsx';
import { useSyncInstanceOperations } from '../hooks/use-instance-operation.ts';

export function AppShell({ children }: PropsWithChildren) {
  /** effects */
  useSyncInstanceOperations();

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <LogsDrawer />
      {children}
    </div>
  );
}

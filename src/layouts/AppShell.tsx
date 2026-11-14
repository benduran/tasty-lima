import type { PropsWithChildren } from 'react';
import { AppHeader } from '../components/app-header.tsx';
import { LogsDrawer } from '../components/logs-drawer.tsx';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <LogsDrawer />
      {children}
    </div>
  );
}

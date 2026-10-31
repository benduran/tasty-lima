import type { PropsWithChildren } from 'react';
import { AppHeader } from '../components/app-header.tsx';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      {children}
    </div>
  );
}

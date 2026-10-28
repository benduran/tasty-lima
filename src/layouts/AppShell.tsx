import type { PropsWithChildren } from 'react';
import { AppHeader } from '../components/app-headers.tsx';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      {children}
    </div>
  );
}

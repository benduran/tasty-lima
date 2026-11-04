import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { TooltipProvider } from '../components/ui/tooltip.tsx';
import { ThemeProvider } from './ThemeProvider.tsx';

export function TastyLimaProviders({ children }: PropsWithChildren) {
  /** state */
  const [client] = useState(() => new QueryClient());
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

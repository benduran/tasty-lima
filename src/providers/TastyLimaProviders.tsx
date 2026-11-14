import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { Toaster } from '../components/ui/toast.tsx';
import { TooltipProvider } from '../components/ui/tooltip.tsx';
import { ClientSocket } from '../lib/client-socket.ts';
import { ClientSocketProvider } from './ClientSocketProvider.tsx';
import { ThemeProvider } from './ThemeProvider.tsx';

const client = new QueryClient();
const clientSocket = new ClientSocket();

export function TastyLimaProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ClientSocketProvider socket={clientSocket}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ClientSocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

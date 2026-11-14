import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner.tsx';
import { TooltipProvider } from '../components/ui/tooltip.tsx';
import { ClientSocket } from '../lib/client-socket.ts';
import { errorToString } from '../shared/error-to-string.ts';
import { ClientSocketProvider } from './ClientSocketProvider.tsx';
import { ThemeProvider } from './ThemeProvider.tsx';

const queryCache = new QueryCache({
  onError: (error, query) => {
    if (query.meta?.suppressErrorToast) return;
    toast.error(query.meta?.errorTitle ?? 'Request failed', {
      description: errorToString(error),
      duration: Number.POSITIVE_INFINITY,
      id: `query-error:${query.queryHash}`,
    });
  },
});

const mutationCache = new MutationCache({
  onError: (error, variables, _context, mutation) => {
    const { suppressErrorToast, errorTitle } = mutation.meta ?? {};
    if (suppressErrorToast) return;
    toast.error(
      typeof errorTitle === 'function'
        ? errorTitle(variables as never)
        : (errorTitle ?? 'Request failed'),
      {
        description: errorToString(error),
        duration: Number.POSITIVE_INFINITY,
        id: `mutation-error:${mutation.mutationId}`,
      },
    );
  },
});

const client = new QueryClient({ mutationCache, queryCache });
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

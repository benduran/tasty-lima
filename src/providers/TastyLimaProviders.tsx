import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { Toaster, toast } from '../components/ui/toast.tsx';
import { TooltipProvider } from '../components/ui/tooltip.tsx';
import { ClientSocket } from '../lib/client-socket.ts';
import { errorToString } from '../shared/error-to-string.ts';
import { ClientSocketProvider } from './ClientSocketProvider.tsx';
import { ThemeProvider } from './ThemeProvider.tsx';

const queryCache = new QueryCache({
  onError: (error, query) => {
    if (query.meta?.suppressErrorToast) return;
    toast.add({
      description: errorToString(error),
      id: `query-error:${query.queryHash}`,
      timeout: Number.POSITIVE_INFINITY,
      title: query.meta?.errorTitle ?? 'Request failed',
      type: 'error',
    });
  },
});

const mutationCache = new MutationCache({
  onError: (error, variables, _context, mutation) => {
    const { suppressErrorToast, errorTitle } = mutation.meta ?? {};
    if (suppressErrorToast) return;
    toast.add({
      description: errorToString(error),
      id: `mutation-error:${mutation.mutationId}`,
      timeout: Number.POSITIVE_INFINITY,
      title:
        typeof errorTitle === 'function'
          ? errorTitle(variables as never)
          : (errorTitle ?? 'Request failed'),
      type: 'error',
    });
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

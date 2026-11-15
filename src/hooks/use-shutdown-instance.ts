import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { ShutdownInstanceRequestResponseSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import { useOpenLogsViewer } from '../stores/new-vm-store.ts';

export function useShutdownInstance() {
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();
  return useMutation({
    meta: {
      errorTitle: (opts: { name: string }) =>
        `Failed to shut down VM "${opts.name}"`,
    },
    mutationFn: async ({ name }: { name: string }) => {
      if (!name) {
        throw new Error('name is required when shutting down an instance');
      }
      openLogsViewer(name);
      return await websocketFetch({
        body: {
          data: { name },
          sender: 'client',
          type: 'request-shutdown-instance',
        },
        schema: ShutdownInstanceRequestResponseSchema,
        socket,
      });
    },
    mutationKey: ['useShutdownInstance'] as const,
    onSuccess: (_, { name }) => {
      toast.success(`VM "${name}" stopped`);
    },
  });
}

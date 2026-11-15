import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { BootInstanceRequestResponseSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import { clearInstanceLogs } from '../stores/instance-logs-store.ts';
import { useOpenLogsViewer } from '../stores/new-vm-store.ts';
import { createQueryKey } from './use-query-instances.ts';

export function useBootInstance() {
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();
  return useMutation({
    meta: {
      errorTitle: (opts: { name: string }) =>
        `Failed to boot VM "${opts.name}"`,
      operation: 'request-boot-instance',
    },
    mutationFn: async ({ name }: { name: string }) => {
      if (!name) {
        throw new Error('name is required when booting an instance');
      }
      clearInstanceLogs(name);
      openLogsViewer(name);
      return await websocketFetch({
        body: {
          data: { name },
          sender: 'client',
          type: 'request-boot-instance',
        },
        schema: BootInstanceRequestResponseSchema,
        socket,
      });
    },
    mutationKey: ['useBootInstance'] as const,
    onSettled: (_, __, ___, ____, ctx) =>
      ctx.client.invalidateQueries({ queryKey: createQueryKey() }),
    onSuccess: ({ degraded }, { name }) => {
      if (degraded) {
        toast.warning(`VM "${name}" booted in a degraded state`, {
          description:
            'It is running, but file sharing and port forwarding may not work. The logs have the details.',
        });
        return;
      }
      toast.success(`VM "${name}" is running`);
    },
  });
}

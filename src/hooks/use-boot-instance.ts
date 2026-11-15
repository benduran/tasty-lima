import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { BootInstanceRequestResponseSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import { useOpenLogsViewer } from '../stores/new-vm-store.ts';

export function useBootInstance() {
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();
  return useMutation({
    meta: {
      errorTitle: (opts: { name: string }) =>
        `Failed to boot VM "${opts.name}"`,
    },
    mutationFn: async ({ name }: { name: string }) => {
      if (!name) {
        throw new Error('name is required when booting an instance');
      }
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

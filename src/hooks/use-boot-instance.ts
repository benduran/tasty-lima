import { useMutation } from '@tanstack/react-query';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { BootInstanceRequestResponseSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import {
  useCloseLogsViewer,
  useOpenLogsViewer,
} from '../stores/new-vm-store.ts';
import { createQueryKey } from './use-query-instances.ts';

export function useBootInstance() {
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();
  const closeLogsViewer = useCloseLogsViewer();
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
    onSuccess: (_, __, ___, ctx) => {
      ctx.client.refetchQueries({ queryKey: createQueryKey() });
      closeLogsViewer();
    },
  });
}

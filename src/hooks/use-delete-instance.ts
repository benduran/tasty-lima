import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'wouter';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { DeleteInstanecResponseSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import {
  LOG_VIEWER_QUERY_PARAM,
  useOpenLogsViewer,
} from '../stores/new-vm-store.ts';
import { createQueryKey } from './use-query-instances.ts';

export function useDeleteInstance() {
  /** context */
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();
  const [search] = useSearchParams();

  return useMutation({
    meta: {
      errorTitle: (opts: { name: string }) =>
        `Failed to delete VM "${opts.name}"`,
    },
    mutationFn: async ({ name }: { name: string }) => {
      if (!name) {
        throw new Error('name is required when deleting an instance');
      }
      openLogsViewer(name);
      return await websocketFetch({
        body: {
          data: { name },
          sender: 'client',
          type: 'request-delete-instance',
        },
        schema: DeleteInstanecResponseSchema,
        socket,
      });
    },
    mutationKey: ['useDeleteInstance'] as const,
    onSuccess: (_, { name }, ___, ctx) => {
      ctx.client.refetchQueries({ queryKey: createQueryKey() });
      if (search.get(LOG_VIEWER_QUERY_PARAM) !== name) return;
    },
  });
}

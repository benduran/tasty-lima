import { useQuery } from '@tanstack/react-query';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import type { Nullish } from '../shared/types.ts';
import { ResponseQueryInstanceSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function createQueryKey(name: Nullish<string>) {
  return ['useQueryInstance', { name }] as const;
}

export function useQueryInstance(name: Nullish<string>) {
  /** store */
  const { socket } = useClientSocket();

  return useQuery({
    enabled: Boolean(name),
    queryFn: async ({ queryKey: [, opts] }) => {
      const { name } = opts;
      if (!name) return null;
      return await websocketFetch({
        body: {
          data: { name },
          sender: 'client',
          type: 'request-query-instance',
        },
        schema: ResponseQueryInstanceSchema,
        socket,
      });
    },
    queryKey: createQueryKey(name),
  });
}

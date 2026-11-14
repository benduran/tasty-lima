import { useQuery } from '@tanstack/react-query';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { LimaInstanceSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function createQueryKey() {
  return ['useQueryInstances'] as const;
}

export function useQueryInstances() {
  /** context */
  const { socket } = useClientSocket();
  return useQuery({
    queryFn: async () =>
      await websocketFetch({
        body: { sender: 'client', type: 'request-query-instances' },
        schema: LimaInstanceSchema.array(),
        socket,
      }),
    queryKey: createQueryKey(),
  });
}

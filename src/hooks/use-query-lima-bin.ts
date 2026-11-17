import { useQuery } from '@tanstack/react-query';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { LimaBinResponse } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function createQueryKey() {
  return ['useQueryLimaBin'] as const;
}

export function useQueryLimaBin() {
  /** store */
  const { socket } = useClientSocket();

  return useQuery({
    queryFn: async () => {
      const result = await websocketFetch({
        body: { sender: 'client', type: 'request-lima-bin' },
        schema: LimaBinResponse,
        socket,
      });

      return result || null;
    },
    queryKey: createQueryKey(),
  });
}

import { useQuery } from '@tanstack/react-query';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { LimaNetworkDefinitionSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useQueryNetworks() {
  /** context */
  const { socket } = useClientSocket();
  return useQuery({
    queryFn: async () =>
      await websocketFetch({
        body: { sender: 'client', type: 'request-query-networks' },
        schema: LimaNetworkDefinitionSchema.array(),
        socket,
      }),
    queryKey: ['useQueryNetworks'] as const,
  });
}

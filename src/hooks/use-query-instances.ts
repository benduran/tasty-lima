import { useQuery } from '@tanstack/react-query';
import { LimaInstanceSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useQueryInstances() {
  return useQuery({
    queryFn: async () =>
      await websocketFetch({
        body: { sender: 'client', type: 'request-query-instances' },
        schema: LimaInstanceSchema.array(),
      }),
    queryKey: ['useQueryInstances'] as const,
  });
}

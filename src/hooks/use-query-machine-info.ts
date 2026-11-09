import { useQuery } from '@tanstack/react-query';
import { MachineInfoSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useQueryMachineInfo() {
  return useQuery({
    queryFn: async () =>
      await websocketFetch({
        body: { sender: 'client', type: 'request-query-machine-info' },
        schema: MachineInfoSchema,
      }),
    queryKey: ['useQueryMachineInfo'] as const,
  });
}

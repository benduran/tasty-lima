import { useQuery } from '@tanstack/react-query';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { MachineInfoSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useQueryMachineInfo() {
  /** context */
  const { socket } = useClientSocket();
  return useQuery({
    queryFn: async () =>
      await websocketFetch({
        body: { sender: 'client', type: 'request-query-machine-info' },
        schema: MachineInfoSchema,
        socket,
      }),
    queryKey: ['useQueryMachineInfo'] as const,
  });
}

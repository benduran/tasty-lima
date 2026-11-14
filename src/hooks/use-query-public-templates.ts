import { useQuery } from '@tanstack/react-query';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { LimaTemplateSummarySchema } from '../shared/codecs.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useQueryPublicTemplates() {
  /** context */
  const { socket } = useClientSocket();
  return useQuery({
    queryFn: async () =>
      await websocketFetch({
        body: { sender: 'client', type: 'request-query-public-templates' },
        schema: LimaTemplateSummarySchema.array(),
        socket,
      }),
    queryKey: ['useQueryPublicTemplates'] as const,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

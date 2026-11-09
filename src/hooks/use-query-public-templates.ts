import { useQuery } from '@tanstack/react-query';
import { LimaTemplateSummarySchema } from '../shared/codecs.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useQueryPublicTemplates() {
  return useQuery({
    queryFn: async () =>
      await websocketFetch({
        body: { sender: 'client', type: 'request-query-public-templates' },
        schema: LimaTemplateSummarySchema.array(),
      }),
    queryKey: ['useQueryPublicTemplates'] as const,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

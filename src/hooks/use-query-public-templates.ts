import { useQuery } from '@tanstack/react-query';
import { jsonFetch } from '../lib/fetch.ts';
import { LimaTemplateSummarySchema } from '../shared/codecs.ts';
import { apiRoutes } from '../shared/routes.ts';

export function useQueryPublicTemplates() {
  return useQuery({
    queryFn: async () =>
      jsonFetch({
        schema: LimaTemplateSummarySchema.array(),
        url: apiRoutes.publicLimaTemplates(),
      }),
    queryKey: ['useQueryPublicTemplates'] as const,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

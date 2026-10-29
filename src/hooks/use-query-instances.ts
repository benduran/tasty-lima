import { useQuery } from '@tanstack/react-query';
import { jsonFetch } from '../lib/fetch.ts';
import { apiRoutes } from '../shared/routes.ts';
import { LimaInstanceSchema } from '../shared/types.ts';

export function useQueryInstances() {
  return useQuery({
    queryFn: async () =>
      jsonFetch({
        schema: LimaInstanceSchema.array(),
        url: apiRoutes.instances(),
      }),
    queryKey: ['useQueryInstances'] as const,
  });
}

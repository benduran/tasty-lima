import { useQuery } from '@tanstack/react-query';
import { jsonFetch } from '../lib/fetch.ts';
import { LimaInstanceSchema } from '../shared/limactl-types.gen.ts';
import { apiRoutes } from '../shared/routes.ts';

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

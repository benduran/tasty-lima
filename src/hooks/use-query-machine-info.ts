import { useQuery } from '@tanstack/react-query';
import { jsonFetch } from '../lib/fetch.ts';
import { apiRoutes } from '../shared/routes.ts';
import { MachineInfoSchema } from '../shared/types.ts';

export function useQueryMachineInfo() {
  return useQuery({
    queryFn: async () =>
      await jsonFetch({
        schema: MachineInfoSchema,
        url: apiRoutes.machineInfo(),
      }),
    queryKey: ['useQueryMachineInfo'] as const,
  });
}

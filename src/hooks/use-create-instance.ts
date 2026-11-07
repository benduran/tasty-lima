import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { jsonFetch } from '../lib/index.ts';
import { apiRoutes } from '../shared/routes.ts';
import type { CreateLimaVM } from '../shared/types.ts';
import { CreateLimaVMSchema } from '../shared/types.ts';

const MUTATION_KEY = ['useCreateInstance'] as const;

export function useCreateInstance() {
  return useMutation({
    mutationFn: async (opts: CreateLimaVM) => {
      const validated = CreateLimaVMSchema.parse(opts);
      return await jsonFetch({
        body: JSON.stringify(validated),
        method: 'POST',
        schema: z.any(),
        url: apiRoutes.createInstance(),
      });
    },
    mutationKey: MUTATION_KEY,
    onError: err => {
      /** TODO: show an error toast here. if we don't already have sonner installed, we need to add it */
    },
  });
}

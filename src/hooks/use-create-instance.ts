import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from '../components/ui/toast.tsx';
import { jsonFetch } from '../lib/index.ts';
import { errorToString } from '../shared/error-to-string.ts';
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
    onError: (err, opts) => {
      toast.add({
        description: errorToString(err),
        timeout: Number.POSITIVE_INFINITY,
        title: `Failed to create VM "${opts.name}"`,
        type: 'error',
      });
    },
    onSuccess: (_data, opts) => {
      toast.add({
        title: `VM "${opts.name}" created`,
        type: 'success',
      });
    },
  });
}

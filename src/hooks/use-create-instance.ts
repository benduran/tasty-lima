import { useMutation } from '@tanstack/react-query';
import { toast } from '../components/ui/toast.tsx';
import { errorToString } from '../shared/error-to-string.ts';
import type { CreateLimaVM } from '../shared/types.ts';
import { CreateLimaVMSchema, LimaInstanceSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

const MUTATION_KEY = ['useCreateInstance'] as const;

export function useCreateInstance() {
  return useMutation({
    mutationFn: async (opts: CreateLimaVM) => {
      const validated = CreateLimaVMSchema.parse(opts);
      return await websocketFetch({
        body: {
          createLimaVM: validated,
          sender: 'client',
          type: 'request-create-instance',
        },
        schema: LimaInstanceSchema,
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

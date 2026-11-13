import { useMutation } from '@tanstack/react-query';
import { DeleteInstanecResponseSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import { createQueryKey } from './use-query-instances.ts';

export function useDeleteInstance() {
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!name) {
        throw new Error('name is required when deleting an instance');
      }
      return await websocketFetch({
        body: { name, sender: 'client', type: 'request-delete-instance' },
        schema: DeleteInstanecResponseSchema,
      });
    },
    mutationKey: ['useDeleteInstance'] as const,
    onSuccess: (_, __, ___, ctx) => {
      ctx.client.refetchQueries({ queryKey: createQueryKey() });
    },
  });
}

import { useMutationState } from '@tanstack/react-query';
import type { Nullish } from '../shared/types.ts';
import { ShutdownInstanceRequestResponseSchema } from '../shared/types.ts';

/**
 * Latest boot/create/shutdown mutation for the named VM, read from the shared
 * mutation cache.
 * This helps inform the logs viewer and the instance grid state about "what"
 * the user just did to their VM.
 */
export function useInstanceOperation(name: Nullish<string>) {
  return useMutationState({
    filters: {
      predicate: ({ options, state }) =>
        Boolean(options.meta?.operation) &&
        ShutdownInstanceRequestResponseSchema.safeParse(state.variables).data
          ?.name === name,
    },
    select: ({ options, state }) => ({
      request: options.meta?.operation,
      state,
    }),
  }).at(-1);
}

export type InstanceOperation = NonNullable<
  ReturnType<typeof useInstanceOperation>
>;

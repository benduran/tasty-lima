import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import type { CreateLimaVM } from '../shared/types.ts';
import { CreateLimaVMSchema, LimaInstanceSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import {
  useCloseLogsViewer,
  useOpenLogsViewer,
} from '../stores/new-vm-store.ts';

const MUTATION_KEY = ['useCreateInstance'] as const;

export function useCreateInstance() {
  /** context */
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();
  const closeLogsViewer = useCloseLogsViewer();

  return useMutation({
    meta: {
      errorTitle: (opts: CreateLimaVM) => `Failed to create VM "${opts.name}"`,
    },
    mutationFn: async (opts: CreateLimaVM) => {
      const validated = CreateLimaVMSchema.parse(opts);
      openLogsViewer(validated.name);

      return await websocketFetch({
        body: {
          data: validated,
          sender: 'client',
          type: 'request-create-instance',
        },
        schema: LimaInstanceSchema,
        socket,
      });
    },
    mutationKey: MUTATION_KEY,
    onSuccess: (_data, opts) => {
      toast.success(`VM "${opts.name}" created`);
      closeLogsViewer();
    },
  });
}

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import type { CreateLimaVM } from '../shared/types.ts';
import { CreateLimaVMSchema, LimaInstanceSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import { clearInstanceLogs } from '../stores/instance-logs-store.ts';
import { useOpenLogsViewer } from '../stores/new-vm-store.ts';

const MUTATION_KEY = ['useCreateInstance'] as const;

export function useCreateInstance() {
  /** context */
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();

  return useMutation({
    meta: {
      errorTitle: (opts: CreateLimaVM) => `Failed to create VM "${opts.name}"`,
      operation: 'request-create-instance',
    },
    mutationFn: async (opts: CreateLimaVM) => {
      const validated = CreateLimaVMSchema.parse(opts);
      clearInstanceLogs(validated.name);
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
      toast.success(
        opts.startAfterCreate
          ? `VM "${opts.name}" created and running`
          : `VM "${opts.name}" created`,
      );
    },
  });
}

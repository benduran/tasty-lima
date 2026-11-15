import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import type { EditLimaVM } from '../shared/types.ts';
import {
  BootInstanceRequestResponseSchema,
  EditLimaVMSchema,
} from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import { useOpenLogsViewer } from '../stores/new-vm-store.ts';
import { createQueryKey } from './use-query-instance.ts';

export function useEditInstance() {
  /** context */
  const { socket } = useClientSocket();
  const openLogsViewer = useOpenLogsViewer();

  return useMutation({
    meta: {
      errorTitle: (opts: EditLimaVM) => `Failed to save VM "${opts.name}"`,
    },
    mutationFn: async (opts: EditLimaVM) => {
      const validated = EditLimaVMSchema.parse(opts);
      openLogsViewer(validated.name);

      return await websocketFetch({
        body: {
          data: validated,
          sender: 'client',
          type: 'request-edit-instance',
        },
        schema: BootInstanceRequestResponseSchema,
        socket,
      });
    },
    mutationKey: ['useEditInstance'] as const,
    onSuccess: ({ degraded }, { name, startAfterEdit }, _, ctx) => {
      void ctx.client.invalidateQueries({ queryKey: createQueryKey(name) });
      if (degraded) {
        toast.warning(`VM "${name}" saved, but booted in a degraded state`, {
          description:
            'It is running, but file sharing and port forwarding may not work. The logs have the details.',
        });
        return;
      }
      toast.success(
        startAfterEdit
          ? `VM "${name}" saved and running`
          : `VM "${name}" saved`,
      );
    },
  });
}

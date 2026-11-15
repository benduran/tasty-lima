import { useMutation } from '@tanstack/react-query';
import copyToClipboard from 'copy-to-clipboard';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { ResponseInstanceConnectCommandSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useCopyConnectCommand() {
  const { socket } = useClientSocket();
  return useMutation({
    meta: {
      errorTitle: (opts: { name: string }) =>
        `Failed to build the shell command for "${opts.name}"`,
    },
    mutationFn: async ({ name }: { name: string }) => {
      if (!name) {
        throw new Error('name is required when copying a connect command');
      }
      return await websocketFetch({
        body: {
          data: { name },
          sender: 'client',
          type: 'request-instance-connect-command',
        },
        schema: ResponseInstanceConnectCommandSchema,
        socket,
      });
    },
    mutationKey: ['useCopyConnectCommand'] as const,
    onSuccess: ({ command }) => {
      if (!copyToClipboard(command)) {
        toast.error('Could not copy the shell command', {
          description: command,
        });
        return;
      }
      toast.success('Shell command copied', { description: command });
    },
  });
}

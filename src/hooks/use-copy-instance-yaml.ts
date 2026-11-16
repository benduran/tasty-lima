import { useMutation } from '@tanstack/react-query';
import copyToClipboard from 'copy-to-clipboard';
import { toast } from 'sonner';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import { ResponseInstanceYamlSchema } from '../shared/types.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';

export function useCopyInstanceYaml() {
  const { socket } = useClientSocket();
  return useMutation({
    meta: {
      errorTitle: (opts: { name: string }) =>
        `Failed to copy the YAML for "${opts.name}"`,
    },
    mutationFn: async ({ name }: { name: string }) => {
      if (!name) {
        throw new Error('name is required when copying an instance yaml');
      }
      return await websocketFetch({
        body: {
          data: { name },
          sender: 'client',
          type: 'request-instance-yaml',
        },
        schema: ResponseInstanceYamlSchema,
        socket,
      });
    },
    mutationKey: ['useCopyInstanceYaml'] as const,
    onSuccess: ({ yaml }) => {
      if (!copyToClipboard(yaml)) {
        toast.error('Could not copy the YAML');
        return;
      }
      toast.success('Template YAML copied');
    },
  });
}

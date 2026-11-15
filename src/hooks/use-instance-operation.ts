import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import type {
  InstanceOperation,
  Nullish,
  WebSocketMessage,
} from '../shared/types.ts';
import { InstanceOperationSchema } from '../shared/types.ts';
import { isNullOrUndefined } from '../shared/util.ts';
import { websocketFetch } from '../shared/websocket-fetch.ts';
import { createQueryKey as createInstancesQueryKey } from './use-query-instances.ts';

export function createQueryKey() {
  return ['useQueryInstanceOperations'] as const;
}

/**
 * Latest boot/create/shutdown operation for the named VM, as the server
 * remembers it, so it survives page refreshes.
 * This helps inform the logs viewer and the instance grid state about "what"
 * the user just did to their VM.
 */
export function useInstanceOperation(name: Nullish<string>) {
  const { socket } = useClientSocket();
  return useQuery({
    queryFn: () =>
      websocketFetch({
        body: { sender: 'client', type: 'request-query-instance-operations' },
        schema: InstanceOperationSchema.array(),
        socket,
      }),
    queryKey: createQueryKey(),
    select: operations => operations.find(operation => operation.name === name),
    staleTime: Number.POSITIVE_INFINITY,
  }).data;
}

export function useSyncInstanceOperations() {
  /** store */
  const { socket } = useClientSocket();

  /** query */
  const queryClient = useQueryClient();

  /** effects */
  useEffect(() => {
    const queryKey = createQueryKey();

    const handleOperation = (
      msg: Extract<WebSocketMessage, { type: 'stream-instance-operation' }>,
    ) => {
      queryClient.setQueryData<InstanceOperation[]>(queryKey, prev => {
        const existing = prev?.find(op => op.name === msg.data.name);
        const lines =
          existing?.requestId === msg.data.requestId ? existing.lines : [];
        return [
          ...(prev ?? []).filter(op => op.name !== msg.data.name),
          { ...msg.data, lines },
        ];
      });
      if (!isNullOrUndefined(msg.data.finishedAt)) {
        void queryClient.invalidateQueries({
          queryKey: createInstancesQueryKey(),
        });
      }
    };

    const handleLogs = (
      msg: Extract<WebSocketMessage, { type: 'stream-instance-logs' }>,
    ) => {
      queryClient.setQueryData<InstanceOperation[]>(queryKey, prev =>
        prev?.map(op => {
          if (op.name !== msg.data.name || op.requestId !== msg.requestId) {
            return op;
          }
          const lastSeq = op.lines.at(-1)?.seq ?? 0;
          const fresh = msg.data.lines.filter(line => line.seq > lastSeq);
          return { ...op, lines: [...op.lines, ...fresh] };
        }),
      );
    };

    socket.on('stream-instance-operation', handleOperation);
    socket.on('stream-instance-logs', handleLogs);
    const offReconnect = socket.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey });
    });

    return () => {
      socket.off('stream-instance-operation', handleOperation);
      socket.off('stream-instance-logs', handleLogs);
      offReconnect();
    };
  }, [queryClient, socket]);
}

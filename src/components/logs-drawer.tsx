import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'wouter';
import { useInstanceOperation } from '../hooks/use-instance-operation.ts';
import { useClientSocket } from '../providers/ClientSocketProvider.tsx';
import type { WebSocketMessage } from '../shared/types.ts';
import { useInstanceLogsStore } from '../stores/instance-logs-store.ts';
import {
  LOG_VIEWER_QUERY_PARAM,
  useCloseLogsViewer,
} from '../stores/new-vm-store.ts';
import { CrtSection } from './crt.tsx';
import { LogViewer } from './instance-logs/log-viewer.tsx';
import {
  OperationStatus,
  operationHeaderLabel,
} from './instance-logs/operation-status.tsx';
import { Drawer, DrawerContent } from './ui/drawer.tsx';

export function LogsDrawer() {
  /** store */
  const { socket } = useClientSocket();
  const [logsMap, setLogsMap] = useInstanceLogsStore('logs');

  /** routing */
  const [search] = useSearchParams();
  const vmName = search.get(LOG_VIEWER_QUERY_PARAM);
  const closeLogViewer = useCloseLogsViewer();

  /** queries */
  const operation = useInstanceOperation(vmName);

  /** refs */
  const endRef = useRef<HTMLDivElement>(null);

  /** memos */
  const logs = useMemo(
    () => (vmName ? (logsMap?.[vmName] ?? []) : []),
    [logsMap, vmName],
  );

  /** effects */
  useEffect(() => {
    const handler = (
      msg: Extract<WebSocketMessage, { type: 'stream-instance-logs' }>,
    ) => {
      setLogsMap(prev => ({
        ...prev,
        [msg.data.name]: [...(prev?.[msg.data.name] ?? []), ...msg.data.lines],
      }));
    };

    socket.on('stream-instance-logs', handler);

    return () => {
      socket.off('stream-instance-logs', handler);
    };
  }, [socket, setLogsMap]);

  const status = operation?.state.status;
  useEffect(() => {
    if (logs.length === 0 && !status) return;
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [logs.length, status]);

  return (
    <Drawer
      onOpenChange={open => {
        if (!open) return closeLogViewer();
      }}
      open={Boolean(vmName)}
    >
      <DrawerContent className="md:w-[80vw]">
        <CrtSection
          className="flex min-h-0 flex-1 flex-col"
          contentClassName="min-h-0 flex-1 overflow-auto py-2"
          label={operation && operationHeaderLabel(operation)}
          title={<>Logs for {vmName}</>}
        >
          <div aria-label="Log output" aria-live="polite" role="log">
            <LogViewer lines={logs} />
            <OperationStatus name={vmName ?? ''} operation={operation} />
            <div ref={endRef} />
          </div>
        </CrtSection>
      </DrawerContent>
    </Drawer>
  );
}

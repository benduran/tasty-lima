import { useMemo } from 'react';
import { useSearchParams } from 'wouter';
import { useInstanceLogsStore } from '../stores/instance-logs-store.ts';
import {
  LOG_VIEWER_QUERY_PARAM,
  useCloseLogsViewer,
} from '../stores/new-vm-store.ts';
import { CrtCursor, CrtSection } from './crt.tsx';
import { LogViewer } from './instance-logs/log-viewer.tsx';
import { Drawer, DrawerContent } from './ui/drawer.tsx';

export function LogsDrawer() {
  /** store */
  const [logsMap] = useInstanceLogsStore('logs');

  /** routing */
  const [search] = useSearchParams();
  const vmName = search.get(LOG_VIEWER_QUERY_PARAM);
  const closeLogViewer = useCloseLogsViewer();

  /** memos */
  const logs = useMemo(
    () => (vmName ? (logsMap?.[vmName] ?? []) : []),
    [logsMap, vmName],
  );

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
          title={<>Logs for {vmName}</>}
        >
          <div aria-label="Log output" role="log">
            <LogViewer lines={logs} />
            <CrtCursor />
          </div>
        </CrtSection>
      </DrawerContent>
    </Drawer>
  );
}

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'wouter';
import { useInstanceOperation } from '../hooks/use-instance-operation.ts';
import { isNullOrUndefined } from '../shared/util.ts';
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
  /** routing */
  const [search] = useSearchParams();
  const vmName = search.get(LOG_VIEWER_QUERY_PARAM);
  const closeLogViewer = useCloseLogsViewer();

  /** queries */
  const operation = useInstanceOperation(vmName);

  /** refs */
  const endRef = useRef<HTMLDivElement>(null);

  /** effects */
  const lineCount = operation?.lines.length ?? 0;
  const finishedAt = operation?.finishedAt;
  useEffect(() => {
    if (lineCount === 0 && isNullOrUndefined(finishedAt)) return;
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lineCount, finishedAt]);

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
            <LogViewer lines={operation?.lines ?? []} />
            <OperationStatus operation={operation} />
            <div ref={endRef} />
          </div>
        </CrtSection>
      </DrawerContent>
    </Drawer>
  );
}

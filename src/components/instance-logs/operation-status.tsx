import { useNow } from '../../hooks/use-now.ts';
import type {
  InstanceOperation,
  InstanceOperationRequest,
} from '../../shared/types.ts';
import { BootInstanceRequestResponseSchema } from '../../shared/types.ts';
import { CrtCursor } from '../crt.tsx';

export const OPERATION_LABELS: Record<
  InstanceOperationRequest,
  { pending: string; verb: string }
> = {
  'request-boot-instance': { pending: 'BOOTING', verb: 'BOOT' },
  'request-create-instance': { pending: 'CREATING', verb: 'CREATE' },
  'request-edit-instance': { pending: 'SAVING', verb: 'SAVE' },
  'request-shutdown-instance': { pending: 'STOPPING', verb: 'SHUTDOWN' },
};

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return minutes ? `${minutes}m ${seconds}s` : `${totalSeconds}s`;
}

function isDegraded(operation: InstanceOperation) {
  return Boolean(
    BootInstanceRequestResponseSchema.safeParse(operation.data).data?.degraded,
  );
}

export function operationHeaderLabel(operation: InstanceOperation) {
  const labels = OPERATION_LABELS[operation.request];
  if (operation.finishedAt === undefined) return `${labels.pending}...`;
  if (operation.error !== undefined) return `${labels.verb} FAILED`;
  return isDegraded(operation)
    ? `${labels.verb} FINISHED (DEGRADED)`
    : `${labels.verb} FINISHED`;
}

export function OperationStatus({
  operation,
}: {
  operation: InstanceOperation | undefined;
}) {
  const pending = operation !== undefined && operation.finishedAt === undefined;
  const now = useNow(pending);

  if (!operation) {
    return (
      <p className="px-4 pt-2 pb-1 text-phosphor-dim">
        NO OPERATIONS YET
        <CrtCursor />
      </p>
    );
  }

  const labels = OPERATION_LABELS[operation.request];
  const elapsed = formatDuration(
    (operation.finishedAt ?? now) - operation.startedAt,
  );

  if (pending) {
    return (
      <p className="px-4 pt-2 pb-1 text-phosphor-dim">
        {labels.pending} {operation.name} · {elapsed}
        <CrtCursor />
      </p>
    );
  }

  if (operation.error !== undefined) {
    return (
      <div className="mx-4 mt-2 mb-1 bg-primary px-2 py-1 text-primary-foreground text-shadow-none">
        <p>
          ✗ {labels.verb} FAILED after {elapsed}
        </p>
        <p className="whitespace-pre-wrap wrap-anywhere">{operation.error}</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-2 mb-1 px-2 py-1 outline -outline-offset-1">
      <p>
        ✓ {labels.verb} FINISHED in {elapsed}
      </p>
      {isDegraded(operation) && (
        <p className="whitespace-pre-wrap wrap-anywhere">
          ⚠ booted in a degraded state: file sharing and port forwarding may not
          work
        </p>
      )}
    </div>
  );
}

import type { InstanceOperation } from '../../hooks/use-instance-operation.ts';
import { useNow } from '../../hooks/use-now.ts';
import { errorToString } from '../../shared/error-to-string.ts';
import type { InstanceOperationRequest } from '../../shared/types.ts';
import { BootInstanceRequestResponseSchema } from '../../shared/types.ts';
import { CrtCursor } from '../crt.tsx';

const OPERATION_LABELS: Record<
  InstanceOperationRequest,
  { pending: string; verb: string }
> = {
  'request-boot-instance': { pending: 'BOOTING', verb: 'BOOT' },
  'request-create-instance': { pending: 'CREATING', verb: 'CREATE' },
  'request-shutdown-instance': { pending: 'STOPPING', verb: 'SHUTDOWN' },
};

export function operationLabels(operation: InstanceOperation) {
  return operation.request && OPERATION_LABELS[operation.request];
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return minutes ? `${minutes}m ${seconds}s` : `${totalSeconds}s`;
}

function isDegraded(operation: InstanceOperation) {
  return Boolean(
    BootInstanceRequestResponseSchema.safeParse(operation.state.data).data
      ?.degraded,
  );
}

export function operationHeaderLabel(operation: InstanceOperation) {
  const labels = operationLabels(operation);
  if (!labels) return undefined;
  switch (operation.state.status) {
    case 'pending':
      return `${labels.pending}...`;
    case 'success':
      return isDegraded(operation)
        ? `${labels.verb} FINISHED (DEGRADED)`
        : `${labels.verb} FINISHED`;
    case 'error':
      return `${labels.verb} FAILED`;
    default:
      return undefined;
  }
}

export function OperationStatus({
  name,
  operation,
}: {
  name: string;
  operation: InstanceOperation | undefined;
}) {
  const pending = operation?.state.status === 'pending';
  const now = useNow(pending);
  const labels = operation && operationLabels(operation);

  if (!operation || !labels) {
    return (
      <p className="px-4 pt-2 pb-1 text-phosphor-dim">
        NO OPERATIONS YET
        <CrtCursor />
      </p>
    );
  }

  if (pending) {
    return (
      <p className="px-4 pt-2 pb-1 text-phosphor-dim">
        {labels.pending} {name} ·{' '}
        {formatDuration(now - operation.state.submittedAt)}
        <CrtCursor />
      </p>
    );
  }

  if (operation.state.status === 'error') {
    return (
      <div className="mx-4 mt-2 mb-1 bg-primary px-2 py-1 text-primary-foreground text-shadow-none">
        <p>✗ {labels.verb} FAILED</p>
        <p className="whitespace-pre-wrap wrap-anywhere">
          {errorToString(operation.state.error)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-2 mb-1 px-2 py-1 outline -outline-offset-1">
      <p>✓ {labels.verb} FINISHED</p>
      {isDegraded(operation) && (
        <p className="whitespace-pre-wrap wrap-anywhere">
          ⚠ booted in a degraded state: file sharing and port forwarding may not
          work
        </p>
      )}
    </div>
  );
}

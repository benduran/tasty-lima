import { errorToString } from '../shared/error-to-string.ts';
import type {
  InstanceOperation,
  InstanceOperationRequest,
} from '../shared/types.ts';
import { isNullOrUndefined } from '../shared/util.ts';
import type { OnLogLines } from './limactl/limaExec.ts';
import { broadcast } from './routes/websocket-clients.ts';

const MAX_LINES = 5000;

const operations = new Map<string, InstanceOperation>();

export function listInstanceOperations() {
  return [...operations.values()];
}

function broadcastOperation({ lines: _, ...operation }: InstanceOperation) {
  broadcast({
    data: operation,
    requestId: operation.requestId,
    sender: 'server',
    type: 'stream-instance-operation',
  });
}

type RunInstanceOperationOpts<T> = {
  exec: (onLines: OnLogLines) => Promise<T>;
  name: string;
  request: InstanceOperationRequest;
  requestId: string;
};

function isStopLikeRequest(request: InstanceOperationRequest) {
  return (
    request === 'request-shutdown-instance' ||
    request === 'request-delete-instance'
  );
}

export async function runInstanceOperation<T>({
  exec,
  name,
  request,
  requestId,
}: RunInstanceOperationOpts<T>): Promise<T> {
  const current = operations.get(name);
  if (
    current &&
    isNullOrUndefined(current.finishedAt) &&
    !(isStopLikeRequest(request) && isStopLikeRequest(current.request))
  ) {
    throw new Error(`${name} is busy: ${current.request} has not finished`);
  }

  const operation: InstanceOperation = {
    lines: [],
    name,
    request,
    requestId,
    startedAt: Date.now(),
  };
  operations.set(name, operation);
  broadcastOperation(operation);
  const isCurrent = () => operations.get(name) === operation;
  let seq = 0;

  try {
    const data = await exec(unsequenced => {
      const lines = unsequenced.map(line => {
        seq += 1;
        return { ...line, seq };
      });
      operation.lines.push(...lines);
      operation.lines.splice(
        0,
        Math.max(0, operation.lines.length - MAX_LINES),
      );
      if (!isCurrent()) return;
      broadcast({
        data: { lines, name },
        requestId,
        sender: 'server',
        type: 'stream-instance-logs',
      });
    });
    operation.data = data;
    return data;
  } catch (error) {
    operation.error = errorToString(error);
    throw error;
  } finally {
    operation.finishedAt = Date.now();
    if (isCurrent()) broadcastOperation(operation);
  }
}

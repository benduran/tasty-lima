import { useQueryMachineInfo } from '../hooks/use-query-machine-info.ts';
import { CrtCells } from './crt.tsx';
import { Alert, AlertDescription, AlertTitle } from './ui/alert.tsx';
import { Skeleton } from './ui/skeleton.tsx';

export function MachineAllocation() {
  /** queries */
  const { error, data: info, isPending: loading } = useQueryMachineInfo();

  if (!loading && error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>An error occured</AlertTitle>
        <AlertDescription>{String(error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-primary-foreground">
      {!info &&
        Array(4)
          .fill(null)
          .map((_, i) => (
            <Skeleton className="h-8" key={`machine-info-skeleton-${i}`} />
          ))}
      {info && (
        <>
          <p className="tracking-wide uppercase text-phosphor-dim mb-1">
            Allocated to runing vms
          </p>

          <span className="text-phosphor-dim">CPU</span>
          <CrtCells on={0} total={info.cpus} />
          <span>0/{info.cpus}</span>
          <span className="text-phosphor-dim">MEM</span>
          <CrtCells on={0} total={info.ram} />
          <span>0/{info.ram} GiB</span>
        </>
      )}
    </div>
  );
}

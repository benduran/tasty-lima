import { cn } from '../lib/index.ts';
import type {
  MachineInfo as MachineInfoType,
  Nullish,
} from '../shared/types.ts';
import { Disc } from './disc.tsx';
import { Skeleton } from './ui/skeleton.tsx';

type MachineInfoProps = {
  info: Nullish<MachineInfoType>;
  loading?: Nullish<boolean>;
  orientation?: 'horizontal' | 'vertical';
};

export function MachineInfo({
  info,
  loading = false,
  orientation = 'horizontal',
}: MachineInfoProps) {
  if (loading) {
    return <Skeleton className="h-4" />;
  }
  if (!info) return null;

  return (
    <span
      className={cn(
        'inline-flex gap-1 text-phosphor-dim',
        orientation === 'vertical' && 'flex-col',
      )}
    >
      <span>
        {info.platform}/{info.arch}
      </span>{' '}
      {orientation === 'horizontal' && <Disc />}
      <span>{info.cpus} CPUs</span>
      {orientation === 'horizontal' && <Disc />}
      <span>{info.ram}GB RAM</span>
    </span>
  );
}

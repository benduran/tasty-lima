import { cn } from '../../lib/index.ts';
import type { LimaInstance } from '../../shared/limactl-types.gen.ts';
import type { Nullish } from '../../shared/types.ts';
import { arrayHasItems } from '../../shared/util.ts';
import { Skeleton } from '../ui/skeleton.tsx';
import { COLS_COUNT } from './constants.ts';
import { EmptyGrid } from './empty-grid.tsx';

const TABLE_COLS =
  'grid-cols-[20px_minmax(150px,1.5fr)_100px_120px_56px_90px_48px_72px_80px_minmax(170px,1.2fr)]';

type InstancesGridProps = {
  instances: Nullish<LimaInstance[]>;
  loading: boolean;
};

export function InstancesGrid({ instances, loading }: InstancesGridProps) {
  return (
    <div className="min-w-250">
      <div
        aria-hidden="true"
        className={cn(
          'grid gap-2 border-b border-phosphor-line px-3 py-2 tracking-[0.06em] text-phosphor-dim',
          TABLE_COLS,
        )}
      >
        <span />
        <span>NAME</span>
        <span>STATUS</span>
        <span>OS</span>
        <span>ARCH</span>
        <span>CPU</span>
        <span>MEM</span>
        <span>DISK</span>
        {loading && (
          <>
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <Skeleton
                  className="h-8"
                  key={`skeleton-${i}`}
                  style={{ gridColumn: `1 / ${COLS_COUNT + 1}` }}
                />
              ))}
          </>
        )}
        {!loading && !arrayHasItems(instances) && <EmptyGrid />}
        {arrayHasItems(instances) &&
          instances?.map(vm => (
            <button
              // aria-pressed={vm.selected}
              className={cn(
                'grid w-full min-h-12 items-center gap-x-3 border-b border-phosphor-line px-3 text-left hover:bg-phosphor-faint',
                TABLE_COLS,
                // vm.selected &&
                //   'bg-phosphor-faint text-shadow-(--glow) outline-1 -outline-offset-1 outline-primary',
              )}
              key={vm.name}
              type="button"
            >
              <span className="text-[23px]">{vm.name}</span>
              <span>{vm.status}</span>
              <span>{vm.config?.os}</span>
              <span>{vm.arch}</span>
              <span>{vm.cpus}</span>
              <span>{vm.config?.memory}</span>
              <span>{vm.disk}</span>
            </button>
          ))}
      </div>
    </div>
  );
}

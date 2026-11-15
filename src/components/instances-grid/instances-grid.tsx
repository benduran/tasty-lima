import type { LimaInstance, Nullish } from '../../shared/types.ts';
import { arrayHasItems } from '../../shared/util.ts';
import { Skeleton } from '../ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.tsx';
import { COLS_COUNT } from './constants.ts';
import { EmptyGrid } from './empty-grid.tsx';
import { InstanceRow } from './instance-row.tsx';

type InstancesGridProps = {
  instances: Nullish<LimaInstance[]>;
  loading: boolean;
};

export function InstancesGrid({ instances, loading }: InstancesGridProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">NAME</TableHead>
          <TableHead className="w-25">STATUS</TableHead>
          <TableHead>OS</TableHead>
          <TableHead>ARCH</TableHead>
          <TableHead>CPU</TableHead>
          <TableHead>MEM</TableHead>
          <TableHead>DISK</TableHead>
          <TableHead className="max-w-25" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 5 }, (_, i) => (
            <TableRow className="hover:bg-transparent" key={`skeleton-${i}`}>
              <TableCell className="px-3 py-2" colSpan={COLS_COUNT}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ))}
        {!loading && !arrayHasItems(instances) && <EmptyGrid />}
        {arrayHasItems(instances) &&
          instances?.map(vm => <InstanceRow key={vm.name} vm={vm} />)}
      </TableBody>
    </Table>
  );
}

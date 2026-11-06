import type { LimaInstance, Nullish } from '../../shared/types.ts';
import { arrayHasItems, bytesToGb } from '../../shared/util.ts';
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
          instances?.map(vm => (
            <TableRow key={vm.name}>
              <TableCell className="text-[23px]">{vm.name}</TableCell>
              <TableCell>{vm.status}</TableCell>
              <TableCell>{vm.config?.os}</TableCell>
              <TableCell>{vm.arch}</TableCell>
              <TableCell>{vm.cpus}</TableCell>
              <TableCell>{bytesToGb(vm.memory)}GiB</TableCell>
              <TableCell>{bytesToGb(vm.disk)}GiB</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

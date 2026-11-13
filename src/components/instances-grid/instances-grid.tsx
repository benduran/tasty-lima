import { PlayIcon, SquareStopIcon, TrashIcon } from 'lucide-react';
import { useDeleteInstance } from '../../hooks/use-delete-instance.ts';
import type { LimaInstance, Nullish } from '../../shared/types.ts';
import { arrayHasItems, bytesToGb } from '../../shared/util.ts';
import { Button } from '../ui/button.tsx';
import { ConfirmButton } from '../ui/confirm-button.tsx';
import { Skeleton } from '../ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip.tsx';
import { COLS_COUNT } from './constants.ts';
import { EmptyGrid } from './empty-grid.tsx';

type InstancesGridProps = {
  instances: Nullish<LimaInstance[]>;
  loading: boolean;
};

export function InstancesGrid({ instances, loading }: InstancesGridProps) {
  /** mutations */
  const {
    mutate: execDelete,
    isPending: isDeleting,
    variables: deletionVariables,
  } = useDeleteInstance();

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
          instances?.map(vm => {
            const deleteTooltip = `Delete ${vm.name}`;
            const startTooltip = `Boot ${vm.name}`;
            const stopTooltip = `Shutdown ${vm.name}`;

            return (
              <TableRow key={vm.name}>
                <TableCell className="text-[23px]">{vm.name}</TableCell>
                <TableCell>{vm.status}</TableCell>
                <TableCell>{vm.config?.os}</TableCell>
                <TableCell>{vm.arch}</TableCell>
                <TableCell>{vm.cpus}</TableCell>
                <TableCell>{bytesToGb(vm.memory)}GiB</TableCell>
                <TableCell>{bytesToGb(vm.disk)}GiB</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {vm.status === 'Stopped' && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              aria-label={startTooltip}
                              size="sm"
                              variant="outline"
                            >
                              <PlayIcon />
                            </Button>
                          }
                        />
                        <TooltipContent>{startTooltip}</TooltipContent>
                      </Tooltip>
                    )}
                    {vm.status === 'Running' && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              aria-label={stopTooltip}
                              size="sm"
                              variant="outline"
                            >
                              <SquareStopIcon />
                            </Button>
                          }
                        />
                        <TooltipContent>{stopTooltip}</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <ConfirmButton
                            aria-label={deleteTooltip}
                            confirmMessage={
                              <>Are you sure you want to delete {vm.name}?</>
                            }
                            loading={
                              isDeleting && deletionVariables.name === vm.name
                            }
                            onConfirm={() => execDelete({ name: vm.name })}
                            size="sm"
                            variant="outline"
                          >
                            <TrashIcon />
                          </ConfirmButton>
                        }
                      />
                      <TooltipContent>{deleteTooltip}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}

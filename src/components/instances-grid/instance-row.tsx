import {
  PlayIcon,
  ScrollTextIcon,
  SquareStopIcon,
  TrashIcon,
} from 'lucide-react';
import { useBootInstance } from '../../hooks/use-boot-instance.ts';
import { useDeleteInstance } from '../../hooks/use-delete-instance.ts';
import { useInstanceOperation } from '../../hooks/use-instance-operation.ts';
import { useShutdownInstance } from '../../hooks/use-shutdown-instance.ts';
import type { LimaInstance } from '../../shared/types.ts';
import { bytesToGb } from '../../shared/util.ts';
import { useOpenLogsViewer } from '../../stores/new-vm-store.ts';
import { operationLabels } from '../instance-logs/operation-status.tsx';
import { Button } from '../ui/button.tsx';
import { ConfirmButton } from '../ui/confirm-button.tsx';
import { TableCell, TableRow } from '../ui/table.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip.tsx';

export function InstanceRow({ vm }: { vm: LimaInstance }) {
  /** mutations */
  const { mutate: execDelete, isPending: isDeleting } = useDeleteInstance();
  const { mutate: execBoot } = useBootInstance();
  const { mutate: execShutdown } = useShutdownInstance();

  /** queries */
  const operation = useInstanceOperation(vm.name);

  /** routing */
  const openLogsViewer = useOpenLogsViewer();

  const pending =
    operation?.state.status === 'pending' && operationLabels(operation);
  const deleteTooltip = `Delete ${vm.name}`;
  const logsTooltip = `Logs for ${vm.name}`;
  const startTooltip = `Boot ${vm.name}`;
  const stopTooltip = `Shutdown ${vm.name}`;

  return (
    <TableRow>
      <TableCell className="text-[23px]">{vm.name}</TableCell>
      <TableCell>{pending ? `${pending.pending}...` : vm.status}</TableCell>
      <TableCell>{vm.config?.os}</TableCell>
      <TableCell>{vm.arch}</TableCell>
      <TableCell>{vm.cpus}</TableCell>
      <TableCell>{bytesToGb(vm.memory)}GiB</TableCell>
      <TableCell>{bytesToGb(vm.disk)}GiB</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {pending && (
            <Button
              aria-label={`${pending.pending} ${vm.name}`}
              loading
              size="sm"
              variant="outline"
            >
              <PlayIcon />
            </Button>
          )}
          {!pending && vm.status === 'Stopped' && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={startTooltip}
                    onClick={() => execBoot({ name: vm.name })}
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
          {!pending && vm.status === 'Running' && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={stopTooltip}
                    onClick={() => execShutdown({ name: vm.name })}
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
          {operation && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={logsTooltip}
                    onClick={() => openLogsViewer(vm.name)}
                    size="sm"
                    variant="outline"
                  >
                    <ScrollTextIcon />
                  </Button>
                }
              />
              <TooltipContent>{logsTooltip}</TooltipContent>
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
                  disabled={Boolean(pending)}
                  loading={isDeleting}
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
}

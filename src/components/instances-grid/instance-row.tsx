import {
  CheckIcon,
  CopyIcon,
  EllipsisIcon,
  PencilIcon,
  PlayIcon,
  ScrollTextIcon,
  SquareStopIcon,
  TerminalIcon,
  TrashIcon,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useBootInstance } from '../../hooks/use-boot-instance.ts';
import { useCopiedFlag } from '../../hooks/use-copied-flag.ts';
import { useCopyConnectCommand } from '../../hooks/use-copy-connect-command.ts';
import { useCopyInstanceYaml } from '../../hooks/use-copy-instance-yaml.ts';
import { useDeleteInstance } from '../../hooks/use-delete-instance.ts';
import { useInstanceOperation } from '../../hooks/use-instance-operation.ts';
import { useShutdownInstance } from '../../hooks/use-shutdown-instance.ts';
import { uiRoutes } from '../../routes/ui.ts';
import type { LimaInstance } from '../../shared/types.ts';
import { bytesToGb, isNullOrUndefined } from '../../shared/util.ts';
import { useOpenLogsViewer } from '../../stores/new-vm-store.ts';
import { OPERATION_LABELS } from '../instance-logs/operation-status.tsx';
import { Button } from '../ui/button.tsx';
import { ConfirmButton } from '../ui/confirm-button.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { TableCell, TableRow } from '../ui/table.tsx';

export function InstanceRow({ vm }: { vm: LimaInstance }) {
  /** mutations */
  const { mutate: execDelete, isPending: isDeleting } = useDeleteInstance();
  const { mutate: execBoot } = useBootInstance();
  const { mutate: execShutdown } = useShutdownInstance();
  const { isPending: isBuildingCommand, mutateAsync: copyConnectCommand } =
    useCopyConnectCommand();
  const { mutateAsync: copyInstanceYaml } = useCopyInstanceYaml();

  /** queries */
  const operation = useInstanceOperation(vm.name);

  /** routing */
  const openLogsViewer = useOpenLogsViewer();
  const [, setLocation] = useLocation();

  /** state */
  const [copied, setCopied] = useCopiedFlag();
  const [yamlCopied, setYamlCopied] = useCopiedFlag();

  const pending =
    operation && isNullOrUndefined(operation.finishedAt)
      ? OPERATION_LABELS[operation.request]
      : undefined;
  const stopping =
    !isNullOrUndefined(pending) &&
    operation?.request === 'request-shutdown-instance';
  const moreTooltip = `More actions for ${vm.name}`;

  const actionButtonClass = 'w-full justify-start';

  return (
    <TableRow>
      <TableCell>{vm.name}</TableCell>
      <TableCell>{pending ? `${pending.pending}...` : vm.status}</TableCell>
      <TableCell>{vm.config?.os}</TableCell>
      <TableCell>{vm.arch}</TableCell>
      <TableCell>{vm.cpus}</TableCell>
      <TableCell>{bytesToGb(vm.memory)}GiB</TableCell>
      <TableCell>{bytesToGb(vm.disk)}GiB</TableCell>
      <TableCell>
        {pending ? (
          <Button
            aria-label={`${pending.pending} ${vm.name}`}
            loading
            size="sm"
            variant="outline"
          >
            <PlayIcon />
          </Button>
        ) : (
          <Popover>
            <PopoverTrigger
              render={
                <Button aria-label={moreTooltip} size="sm" variant="outline">
                  <EllipsisIcon />
                </Button>
              }
            />
            <PopoverContent align="end" className="w-52">
              <div className="flex flex-col gap-1">
                {vm.status === 'Stopped' && (
                  <Button
                    className={actionButtonClass}
                    onClick={() => execBoot({ name: vm.name })}
                    size="sm"
                    variant="outline"
                  >
                    <PlayIcon />
                    Boot
                  </Button>
                )}
                {!stopping && vm.status === 'Running' && (
                  <ConfirmButton
                    className={actionButtonClass}
                    confirmMessage={
                      <>Are you sure you want to shutdown {vm.name}?</>
                    }
                    onConfirm={() => execShutdown({ name: vm.name })}
                    size="sm"
                    variant="outline"
                  >
                    <SquareStopIcon />
                    Shutdown
                  </ConfirmButton>
                )}
                <Button
                  className={actionButtonClass}
                  onClick={() => setLocation(uiRoutes.editVm(vm.name))}
                  size="sm"
                  variant="outline"
                >
                  <PencilIcon />
                  Edit
                </Button>
                {operation && (
                  <Button
                    className={actionButtonClass}
                    onClick={() => openLogsViewer(vm.name)}
                    size="sm"
                    variant="outline"
                  >
                    <ScrollTextIcon />
                    Logs
                  </Button>
                )}
                <Button
                  className={actionButtonClass}
                  data-copied={copied || undefined}
                  loading={isBuildingCommand}
                  onClick={() => {
                    copyConnectCommand({ name: vm.name })
                      .then(() => setCopied(true))
                      .catch(() => {
                        /* failure toasts are handled globally */
                      });
                  }}
                  size="sm"
                  variant="outline"
                >
                  {copied ? <CheckIcon /> : <TerminalIcon />}
                  {copied ? 'Copied' : 'Copy shell command'}
                </Button>
                <Button
                  className={actionButtonClass}
                  data-copied={yamlCopied || undefined}
                  onClick={() => {
                    copyInstanceYaml({ name: vm.name })
                      .then(() => setYamlCopied(true))
                      .catch(() => {
                        /* failure toasts are handled globally */
                      });
                  }}
                  size="sm"
                  variant="outline"
                >
                  {yamlCopied ? <CheckIcon /> : <CopyIcon />}
                  {yamlCopied ? 'Copied' : 'Copy Template YAML'}
                </Button>
                <ConfirmButton
                  className={actionButtonClass}
                  confirmMessage={
                    <>Are you sure you want to delete {vm.name}?</>
                  }
                  loading={isDeleting}
                  onConfirm={() => execDelete({ name: vm.name })}
                  size="sm"
                  variant="outline"
                >
                  <TrashIcon />
                  Delete
                </ConfirmButton>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </TableCell>
    </TableRow>
  );
}

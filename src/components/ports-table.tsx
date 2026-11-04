import { cn } from '../lib/utils.ts';
import type { PortForwardInput } from '../shared/types.ts';
import { LimaProtoSchema, PortNumberSchema } from '../shared/types.ts';
import { omit, withValidatedField } from '../shared/util.ts';
import { CheckboxRow } from './checkbox-row.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { NativeSelect, NativeSelectOption } from './ui/native-select.tsx';

type PortsTableProps = {
  onAddPortForward: () => void;
  onChangePortForward: (index: number, portForward: PortForwardInput) => void;
  onRemovePortForward: (index: number) => void;
  portForwards: PortForwardInput[];
};

const COLUMNS =
  'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_92px_44px]' as const;

export function PortsTable({
  onAddPortForward,
  onChangePortForward,
  onRemovePortForward,
  portForwards,
}: PortsTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-hidden="true"
        className={cn(
          'grid gap-2 tracking-[0.08em] text-phosphor-dim',
          COLUMNS,
        )}
      >
        <span>HOST PORT</span>
        <span>GUEST PORT</span>
        <span>PROTO</span>
        <span>IGNORE</span>
        <span />
      </div>
      {portForwards.map((portForward, i) => (
        <div
          className={cn('grid items-center gap-2', COLUMNS)}
          key={`port-${i}`}
        >
          <Input
            aria-label={`Host port ${i + 1}`}
            onChange={e =>
              onChangePortForward(
                i,
                withValidatedField(
                  portForward,
                  'hostPort',
                  e.currentTarget.value,
                  PortNumberSchema,
                ),
              )
            }
            placeholder="auto"
            spellCheck={false}
            value={portForward.hostPort?.toString() ?? ''}
          />
          <Input
            aria-label={`Guest port ${i + 1}`}
            onChange={e =>
              onChangePortForward(
                i,
                withValidatedField(
                  portForward,
                  'guestPort',
                  e.currentTarget.value,
                  PortNumberSchema,
                ),
              )
            }
            placeholder="same as host"
            spellCheck={false}
            value={portForward.guestPort?.toString() ?? ''}
          />
          <NativeSelect
            aria-label={`Protocol ${i + 1}`}
            className="w-full"
            onChange={e => {
              const validated = LimaProtoSchema.safeParse(
                e.currentTarget.value,
              );
              if (!validated.success) return;

              onChangePortForward(i, { ...portForward, proto: validated.data });
            }}
            value={portForward.proto ?? 'tcp'}
          >
            {LimaProtoSchema.options.map(proto => (
              <NativeSelectOption key={proto} value={proto}>
                {proto}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <CheckboxRow
            checked={portForward.ignore}
            className="gap-2"
            label="IGNORE"
            onCheckedChange={checked =>
              onChangePortForward(
                i,
                checked
                  ? { ...portForward, guestIP: '0.0.0.0', ignore: true }
                  : omit(portForward, ['guestIP', 'ignore']),
              )
            }
          />
          <Button
            aria-label={`Remove port forward ${i + 1}`}
            className="w-11 px-0"
            onClick={() => onRemovePortForward(i)}
            type="button"
            variant="outline"
          >
            X
          </Button>
        </div>
      ))}
      <div>
        <Button
          onClick={() => onAddPortForward()}
          type="button"
          variant="outline"
        >
          + Add port
        </Button>
      </div>
    </div>
  );
}

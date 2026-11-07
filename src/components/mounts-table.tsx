import type { LimaMount } from '../shared/types.ts';
import { CheckboxRow } from './checkbox-row.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';

type MountsTableProps = {
  onAddMount: () => void;
  onChangeMount: (index: number, mount: LimaMount) => void;
  onRemoveMount: (index: number) => void;
  mounts: LimaMount[];
};

export function MountsTable({
  onAddMount,
  onChangeMount,
  onRemoveMount,
  mounts,
}: MountsTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-hidden="true"
        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_76px_44px] gap-2 tracking-[0.08em] text-phosphor-dim"
      >
        <span>HOST PATH</span>
        <span>GUEST PATH</span>
        <span>ACCESS</span>
        <span />
      </div>
      {mounts.map((mount, i) => (
        <div
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_76px_44px] items-center gap-2"
          key={`mount-${i}`}
        >
          <Input
            aria-label={`Host path ${mount.location}`}
            onChange={e =>
              onChangeMount(i, { ...mount, location: e.currentTarget.value })
            }
            spellCheck={false}
            value={mount.location ?? ''}
          />
          <Input
            aria-label={`Guest path ${mount.mountPoint}`}
            onChange={e =>
              onChangeMount(i, { ...mount, mountPoint: e.currentTarget.value })
            }
            placeholder="same as host"
            spellCheck={false}
            value={mount.mountPoint ?? ''}
          />
          <CheckboxRow
            checked={mount.writable}
            className="gap-2"
            label="RW"
            onCheckedChange={checked =>
              onChangeMount(i, { ...mount, writable: checked })
            }
          />
          <Button
            aria-label={`Remove mount ${mount.location}`}
            className="w-11 px-0"
            onClick={() => onRemoveMount(i)}
            type="button"
            variant="outline"
          >
            X
          </Button>
        </div>
      ))}
      <div>
        <Button onClick={() => onAddMount()} type="button" variant="outline">
          + Add mount
        </Button>
      </div>
    </div>
  );
}

import { CheckboxRow } from './checkbox-row.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';

export type MountRow = {
  guest?: string | undefined;
  host: string;
  writable?: boolean | undefined;
};

export function MountsTable({ mounts }: { mounts: readonly MountRow[] }) {
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
      {mounts.map(mount => (
        <div
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_76px_44px] items-center gap-2"
          key={mount.host}
        >
          <Input
            aria-label={`Host path ${mount.host}`}
            defaultValue={mount.host}
            spellCheck={false}
          />
          <Input
            aria-label={`Guest path ${mount.guest ?? ''}`}
            defaultValue={mount.guest}
            placeholder="same as host"
            spellCheck={false}
          />
          <CheckboxRow
            className="gap-2"
            defaultChecked={mount.writable}
            label="RW"
          />
          <Button
            aria-label={`Remove mount ${mount.host}`}
            className="w-11 px-0"
            type="button"
            variant="outline"
          >
            X
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline">
          + Add mount
        </Button>
      </div>
    </div>
  );
}

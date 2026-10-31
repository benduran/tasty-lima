import { Button } from '../ui/button.tsx';

export type ConnectCommand = {
  cmd: string;
  label: string;
  primary?: boolean;
};

export function ConnectCommands({
  entries,
}: {
  entries: readonly ConnectCommand[];
}) {
  return (
    <>
      {entries.map(entry => (
        <div
          className="grid grid-cols-[minmax(150px,220px)_minmax(0,1fr)_auto] items-center gap-x-4"
          key={entry.label}
        >
          <span className="tracking-[0.08em] text-phosphor-dim">
            {entry.label}
          </span>
          <code className="flex min-h-11 items-center overflow-x-auto border border-dashed border-phosphor-dim px-3 text-[22px] whitespace-nowrap">
            $ {entry.cmd}
          </code>
          <Button
            aria-label={`Copy ${entry.label} command`}
            type="button"
            variant={entry.primary ? 'default' : 'outline'}
          >
            Copy
          </Button>
        </div>
      ))}
    </>
  );
}

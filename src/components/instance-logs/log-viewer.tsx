import { cn } from '../../lib/utils.ts';
import type { LogLevel, LogLine } from '../../shared/types.ts';

const LEVEL_LABELS: Record<LogLevel, string> = {
  error: 'ERROR',
  info: 'INFO',
  warn: 'WARN',
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  error:
    'justify-self-start bg-primary px-1 text-primary-foreground text-shadow-none',
  info: 'text-phosphor-dim',
  warn: 'justify-self-start px-1 outline outline-1 -outline-offset-1',
};

export function LogViewer({ lines }: { lines: readonly LogLine[] }) {
  return (
    <>
      {lines.map(line => (
        <div
          className="grid grid-cols-[150px_72px_minmax(0,1fr)] gap-x-4 px-4 py-px hover:bg-phosphor-faint"
          key={`${line.t} ${line.msg}`}
        >
          <span className="whitespace-nowrap text-phosphor-dim">{line.t}</span>
          <span className={cn(LEVEL_STYLES[line.level])}>
            {LEVEL_LABELS[line.level]}
          </span>
          <span className="whitespace-pre-wrap wrap-anywhere">{line.msg}</span>
        </div>
      ))}
    </>
  );
}

import type { PropsWithChildren } from 'react';
import { cn } from '../lib/utils.ts';
import { Button } from './ui/button.tsx';

export function CommandBlock({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <pre
      className={cn(
        'overflow-x-auto border border-dashed border-phosphor-dim px-3 py-2.5 whitespace-pre',
        className,
      )}
    >
      {children}
    </pre>
  );
}

export function CopyCommandRow({
  buttonVariant = 'outline',
  children,
  className,
  codeClassName,
  copyLabel,
}: PropsWithChildren<{
  buttonVariant?: 'default' | 'outline';
  className?: string;
  codeClassName?: string;
  copyLabel: string;
}>) {
  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <code
        className={cn(
          'flex min-w-0 flex-1 items-center overflow-x-auto border border-dashed border-phosphor-dim px-3 text-[22px] whitespace-nowrap',
          codeClassName,
        )}
      >
        {children}
      </code>
      <Button aria-label={copyLabel} type="button" variant={buttonVariant}>
        Copy
      </Button>
    </div>
  );
}

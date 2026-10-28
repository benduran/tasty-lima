import type * as React from 'react';
import { cn } from '../../lib/utils.ts';

/*
  CRT panel (spec: bordered section + inverse-video h2 bar).
  CardHeader renders as the phosphor title bar; CardTitle sits in it,
  CardAction in the bar's right slot, CardDescription just under it.
*/
function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      className={cn(
        'group/card flex flex-col border border-border bg-card text-card-foreground data-[size=sm]:[*&_[data-slot=card-content]]:p-3',
        className,
      )}
      data-size={size}
      data-slot="card"
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'group/card-header @container/card-header flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-0 bg-primary px-3 py-0.5 text-primary-foreground text-shadow-none has-data-[slot=card-action]:grid has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'font-heading text-lg leading-none font-normal tracking-[0.08em] uppercase',
        className,
      )}
      data-slot="card-title"
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('w-full px-3 py-1 text-sm text-phosphor-dim', className)}
      data-slot="card-description"
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-center justify-self-end',
        className,
      )}
      data-slot="card-action"
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex-1 p-4', className)}
      data-slot="card-content"
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-phosphor-line px-4 py-3',
        className,
      )}
      data-slot="card-footer"
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

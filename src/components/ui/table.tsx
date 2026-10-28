import type * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      className="relative w-full overflow-x-auto border border-border"
      data-slot="table-container"
    >
      <table
        className={cn('w-full caption-bottom text-base', className)}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('[&_tr]:border-b [&_tr]:border-b-primary/50', className)}
      data-slot="table-header"
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0', className)}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      className={cn(
        'border-t border-phosphor-line bg-phosphor-faint font-normal [&>tr]:last:border-b-0',
        className,
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-phosphor-line transition-colors hover:bg-phosphor-faint has-aria-expanded:bg-phosphor-faint data-[state=selected]:bg-phosphor-faint data-[state=selected]:outline data-[state=selected]:outline-1 data-[state=selected]:-outline-offset-1 data-[state=selected]:outline-primary',
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'h-10 px-3 text-left align-middle font-normal tracking-[0.06em] whitespace-nowrap bg-primary text-primary-foreground text-shadow-none uppercase [&:has([role=checkbox])]:pr-0',
        className,
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn('p-2 px-3 align-middle whitespace-nowrap', className)}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      className={cn('mt-3 text-sm text-phosphor-dim', className)}
      data-slot="table-caption"
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};

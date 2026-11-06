import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils.ts';

const ALIGN = {
  center: 'text-center',
  left: 'text-left',
  right: 'text-right',
} as const;

type TableAlign = keyof typeof ALIGN;

function Table({
  className,
  minWidth,
  style,
  ...props
}: ComponentProps<'table'> & {
  minWidth?: number | string;
}) {
  return (
    <div
      className="relative w-full overflow-x-auto"
      data-slot="table-container"
    >
      <table
        className={cn('w-full caption-bottom text-base table-fixed', className)}
        data-slot="table"
        {...props}
        style={minWidth === undefined ? style : { ...style, minWidth }}
      />
    </div>
  );
}

function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption
      className={cn(
        'caption-top flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none',
        className,
      )}
      data-slot="table-caption"
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return (
    <thead
      className={cn(
        'border-b border-phosphor-line [&_tr]:border-b-0 [&_tr:hover]:bg-transparent',
        className,
      )}
      data-slot="table-header"
      {...props}
    />
  );
}

function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0', className)}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      className={cn(
        'border-t border-phosphor-line bg-phosphor-faint [&>tr]:last:border-b-0',
        className,
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({
  className,
  selected,
  ...props
}: ComponentProps<'tr'> & {
  selected?: boolean;
}) {
  return (
    <tr
      className={cn(
        'border-b border-phosphor-line transition-colors hover:bg-phosphor-faint data-[state=selected]:bg-phosphor-faint data-[state=selected]:outline data-[state=selected]:outline-1 data-[state=selected]:-outline-offset-1 data-[state=selected]:outline-primary',
        className,
      )}
      data-slot="table-row"
      data-state={selected ? 'selected' : undefined}
      {...props}
    />
  );
}

function TableHead({
  align = 'left',
  className,
  ...props
}: ComponentProps<'th'> & { align?: TableAlign }) {
  return (
    <th
      className={cn(
        'px-1.5 py-2 text-left font-normal tracking-[0.06em] whitespace-nowrap uppercase text-phosphor-dim first:pl-3 last:pr-3 [&:has([role=checkbox])]:pr-0',
        ALIGN[align],
        className,
      )}
      data-slot="table-head"
      scope="col"
      {...props}
    />
  );
}

function TableCell({
  align = 'left',
  className,
  ...props
}: ComponentProps<'td'> & { align?: TableAlign }) {
  return (
    <td
      className={cn(
        'px-1.5 py-3 text-left align-middle whitespace-nowrap first:pl-3 last:pr-3 [&:has([role=checkbox])]:pr-0',
        ALIGN[align],
        className,
      )}
      data-slot="table-cell"
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

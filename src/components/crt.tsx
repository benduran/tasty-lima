import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { cn } from '../lib/utils.ts';

const CELL = 'inline-block h-[18px] w-[10px] flex-none' as const;

/** One resource meter cell (spec `.cell-*`). */
export function CrtCell({
  className,
  state,
}: {
  className?: string | undefined;
  state: 'new' | 'off' | 'on';
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        CELL,
        state === 'on' && 'bg-primary shadow-(--glow)',
        state === 'new' &&
          'border border-primary shadow-[inset_0_0_0_2px_var(--bg),inset_0_0_0_10px_var(--p-line)]',
        state === 'off' && 'border border-phosphor-line',
        className,
      )}
    />
  );
}

/**
 * Resource cell meter (spec `.cell-*`). `on` cells are lit, cells between
 * `was` and `on` are the "added" outline cells, the rest are hollow.
 * Pass `cellClassName` to flex the cells into a fixed-width bar.
 */
function cellState(i: number, on: number, was: number): 'new' | 'off' | 'on' {
  if (i < Math.min(on, was)) return 'on';
  if (i < on) return 'new';
  return 'off';
}

export function CrtCells({
  cellClassName,
  className,
  on,
  total,
  was = on,
}: {
  cellClassName?: string | undefined;
  className?: string | undefined;
  on: number;
  total: number;
  was?: number | undefined;
}) {
  return (
    <span aria-hidden="true" className={cn('flex gap-1', className)}>
      {Array.from({ length: total }, (_, i) => (
        <CrtCell
          className={cellClassName}
          key={i}
          state={cellState(i, on, was)}
        />
      ))}
    </span>
  );
}
/** Bordered section with an inverse-video title bar (spec section chrome). */
export function CrtSection({
  children,
  className,
  contentClassName,
  footer,
  label,
  title,
}: PropsWithChildren<{
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
  label?: ReactNode;
  title: ReactNode;
}>) {
  return (
    <section className={cn('border border-phosphor-dim', className)}>
      <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none">
        <span>{title}</span>
        {label ? <span>{label}</span> : null}
      </h2>
      <div className={contentClassName}>{children}</div>
      {footer && <div className="bg-phosphor">{footer}</div>}
    </section>
  );
}

/** Inverse-video key hint (spec `.key`). */
export function CrtKey({ children }: PropsWithChildren) {
  return (
    <span className="bg-primary px-1.25 text-primary-foreground text-shadow-none">
      {children}
    </span>
  );
}

/** The blinking block cursor that trails screen titles (spec `.cur`). */
export function CrtCursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-[0.15em] inline-block h-[0.9em] w-[0.5em] animate-blink bg-primary align-[-0.05em] shadow-(--glow)"
    />
  );
}

const DOTS = {
  err: 'size-3 animate-blink bg-primary shadow-[var(--glow)]',
  run: 'size-3 bg-primary shadow-[var(--glow)]',
  stop: 'size-3 border border-phosphor-dim',
} as const;

/** Status dot: run = lit, stop = hollow, err = blinking (spec `.dot-*`). */
export function CrtDot({ variant }: { variant: keyof typeof DOTS }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block flex-none', DOTS[variant])}
    />
  );
}

/** Fieldset with the dim uppercase legend (spec fieldset/legend). */
export function CrtFieldset({
  children,
  className,
  legend,
}: PropsWithChildren<{ className?: string; legend: ReactNode }>) {
  return (
    <fieldset className={cn('min-w-0 border-0 p-0', className)}>
      <legend className="mb-2 tracking-[0.08em] text-phosphor-dim">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export function CrtOption({
  children,
  className,
  htmlFor,
  off,
  sel,
  ...props
}: ComponentProps<'label'> & {
  off?: boolean;
  sel?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 border border-phosphor-line px-3 hover:border-primary',
        sel && 'border-primary bg-phosphor-faint',
        off && 'cursor-not-allowed opacity-45',
        className,
      )}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
    </label>
  );
}

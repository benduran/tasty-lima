import { CheckIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { PhosphorVariant } from '@/hooks/use-phosphor';
import { PHOSPHOR_COLORS, PHOSPHOR_VARIANTS } from '@/hooks/use-phosphor';
import { cn } from '@/lib/utils';

type PhosphorPickerProps = {
  phosphor: PhosphorVariant;
  onPhosphorChange: (variant: PhosphorVariant) => void;
  className?: string;
};

/**
 * Tube swapper — switches the design system's phosphor channel.
 * Rendered as a bordered button with a live color cell, opening a
 * popover of square swatches like the spec's F9 Theme page.
 */
export function PhosphorPicker({
  phosphor,
  onPhosphorChange,
  className,
}: PhosphorPickerProps) {
  const active = PHOSPHOR_COLORS[phosphor];

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'inline-flex h-10 min-w-32 items-center justify-between gap-2 border border-border bg-transparent px-3 uppercase tracking-[0.04em] transition-colors outline-none select-none hover:bg-primary hover:text-primary-foreground hover:text-shadow-none',
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block size-3 flex-none"
            style={{
              background: active,
              boxShadow: `0 0 1px ${active}, 0 0 9px ${active}59`,
            }}
          />
          Phosphor
        </span>
        <span className="text-phosphor-dim group-data-popup-open/popover:hidden">
          {phosphor}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        <p className="px-2 py-1 text-sm uppercase tracking-[0.08em] text-phosphor-dim">
          Select tube
        </p>
        <div className="flex flex-col">
          {PHOSPHOR_VARIANTS.map(variant => {
            const color = PHOSPHOR_COLORS[variant];
            const selected = variant === phosphor;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  'flex min-h-9 items-center gap-2 px-2 text-left uppercase tracking-[0.04em] transition-colors outline-none select-none',
                  selected
                    ? 'bg-primary text-primary-foreground text-shadow-none'
                    : 'hover:bg-phosphor-faint',
                )}
                key={variant}
                onClick={() => onPhosphorChange(variant)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="inline-block size-3 flex-none"
                  style={{
                    background: color,
                    border: selected ? undefined : '1px solid var(--p-dim)',
                    boxShadow: selected
                      ? `0 0 1px ${color}, 0 0 9px ${color}59`
                      : undefined,
                  }}
                />
                <span className="flex-1">{variant}</span>
                <span className="font-mono text-xs opacity-70">{color}</span>
                {selected ? <CheckIcon className="size-3.5" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type PhosphorGridProps = {
  phosphor: PhosphorVariant;
  onPhosphorChange: (variant: PhosphorVariant) => void;
  className?: string;
  children?: ReactNode;
};

/**
 * Inline variant of the picker — a row of square swatch cells with a
 * status readout, echoing the spec's cell meters.
 */
export function PhosphorGrid({
  phosphor,
  onPhosphorChange,
  className,
  children,
}: PhosphorGridProps) {
  return (
    <div
      aria-label="Phosphor color"
      className={cn(
        'flex flex-wrap items-center gap-2 uppercase tracking-[0.06em]',
        className,
      )}
      role="group"
    >
      {children}
      {PHOSPHOR_VARIANTS.map(variant => {
        const color = PHOSPHOR_COLORS[variant];
        const selected = variant === phosphor;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              'flex h-10 items-center gap-2 border px-3 transition-colors outline-none select-none',
              selected
                ? 'border-primary bg-primary text-primary-foreground text-shadow-none'
                : 'border-border hover:bg-primary hover:text-primary-foreground hover:text-shadow-none',
            )}
            key={variant}
            onClick={() => onPhosphorChange(variant)}
            title={variant}
            type="button"
          >
            <span
              aria-hidden="true"
              className="inline-block size-3 flex-none"
              style={{
                background: color,
                boxShadow: `0 0 1px ${color}, 0 0 9px ${color}59`,
              }}
            />
            {variant}
          </button>
        );
      })}
    </div>
  );
}

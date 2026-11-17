import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '../lib/utils.ts';
import { Checkbox } from './ui/checkbox.tsx';

export function CheckboxRow({
  className,
  hint,
  label,
  ...checkbox
}: ComponentProps<typeof Checkbox> & {
  className?: string;
  hint?: ReactNode;
  label: ReactNode;
}) {
  const internalId = useId();
  return (
    <span
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3',
        checkbox.disabled && 'cursor-not-allowed',
        className,
      )}
    >
      <Checkbox id={internalId} {...checkbox} />
      <label
        className={cn(
          checkbox.disabled && 'cursor-not-allowed text-phosphor-dim uppercase',
        )}
        htmlFor={internalId}
      >
        {label}
      </label>
      {hint && <span className="text-phosphor-dim">{hint}</span>}
    </span>
  );
}

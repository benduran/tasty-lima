import type { ComponentProps, ReactNode } from 'react';
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
  return (
    <span
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3',
        className,
      )}
    >
      <Checkbox {...checkbox} />
      <span>{label}</span>
      {hint != null && <span className="text-phosphor-dim">{hint}</span>}
    </span>
  );
}

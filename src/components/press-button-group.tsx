import type { ReactNode } from 'react';
import { cn } from '../lib/utils.ts';
import { isNullOrUndefined } from '../shared/util.ts';
import { Button } from './ui/button.tsx';

export type PressItem = {
  count?: number;
  id: string;
  label: ReactNode;
  selected?: boolean;
};

export function PressButtonGroup({
  'aria-label': ariaLabel,
  className,
  itemClassName,
  items,
  onChange,
  value,
}: {
  'aria-label': string;
  className?: string;
  itemClassName?: string;
  items: readonly PressItem[];
  onChange?: (id: string) => void;
  value?: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-2', className)}
      role="group"
    >
      {items.map(item => {
        const pressed = isNullOrUndefined(value)
          ? item.selected === true
          : item.id === value;
        return (
          <Button
            aria-pressed={pressed}
            className={itemClassName}
            key={item.id}
            onClick={onChange ? () => onChange(item.id) : undefined}
            type="button"
            variant={pressed ? 'default' : 'outline'}
          >
            {item.label}
            {!isNullOrUndefined(item.count) && <> {item.count}</>}
          </Button>
        );
      })}
    </div>
  );
}

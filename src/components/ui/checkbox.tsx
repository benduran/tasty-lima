'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { cn } from '../../lib/utils.ts';

/* CRT checkbox (spec): 20px square, phosphor border; checked = solid
   glowing block inside — no checkmark glyph, the fill IS the state. */
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer relative flex size-5 shrink-0 items-center justify-center border border-primary bg-transparent transition-colors outline-none group-has-disabled/field:opacity-45 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive',
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="grid place-content-center text-current transition-none"
        data-slot="checkbox-indicator"
      >
        <span className="block size-2.5 bg-primary shadow-[var(--glow)]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };

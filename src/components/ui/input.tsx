import { Input as InputPrimitive } from '@base-ui/react/input';
import type * as React from 'react';
import { cn } from '../../lib/utils.ts';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      className={cn(
        'h-10 w-full min-w-0 border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none caret-primary file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-base file:font-normal file:text-foreground placeholder:text-phosphor-dim focus:border-primary focus:bg-phosphor-faint disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };

import { cn } from '@/lib/utils.ts';

/* CRT key chip (spec `.key`): inverse video — phosphor fill, tube text,
   glow off. Used for keyboard hints and status tags. */
function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-6 w-fit min-w-6 items-center justify-center gap-1 bg-primary px-1.5 font-sans text-sm font-normal tracking-[0.04em] text-primary-foreground text-shadow-none uppercase select-none in-data-[slot=tooltip-content]:bg-background in-data-[slot=tooltip-content]:text-foreground [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <kbd
      className={cn('inline-flex items-center gap-1', className)}
      data-slot="kbd-group"
      {...props}
    />
  );
}

export { Kbd, KbdGroup };

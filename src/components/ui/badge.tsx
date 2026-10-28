import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.ts';

const badgeVariants = cva(
  'group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-2 py-0 font-normal uppercase tracking-[0.06em] whitespace-nowrap transition-colors outline-none focus-visible:border-ring has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground text-shadow-none [a]:hover:bg-primary/85',
        destructive:
          'border-destructive bg-transparent text-destructive [a]:hover:bg-destructive [a]:hover:text-black [a]:hover:text-shadow-none',
        ghost:
          'text-phosphor-dim hover:bg-phosphor-faint hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        outline:
          'border-border bg-transparent text-foreground [a]:hover:bg-primary [a]:hover:text-primary-foreground [a]:hover:text-shadow-none',
        secondary:
          'border-phosphor-line bg-transparent text-foreground [a]:hover:bg-primary [a]:hover:text-primary-foreground [a]:hover:text-shadow-none',
      },
    },
  },
);

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };

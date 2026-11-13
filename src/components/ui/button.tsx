import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.ts';
import { Spinner } from './spinner.tsx';

/*
  CRT button system (spec: `.crt button`):
  transparent face, 1px phosphor-dim border, sharp corners, uppercase,
  tracked-out labels. Hovering inverts the video — phosphor fill, tube
  text, glow off. `.inv` (variant default) is permanently inverted.
*/
const buttonVariants = cva(
  'group/button relative inline-flex shrink-0 items-center justify-center gap-2 border bg-clip-padding text-base font-normal uppercase tracking-[0.04em] whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:not-data-loading:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default:
          'h-10 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        icon: 'size-10 px-0',
        'icon-lg': 'size-11 px-0',
        'icon-sm': 'size-8 px-0',
        'icon-xs': "size-6 px-0 [&_svg:not([class*='size-'])]:size-3",
        lg: 'h-12 min-w-11 px-5 text-xl',
        sm: "h-8 gap-1 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
      },
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground text-shadow-none hover:bg-primary/85',
        destructive:
          'border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-black hover:text-shadow-none',
        ghost:
          'border-transparent bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:text-shadow-none aria-expanded:bg-primary aria-expanded:text-primary-foreground aria-expanded:text-shadow-none',
        link: 'border-transparent bg-transparent text-primary underline-offset-4 hover:underline',
        outline:
          'border-border bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:text-shadow-none aria-expanded:bg-primary aria-expanded:text-primary-foreground aria-expanded:text-shadow-none',
        secondary:
          'border-phosphor-line bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:text-shadow-none aria-expanded:bg-primary aria-expanded:text-primary-foreground aria-expanded:text-shadow-none',
      },
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

function Button({
  className,
  children,
  loading,
  disabled,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ className, size, variant }))}
      data-loading={loading || undefined}
      data-slot="button"
      disabled={disabled || loading}
      {...props}
    >
      {/*
        Children always render and keep occupying space (so the button's
        width — and the page layout — never shifts), but go invisible
        while loading so the spinner overlay fully masks them.
      */}
      <span className={cn('contents', loading && 'invisible')}>{children}</span>
      {loading && (
        <span
          className="absolute inset-0 z-1 grid place-items-center"
          data-slot="button-loading"
        >
          <Spinner className="size-[1em]" />
        </span>
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };

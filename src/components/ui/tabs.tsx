'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils.ts';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn(
        'group/tabs flex gap-2 data-horizontal:flex-col',
        className,
      )}
      data-orientation={orientation}
      data-slot="tabs"
      {...props}
    />
  );
}

/*
  CRT tabs (spec: nav strip of ghost buttons sitting on a phosphor-dim
  rule; the active tab is inverted video and merges into the rule).
*/
const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center gap-1 p-0 text-phosphor-dim group-data-horizontal/tabs:border-b group-data-horizontal/tabs:border-border group-data-vertical/tabs:border-r group-data-vertical/tabs:border-border group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:gap-1 data-[variant=line]:bg-transparent',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-transparent',
        line: 'gap-1 bg-transparent',
      },
    },
  },
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      className={cn(tabsListVariants({ variant }), className)}
      data-slot="tabs-list"
      data-variant={variant}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        'relative inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 border border-transparent px-3 py-0.5 text-base font-normal uppercase tracking-[0.04em] whitespace-nowrap text-primary transition-colors outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-horizontal/tabs:-mb-px group-data-vertical/tabs:-mr-px hover:bg-primary hover:text-primary-foreground hover:text-shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 data-active:bg-primary data-active:text-primary-foreground data-active:text-shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn('flex-1 text-base outline-none', className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };

import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '../lib/utils.ts';
import { isNullOrUndefined } from '../shared/util.ts';

export function Panel({
  as: Tag = 'section',
  children,
  className,
  meta,
  title,
}: PropsWithChildren<{
  as?: 'aside' | 'section';
  className?: string | undefined;
  meta?: ReactNode;
  title: ReactNode;
}>) {
  return (
    <Tag
      className={cn(
        'flex min-w-0 flex-col border border-phosphor-dim',
        className,
      )}
    >
      <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none">
        <span>{title}</span>
        {!isNullOrUndefined(meta) && <span>{meta}</span>}
      </h2>
      {children}
    </Tag>
  );
}

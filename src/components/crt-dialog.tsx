import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function CrtDialog({
  children,
  className,
  footer,
  title,
}: PropsWithChildren<{
  className?: string;
  footer: ReactNode;
  title: ReactNode;
}>) {
  return (
    <section
      aria-modal="true"
      className={cn(
        'flex w-full flex-col border-[3px] border-double border-primary bg-background',
        className,
      )}
      role="dialog"
    >
      <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[22px] tracking-[0.08em] text-primary-foreground text-shadow-none">
        <span>{title}</span>
        <span>ESC</span>
      </h2>
      <div className="flex flex-col gap-4.5 p-5.5">{children}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-phosphor-line px-5.5 py-3.5">
        {footer}
      </div>
    </section>
  );
}

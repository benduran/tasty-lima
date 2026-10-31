import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '../lib/utils.ts';

export function LabeledField({
  children,
  className,
  htmlFor,
  label,
  message,
  messageId,
}: PropsWithChildren<{
  className?: string;
  htmlFor: string;
  label: ReactNode;
  message?: ReactNode;
  messageId?: string;
}>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="tracking-[0.08em] text-phosphor-dim" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {message != null && <p id={messageId}>{message}</p>}
    </div>
  );
}

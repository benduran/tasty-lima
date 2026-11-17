import type { ReactNode } from 'react';

type AppFooterProps = {
  left: ReactNode;
  /** Right-aligned dim note */
  right: ReactNode;
};

export function AppFooter({ left, right }: AppFooterProps) {
  return (
    <footer className="flex items-center justify-between gap-x-5 gap-y-1.5 border-t-[3px] border-double border-phosphor-dim px-6 py-2.5 shrink-0 text-xs">
      <span className="inline-flex gap-1">{left}</span>
      <span className="text-phosphor-dim">{right}</span>
    </footer>
  );
}

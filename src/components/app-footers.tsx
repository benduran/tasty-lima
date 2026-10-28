import type { ReactNode } from 'react';
import { CrtKey } from './crt.tsx';

type AppFooterProps = {
  /** [key label, action label] pairs, rendered left to right */
  keys: [string, string][];
  /** Right-aligned dim note */
  note: ReactNode;
};

export function AppFooter({ keys, note }: AppFooterProps) {
  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t-[3px] border-double border-phosphor-dim px-6 py-2.5">
      {keys.map(([key, action]) => (
        <span key={key}>
          <CrtKey>{key}</CrtKey> {action}
        </span>
      ))}
      <span className="ml-auto text-phosphor-dim">{note}</span>
    </footer>
  );
}

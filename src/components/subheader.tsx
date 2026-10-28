import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { CrtCursor } from './crt.tsx';

type SubheaderProps = {
  actions?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
};

export function Subheader({ actions, subtitle, title }: SubheaderProps) {
  return (
    <div className="flex items-start justify-between gap-x-8 gap-y-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-6xl uppercase">
          {title}
          <CrtCursor />
        </h1>
        {subtitle && <p className="text-phosphor-dim">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          {actions}
        </div>
      )}
    </div>
  );
}

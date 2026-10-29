import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { Link } from 'wouter';
import { CrtCursor } from './crt.tsx';

type Crumb = {
  title: ReactNode;
  url: string;
};

type SubheaderProps = {
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  subtitle?: ReactNode;
  title: ReactNode;
};

export function Subheader({
  actions,
  breadcrumbs,
  subtitle,
  title,
}: SubheaderProps) {
  return (
    <div className="flex items-end justify-between gap-x-8 gap-y-5">
      <div className="flex flex-col gap-1.5">
        {breadcrumbs && (
          <div className="text-phosphor-dim">
            {breadcrumbs.map((b, i) => {
              if (i === breadcrumbs.length - 1) {
                return <Fragment key={b.url}>{b.title}</Fragment>;
              }
              return (
                <Link href={b.url} key={b.url}>
                  {b.title}
                </Link>
              );
            })}
          </div>
        )}
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

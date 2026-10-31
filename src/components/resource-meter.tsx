import type { PropsWithChildren } from 'react';
import { CrtCells } from './crt.tsx';
import { Button } from './ui/button.tsx';

export function ResourceMeter({
  children,
  decDescribedBy,
  decDisabled,
  decLabel,
  incDisabled,
  incLabel,
  label,
  on,
  outputClassName,
  total,
  was,
}: PropsWithChildren<{
  decDescribedBy?: string;
  decDisabled?: boolean;
  decLabel: string;
  incDisabled?: boolean;
  incLabel: string;
  label: string;
  on: number;
  outputClassName?: string;
  total: number;
  was?: number;
}>) {
  return (
    <>
      <span>{label}</span>
      <Button
        aria-describedby={decDescribedBy}
        aria-label={decLabel}
        className="w-11 px-0"
        disabled={decDisabled}
        type="button"
        variant="outline"
      >
        -
      </Button>
      <CrtCells on={on} total={total} was={was ?? on} />
      <Button
        aria-label={incLabel}
        className="w-11 px-0"
        disabled={incDisabled}
        type="button"
        variant="outline"
      >
        +
      </Button>
      <output className={outputClassName}>{children}</output>
    </>
  );
}

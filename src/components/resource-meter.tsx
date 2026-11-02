import type { PropsWithChildren } from 'react';
import { CrtCells } from './crt.tsx';
import { Button } from './ui/button.tsx';

type ResourceMeterProps = PropsWithChildren<{
  decDescribedBy?: string;
  decDisabled?: boolean;
  decLabel: string;
  incDisabled?: boolean;
  incLabel: string;
  label: string;
  on: number;
  onChange: (newVal: number) => void;
  outputClassName?: string;
  total: number;
  was?: number;
}>;

export function ResourceMeter({
  children,
  decDescribedBy,
  decDisabled,
  decLabel,
  incDisabled,
  incLabel,
  label,
  on,
  onChange,
  outputClassName,
  total,
  was,
}: ResourceMeterProps) {
  return (
    <>
      <span>{label}</span>
      <Button
        aria-describedby={decDescribedBy}
        aria-label={decLabel}
        className="w-11 px-0"
        disabled={decDisabled}
        onClick={() => onChange(Math.max(on - 1, 1))}
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
        onClick={() => onChange(Math.min(on + 1, total))}
        type="button"
        variant="outline"
      >
        +
      </Button>
      <output className={outputClassName}>{children}</output>
    </>
  );
}

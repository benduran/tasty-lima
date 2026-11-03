import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import type { PropsWithChildren } from 'react';
import { useId, useState } from 'react';
import { cn } from '../lib/utils.ts';
import { CrtCells } from './crt.tsx';

/** The bar is always this wide, so meters line up in a row. */
const BAR_WIDTH_CLASS = 'w-[136px]' as const;
const CELL_GAP_PX = 4 as const;

type ResourceMeterProps = PropsWithChildren<{
  decDescribedBy?: string;
  decDisabled?: boolean;
  decLabel: string;
  incDisabled?: boolean;
  incLabel: string;
  label: string;
  /** Smallest selectable value. Defaults to `step`. */
  min?: number;
  on: number;
  onChange?: (newVal: number) => void;
  outputClassName?: string;
  /** Value granularity, in the same unit as `on`/`total`. Default 1. */
  step?: number;
  /** Most cells ever rendered; display coarsens past this. Default 10. */
  maxCells?: number;
  total: number;
  was?: number;
}>;

/**
 * Resource meter: the CRT cells are the bar itself, and a transparent slider
 * sits on top, snapping one notch per `step` (spec `.cell-*`).
 *
 * Values and display are deliberately separate: the slider always exposes
 * every `step` increment from `min`..`total` (1..10 CPUs with `step=1` still
 * means 10 positions), while the bar shows at most `maxCells` chunks that
 * fill proportionally. When `step`s fit within `maxCells`, one notch is
 * exactly one cell — the original cell-snapping. Without `onChange` the
 * meter keeps a local demo value so it is still draggable.
 */
export function ResourceMeter({
  children,
  decDescribedBy,
  decDisabled,
  decLabel,
  incDisabled,
  incLabel,
  label,
  maxCells = 10,
  min: minValue,
  on,
  onChange,
  outputClassName,
  step = 1,
  total,
  was,
}: ResourceMeterProps) {
  const hintId = useId();

  /* Value space: every `step`-sized notch between gridMin and total. */
  const gridMin = minValue ?? step;
  const steps = Math.max(1, Math.floor((total - gridMin) / step) + 1);
  const toSlot = (value: number) =>
    Math.min(steps, Math.max(1, Math.round((value - gridMin) / step) + 1));
  const toValue = (slot: number) => gridMin + (slot - 1) * step;

  /* Display space: capped chunks, filled proportionally. If the value grid
     fits (steps <= maxCells) the two are 1:1 and each notch is a cell. */
  const cells = Math.max(1, Math.min(steps, maxCells));
  const toLit = (slot: number) =>
    steps === 1 || cells === steps
      ? slot
      : Math.round(((slot - 1) * (cells - 1)) / (steps - 1)) + 1;

  const disabled = decDisabled && incDisabled;

  /* With no onChange (demo/static pages) the meter keeps its own value so
     the slider still moves; with one it is fully controlled. */
  const [demoValue, setDemoValue] = useState(on);
  const current = onChange ? on : demoValue;
  const onSlot = toSlot(current);
  const wasSlot = toSlot(was ?? current);
  const describedBy = [decDescribedBy, hintId].filter(Boolean).join(' ');

  return (
    <>
      <span>{label}</span>
      <div className={cn('relative inline-flex', BAR_WIDTH_CLASS)}>
        <CrtCells
          cellClassName="flex-1 basis-0"
          className="w-full"
          on={toLit(onSlot)}
          total={cells}
          was={toLit(wasSlot)}
        />
        <SliderPrimitive.Root
          className="absolute inset-0"
          disabled={disabled}
          max={incDisabled ? onSlot : steps}
          min={decDisabled ? onSlot : 1}
          onValueChange={([slot = onSlot]) => {
            const value = toValue(slot);
            if (onChange) {
              onChange(value);
            } else {
              setDemoValue(value);
            }
          }}
          step={1}
          thumbAlignment="edge"
          value={[onSlot]}
        >
          <SliderPrimitive.Control className="relative flex h-full w-full items-center">
            {/* The lit cells are the track fill, so hide the primitives'. */}
            <SliderPrimitive.Track className="h-1 w-full grow bg-transparent" />
            <SliderPrimitive.Thumb
              aria-describedby={describedBy}
              aria-label={label}
              className={cn(
                'block h-[18px] flex-none border border-primary bg-(--bg) shadow-(--glow)',
                disabled ? 'invisible' : 'cursor-grab active:cursor-grabbing',
              )}
              style={{
                width: `calc((100% - ${(cells - 1) * CELL_GAP_PX}px) / ${cells})`,
              }}
            />
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>
        <span className="sr-only" id={hintId}>
          {decLabel}: drag left or press the down arrow key. {incLabel}: drag
          right or press the up arrow key. Each step is {step}.
        </span>
      </div>
      <output className={outputClassName}>{children}</output>
    </>
  );
}

import { Fragment } from 'react';
import type { LimaMount, LimaMountType, Nullish } from '../../shared/types.ts';
import { CheckboxRow } from '../checkbox-row.tsx';
import { CrtFieldset, CrtOption, CrtSection } from '../crt.tsx';
import { MountsTable } from '../mounts-table.tsx';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx';

type MountsSectionProps = {
  mountHostHome: boolean;
  mountType: Nullish<LimaMountType>;
  /** options the currently selected driver accepts */
  mountTypes: LimaMountType[];
  mounts: LimaMount[];
  onAddMount: () => void;
  onChangeMount: (index: number, mount: LimaMount) => void;
  onMountHostHomeChange: (checked: boolean) => void;
  onMountTypeChange: (value: string) => void;
  onRemoveMount: (index: number) => void;
};

export function MountsSection({
  mountHostHome,
  mountType,
  mountTypes,
  mounts,
  onAddMount,
  onChangeMount,
  onMountHostHomeChange,
  onMountTypeChange,
  onRemoveMount,
}: MountsSectionProps) {
  return (
    <CrtSection contentClassName="flex flex-col gap-4 p-5" title="[3] MOUNTS">
      <CrtFieldset legend="MOUNT TYPE">
        <RadioGroup
          onValueChange={onMountTypeChange}
          value={mountType ?? 'auto'}
        >
          <CrtOption sel>
            <Fragment key="auto">
              <RadioGroupItem id="auto" value="auto" />
              <label className="hover:cursor-pointer" htmlFor="auto">
                auto
              </label>
            </Fragment>
            {mountTypes.map(mountTypeOpt => (
              <Fragment key={mountTypeOpt}>
                <RadioGroupItem
                  className="not-first:ml-4"
                  id={mountTypeOpt}
                  value={mountTypeOpt}
                />
                <label className="hover:cursor-pointer" htmlFor={mountTypeOpt}>
                  {mountTypeOpt}
                </label>
              </Fragment>
            ))}
          </CrtOption>
        </RadioGroup>
      </CrtFieldset>
      <CheckboxRow
        checked={mountHostHome}
        hint="read-only"
        label="MOUNT HOST HOME"
        onCheckedChange={onMountHostHomeChange}
      />
      <p className="text-phosphor-dim text-xs tracking-[0.08em] uppercase">
        the vm can only see the host folders listed here. folders the template
        would normally share are left out.
      </p>
      <MountsTable
        mounts={mounts}
        onAddMount={onAddMount}
        onChangeMount={onChangeMount}
        onRemoveMount={onRemoveMount}
      />
    </CrtSection>
  );
}
